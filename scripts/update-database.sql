-- Create members table
CREATE TABLE IF NOT EXISTS members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  class VARCHAR(20) NOT NULL,
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create member_payments table
CREATE TABLE IF NOT EXISTS member_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  payment_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, month, year)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);
CREATE INDEX IF NOT EXISTS idx_member_payments_member_id ON member_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_member_payments_month_year ON member_payments(month, year);

-- Insert sample members
INSERT INTO members (name, class, phone, status) VALUES
('Ahmad Rizki', '12 IPA 1', '081234567890', 'active'),
('Siti Nurhaliza', '12 IPA 2', '081234567891', 'active'),
('Budi Santoso', '11 IPS 1', '081234567892', 'active'),
('Dewi Sartika', '11 IPA 1', '081234567893', 'active'),
('Eko Prasetyo', '12 IPS 2', '081234567894', 'active'),
('Fitri Handayani', '10 IPA 1', '081234567895', 'active'),
('Gilang Ramadhan', '10 IPS 1', '081234567896', 'active'),
('Hana Pertiwi', '11 IPA 2', '081234567897', 'active');

-- Insert sample payments
INSERT INTO member_payments (member_id, amount, month, year, payment_date, notes) 
SELECT 
  m.id,
  25000,
  1,
  2024,
  '2024-01-15',
  'Pembayaran kas Januari 2024'
FROM members m 
WHERE m.name IN ('Ahmad Rizki', 'Siti Nurhaliza', 'Budi Santoso', 'Dewi Sartika');

INSERT INTO member_payments (member_id, amount, month, year, payment_date, notes) 
SELECT 
  m.id,
  25000,
  2,
  2024,
  '2024-02-15',
  'Pembayaran kas Februari 2024'
FROM members m 
WHERE m.name IN ('Ahmad Rizki', 'Siti Nurhaliza');
