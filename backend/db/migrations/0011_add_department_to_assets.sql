-- Add department_id to assets
ALTER TABLE assets 
ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
