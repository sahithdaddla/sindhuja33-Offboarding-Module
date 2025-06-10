
CREATE TABLE offboarding_requests (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(50) NOT NULL,
    employee_id VARCHAR(7) NOT NULL,
    email VARCHAR(60) NOT NULL,
    department VARCHAR(50) NOT NULL,
    position VARCHAR(40) NOT NULL,
    last_work_day DATE NOT NULL,
    personal_email VARCHAR(30) NOT NULL,
    phone_number VARCHAR(10) NOT NULL,
    alternate_contact_name VARCHAR(30),
    alternate_contact_number VARCHAR(10),
    current_address TEXT NOT NULL,
    current_projects TEXT NOT NULL,
    project_status TEXT NOT NULL,
    handover_person VARCHAR(30) NOT NULL,
    resignation_reason VARCHAR(50) NOT NULL,
    other_reason_details TEXT,
    feedback TEXT NOT NULL,
    would_recommend VARCHAR(10),
    assets JSONB NOT NULL,
    laptop_serial VARCHAR(15),
    phone_serial VARCHAR(15),
    monitor_serial VARCHAR(15),
    access_card_number VARCHAR(15),
    additional_assets TEXT,
    status VARCHAR(10) NOT NULL DEFAULT 'Pending',
    submission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_employee_id CHECK (employee_id ~ '^ATS0(?!000)\d{3}$'),
    CONSTRAINT valid_email CHECK (email ~ '^[a-zA-Z0-9]{3,50}@astrolitetech\.com$'),
    CONSTRAINT valid_personal_email CHECK (personal_email ~ '^[a-zA-Z0-9.]{5,20}@(gmail\.com|yahoo\.com|outlook\.com)$'),
    CONSTRAINT valid_phone_number CHECK (phone_number ~ '^[6-9]\d{9}$'),
    CONSTRAINT valid_alternate_contact_number CHECK (alternate_contact_number ~ '^[6-9]\d{9}$' OR alternate_contact_number IS NULL),
    CONSTRAINT valid_status CHECK (status IN ('Pending', 'Approved', 'Rejected'))
);

CREATE INDEX idx_employee_id ON offboarding_requests (employee_id);
CREATE INDEX idx_email ON offboarding_requests (email);
CREATE INDEX idx_status ON offboarding_requests (status);
CREATE INDEX idx_submission_date ON offboarding_requests (submission_date);
