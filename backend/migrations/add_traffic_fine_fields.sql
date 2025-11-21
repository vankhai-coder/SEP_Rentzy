-- Migration: Add traffic fine fields to bookings table
-- Date: 2025-11-21

ALTER TABLE `bookings` 
ADD COLUMN `traffic_fine_amount` DECIMAL(12, 2) DEFAULT 0 AFTER `delivery_fee`,
ADD COLUMN `traffic_fine_paid` DECIMAL(12, 2) DEFAULT 0 AFTER `traffic_fine_amount`,
ADD COLUMN `traffic_fine_description` TEXT NULL AFTER `traffic_fine_paid`;

