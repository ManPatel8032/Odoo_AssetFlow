-- Audit cycles and items
CREATE TABLE IF NOT EXISTS audit_cycles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active' NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cycle_id UUID REFERENCES audit_cycles(id) ON DELETE CASCADE NOT NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
    audited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    audited_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL, -- pending, verified, missing
    notes TEXT
);
