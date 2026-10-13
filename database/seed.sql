-- Development-only demo credentials; never use these accounts in production.
-- admin@lab.edu / Admin@123; arjun@uni.edu and sara@uni.edu / Student@123
SET NAMES utf8mb4;
INSERT INTO users(id,name,email,password_hash,role) VALUES
(1,'Lab Administrator','admin@lab.edu','$2b$10$UQ/qMa6U3SKp9Zc20GYbwu8L9GRtDv2qapGIdohK9jP.0/doZdw02','admin'),
(2,'Arjun Mehta','arjun@uni.edu','$2b$10$LdVsLE5NIawIoSAcEftnJOuRdFLrFLCBSgbHrUFs1Ikkd/aCm.5f6','user'),
(3,'Sara Thomas','sara@uni.edu','$2b$10$LdVsLE5NIawIoSAcEftnJOuRdFLrFLCBSgbHrUFs1Ikkd/aCm.5f6','user');
INSERT INTO categories(id,name) VALUES (1,'Electronics'),(2,'Measurement & Testing'),(3,'Optics'),(4,'Computing & Embedded');
INSERT INTO equipment(id,equipment_code,name,description,category_id,total_quantity,available_quantity,location,status) VALUES
(1,'OSC-001','Digital Oscilloscope','4-channel 100 MHz Rigol oscilloscopes.',1,4,3,'Electronics Lab','AVAILABLE'),
(2,'DMM-001','Digital Multimeter','True-RMS meters with probe leads.',2,8,7,'Measurement Cabinet','AVAILABLE'),
(3,'MIC-001','Compound Microscope','Binocular 40x–1000x microscopes.',3,3,3,'Biology Lab','AVAILABLE'),
(4,'RPI-001','Raspberry Pi 4 Kit','4 GB board, PSU, case and microSD.',4,5,5,'Embedded Lab','AVAILABLE'),
(5,'PSU-001','Bench Power Supply','Triple-output adjustable power supplies.',1,3,3,'Electronics Lab','UNDER_MAINTENANCE'),
(6,'ARD-001','Arduino Starter Kit','Uno boards with sensors and breadboards.',4,10,10,'Embedded Lab','AVAILABLE'),
(7,'CAL-001','Digital Vernier Caliper','150 mm stainless digital calipers.',2,6,6,'Measurement Cabinet','AVAILABLE');
INSERT INTO borrow_requests(id,user_id,equipment_id,quantity,status,request_date,expected_return_date,approved_by,approved_at,borrow_date) VALUES
(1,2,1,1,'BORROWED',UTC_TIMESTAMP()-INTERVAL 10 DAY,UTC_DATE()-INTERVAL 2 DAY,1,UTC_TIMESTAMP()-INTERVAL 9 DAY,UTC_TIMESTAMP()-INTERVAL 9 DAY),
(2,3,2,1,'APPROVED',UTC_TIMESTAMP()-INTERVAL 1 DAY,UTC_DATE()+INTERVAL 7 DAY,1,UTC_TIMESTAMP(),NULL),
(3,2,4,1,'PENDING',UTC_TIMESTAMP(),UTC_DATE()+INTERVAL 14 DAY,NULL,NULL,NULL),
(4,3,6,2,'REJECTED',UTC_TIMESTAMP(),UTC_DATE()+INTERVAL 4 DAY,NULL,NULL,NULL);
INSERT INTO maintenance_reports(equipment_id,reported_by,issue_description,status) VALUES
(5,2,'Output voltage fluctuates at low current.','IN_PROGRESS'),
(2,3,'One probe lead has damaged insulation.','OPEN');
