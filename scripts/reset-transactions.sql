-- Reset transactions table
DELETE FROM transactions;

-- Verify the table is empty
SELECT COUNT(*) as remaining_records FROM transactions;

-- Optional: Insert some fresh sample data
INSERT INTO transactions (type, amount, description, date) VALUES
('income', 500000, 'Saldo awal kas ekstrakurikuler', CURRENT_DATE),
('expense', 150000, 'Pembelian shuttlecock (3 slop)', CURRENT_DATE - INTERVAL '1 day');

-- Show final result
SELECT * FROM transactions ORDER BY created_at DESC;
