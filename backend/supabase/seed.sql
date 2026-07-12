-- Seed initial departments
INSERT INTO departments (id, name) VALUES
(gen_random_uuid(), 'Engineering'),
(gen_random_uuid(), 'Marketing'),
(gen_random_uuid(), 'Human Resources')
ON CONFLICT (name) DO NOTHING;

-- Seed initial categories
INSERT INTO categories (id, name) VALUES
(gen_random_uuid(), 'Laptops'),
(gen_random_uuid(), 'Monitors'),
(gen_random_uuid(), 'Mobile Devices')
ON CONFLICT (name) DO NOTHING;
