-- Add technician and resolution_notes to maintenance table
ALTER TABLE maintenance 
ADD COLUMN IF NOT EXISTS technician VARCHAR(255),
ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
