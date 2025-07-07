const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const port = 3207;

// Database connection configuration
const pool = new Pool({
    user: 'postgres',
    host: 'postgres',
    database: 'offboarding_db',
    password: 'admin123',
    port: 5432,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files (HTML, CSS, JS)

// Helper function to validate input data
const validateRequestData = (data) => {
    const requiredFields = [
        'fullName', 'employeeId', 'email', 'department', 'position',
        'lastWorkDay', 'personalEmail', 'phoneNumber', 'currentAddress',
        'currentProjects', 'projectStatus', 'handoverPerson', 'resignationReason', 'feedback'
    ];

    for (const field of requiredFields) {
        if (!data[field] || !data[field].trim()) {
            return { isValid: false, message: `${field} is required` };
        }
    }

    // Validate email formats
    if (!/^[a-zA-Z0-9]{3,50}@astrolitetech\.com$/.test(data.email)) {
        return { isValid: false, message: 'Invalid company email format' };
    }
    if (!/^[a-zA-Z0-9.]{5,20}@(gmail\.com|yahoo\.com|outlook\.com)$/.test(data.personalEmail)) {
        return { isValid: false, message: 'Invalid personal email format' };
    }

    // Validate employee ID
    if (!/^ATS0(?!000)\d{3}$/.test(data.employeeId)) {
        return { isValid: false, message: 'Invalid employee ID format' };
    }

    // Validate phone number format
    if (!/^[6-9]\d{9}$/.test(data.phoneNumber)) {
        return { isValid: false, message: 'Invalid phone number format' };
    }

    return { isValid: true };
};

// API endpoint to submit offboarding request
app.post('/api/offboarding', async (req, res) => {
    const data = req.body;
    const validation = validateRequestData(data);

    if (!validation.isValid) {
        return res.status(400).json({ error: validation.message });
    }

    try {
        // Check for duplicate submission
        const duplicateCheck = await pool.query(
            `SELECT * FROM offboarding_requests 
             WHERE employee_id = $1 AND email = $2 
             AND DATE(submission_date) = CURRENT_DATE`,
            [data.employeeId, data.email]
        );

        if (duplicateCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Duplicate submission detected for today' });
        }

        // Insert new request
        const query = `
            INSERT INTO offboarding_requests (
                full_name, employee_id, email, department, position, last_work_day,
                personal_email, phone_number, alternate_contact_name, alternate_contact_number,
                current_address, current_projects, project_status, handover_person,
                resignation_reason, other_reason_details, feedback, would_recommend,
                assets, laptop_serial, phone_serial, monitor_serial, access_card_number,
                additional_assets, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
            RETURNING id
        `;

        const values = [
            data.fullName,
            data.employeeId,
            data.email,
            data.department,
            data.position,
            data.lastWorkDay,
            data.personalEmail,
            data.phoneNumber,
            data.alternateContactName || null,
            data.alternateContactNumber || null,
            data.currentAddress,
            data.currentProjects,
            data.projectStatus,
            data.handoverPerson,
            data.resignationReason,
            data.otherReasonDetails || null,
            data.feedback,
            data.wouldRecommend || null,
            JSON.stringify(data.assets || []),
            data.laptopSerial || null,
            data.phoneSerial || null,
            data.monitorSerial || null,
            data.accessCardNumber || null,
            data.additionalAssets || null,
            'Pending'
        ];

        const result = await pool.query(query, values);
        res.status(201).json({ message: 'Offboarding request submitted successfully', id: result.rows[0].id });
    } catch (error) {
        console.error('Error submitting offboarding request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to get all offboarding requests
app.get('/api/offboarding', async (req, res) => {
    const { search = '', status = 'All' } = req.query;
    try {
        let query = `
            SELECT * FROM offboarding_requests
            WHERE (full_name ILIKE $1 OR department ILIKE $1)
        `;
        const values = [`%${search}%`];

        if (status !== 'All') {
            query += ` AND status = $2`;
            values.push(status);
        }

        const result = await pool.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching offboarding requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to get a single offboarding request by ID
app.get('/api/offboarding/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = `SELECT * FROM offboarding_requests WHERE id = $1`;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching offboarding request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to update offboarding request status
app.put('/api/offboarding/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        const query = `
            UPDATE offboarding_requests 
            SET status = $1, updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
            RETURNING id, status
        `;
        const result = await pool.query(query, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }

        res.json({ message: `Request ${status.toLowerCase()} successfully`, id: result.rows[0].id });
    } catch (error) {
        console.error('Error updating offboarding request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API endpoint to delete all offboarding requests
app.delete('/api/offboarding', async (req, res) => {
    try {
        const query = `DELETE FROM offboarding_requests`;
        await pool.query(query);
        res.json({ message: 'All offboarding requests deleted successfully' });
    } catch (error) {
        console.error('Error deleting offboarding requests:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://3.85.61.23:${port}`);
});