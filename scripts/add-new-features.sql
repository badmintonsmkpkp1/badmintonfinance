-- Add category column to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Create budget table
CREATE TABLE IF NOT EXISTS budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(50) NOT NULL,
  monthly_limit DECIMAL(15,2) NOT NULL CHECK (monthly_limit > 0),
  year INTEGER NOT NULL CHECK (year >= 2020),
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, year, month)
);

-- Create payment reminders table
CREATE TABLE IF NOT EXISTS payment_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  reminder_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'paid')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(member_id, month, year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_budgets_category_date ON budgets(category, year, month);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_status ON payment_reminders(status);
CREATE INDEX IF NOT EXISTS idx_payment_reminders_date ON payment_reminders(reminder_date);

-- Update existing transactions with categories
UPDATE transactions 
SET category = CASE 
  WHEN description ILIKE '%kas%' OR description ILIKE '%iuran%' THEN 'kas-anggota'
  WHEN description ILIKE '%shuttlecock%' OR description ILIKE '%raket%' THEN 'peralatan'
  WHEN description ILIKE '%lapangan%' OR description ILIKE '%sewa%' THEN 'sewa-lapangan'
  WHEN description ILIKE '%minum%' OR description ILIKE '%konsumsi%' THEN 'konsumsi'
  WHEN description ILIKE '%transport%' THEN 'transport'
  ELSE 'lainnya'
END
WHERE category IS NULL;

-- Insert sample budget data
INSERT INTO budgets (category, monthly_limit, year, month, description) VALUES
('peralatan', 300000, 2024, 12, 'Budget untuk pembelian shuttlecock dan peralatan latihan'),
('sewa-lapangan', 200000, 2024, 12, 'Budget untuk sewa lapangan latihan'),
('konsumsi', 100000, 2024, 12, 'Budget untuk air minum dan snack latihan'),
('transport', 150000, 2024, 12, 'Budget untuk transport ke turnamen'),
('lainnya', 100000, 2024, 12, 'Budget untuk keperluan lain-lain');

-- Insert sample reminders for unpaid members
INSERT INTO payment_reminders (member_id, month, year, reminder_date, message)
SELECT 
  m.id,
  EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER,
  EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  CURRENT_DATE + INTERVAL '3 days',
  'Reminder: Pembayaran kas bulan ' || TO_CHAR(CURRENT_DATE, 'Month YYYY') || ' belum dilakukan'
FROM members m
WHERE m.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM member_payments mp 
  WHERE mp.member_id = m.id 
  AND mp.month = EXTRACT(MONTH FROM CURRENT_DATE)
  AND mp.year = EXTRACT(YEAR FROM CURRENT_DATE)
)
ON CONFLICT (member_id, month, year) DO NOTHING;
