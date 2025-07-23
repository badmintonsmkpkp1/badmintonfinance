-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Insert sample data
INSERT INTO transactions (type, amount, description, date) VALUES
('income', 500000, 'Iuran bulanan anggota - Januari 2024', '2024-01-15'),
('income', 200000, 'Donasi dari alumni', '2024-01-20'),
('expense', 150000, 'Pembelian shuttlecock (2 slop)', '2024-01-22'),
('expense', 75000, 'Sewa lapangan untuk latihan', '2024-01-25'),
('income', 500000, 'Iuran bulanan anggota - Februari 2024', '2024-02-15'),
('expense', 100000, 'Pembelian seragam latihan', '2024-02-18'),
('expense', 50000, 'Air minum untuk latihan', '2024-02-20');
