-- Database schema for Marathi Ledger Book
-- Run this SQL in phpMyAdmin or MySQL command line

CREATE DATABASE IF NOT EXISTS marathi_ledger CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE marathi_ledger;

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    khate_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_khate_number (khate_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Entries table
CREATE TABLE IF NOT EXISTS entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    receipt_number VARCHAR(100) DEFAULT NULL,
    details TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type ENUM('जमा', 'नावे') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_account_number (account_number),
    INDEX idx_date (date),
    INDEX idx_type (type),
    FOREIGN KEY (account_number) REFERENCES accounts(khate_number) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional)
INSERT INTO accounts (khate_number, name) VALUES 
('1', 'राम शर्मा'),
('2', 'श्याम पाटील'),
('3', 'गीता देवी')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO entries (date, account_number, receipt_number, details, amount, type) VALUES 
('2025-01-15', '1', 'R001', 'राम शर्मा\nपैसे जमा केले', 1000.00, 'जमा'),
('2025-01-16', '1', 'R002', 'राम शर्मा\nपैसे काढले', 500.00, 'नावे'),
('2025-01-17', '2', 'R003', 'श्याम पाटील\nशुल्क भरले', 2000.00, 'जमा')
ON DUPLICATE KEY UPDATE details = VALUES(details);