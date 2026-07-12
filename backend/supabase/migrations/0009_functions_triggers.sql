-- Functions and triggers
CREATE OR REPLACE FUNCTION promote_employee(employee_id UUID, new_role user_role)
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET role = new_role
    WHERE id = employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
