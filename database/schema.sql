-- DESTRUCTIVE development reset. Back up existing data before running.
SET NAMES utf8mb4;
DROP TABLE IF EXISTS maintenance_reports;
DROP TABLE IF EXISTS damage_reports;
DROP TABLE IF EXISTS borrow_requests;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
CREATE TABLE users (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE,
 password_hash VARCHAR(255) NOT NULL, role ENUM('user','admin') NOT NULL DEFAULT 'user',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE categories (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE equipment (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 equipment_code VARCHAR(50) NOT NULL UNIQUE, name VARCHAR(150) NOT NULL,
 description TEXT, category_id INT UNSIGNED NOT NULL,
 total_quantity INT UNSIGNED NOT NULL, available_quantity INT UNSIGNED NOT NULL,
 location VARCHAR(100) NOT NULL,
 status ENUM('AVAILABLE','UNDER_MAINTENANCE','ARCHIVED') NOT NULL DEFAULT 'AVAILABLE',
 is_active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
 CHECK (available_quantity <= total_quantity),
 INDEX idx_equipment_filter(category_id,status,is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE borrow_requests (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 user_id INT UNSIGNED NOT NULL, equipment_id INT UNSIGNED NOT NULL,
 quantity INT UNSIGNED NOT NULL CHECK (quantity > 0),
 status ENUM('PENDING','APPROVED','REJECTED','BORROWED','RETURN_REQUESTED','RETURNED','CANCELLED') NOT NULL DEFAULT 'PENDING',
 request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 approved_by INT UNSIGNED NULL, approved_at DATETIME NULL, borrow_date DATETIME NULL,
 expected_return_date DATE NOT NULL, actual_return_date DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
 FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT,
 FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE RESTRICT,
 CHECK (expected_return_date >= DATE(request_date)),
 CHECK ((status = 'RETURNED') = (actual_return_date IS NOT NULL)),
 INDEX idx_requests_user(user_id,status), INDEX idx_requests_due(status,expected_return_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE maintenance_reports (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 equipment_id INT UNSIGNED NOT NULL, reported_by INT UNSIGNED NOT NULL,
 issue_description TEXT NOT NULL,
 status ENUM('OPEN','IN_PROGRESS','RESOLVED') NOT NULL DEFAULT 'OPEN',
 resolution TEXT NULL,
 reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, resolved_at DATETIME NULL,
 FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT,
 FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE RESTRICT,
 CHECK ((status = 'RESOLVED') = (resolved_at IS NOT NULL)),
 INDEX idx_maintenance_equipment(equipment_id,status), INDEX idx_maintenance_reporter(reported_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
