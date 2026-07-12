-- Alter status column in maintenance table to support new statuses
ALTER TABLE maintenance ALTER COLUMN status TYPE VARCHAR(50);
-- Migrate existing statuses
UPDATE maintenance SET status = 'pending' WHERE status = 'scheduled';
UPDATE maintenance SET status = 'resolved' WHERE status = 'completed';
