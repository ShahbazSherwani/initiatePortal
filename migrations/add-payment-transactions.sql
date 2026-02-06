-- PayMongo Payment Transactions Table
-- Run this migration to create the payment_transactions table

CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) NOT NULL,
    project_id INTEGER REFERENCES projects(id),
    amount DECIMAL(15, 2) NOT NULL,
    paymongo_checkout_id VARCHAR(255),
    paymongo_reference VARCHAR(255),
    paymongo_payment_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    payment_method VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_transactions_firebase_uid ON payment_transactions(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_project_id ON payment_transactions(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_checkout_id ON payment_transactions(paymongo_checkout_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Add comment
COMMENT ON TABLE payment_transactions IS 'Stores PayMongo payment transactions for investments';
