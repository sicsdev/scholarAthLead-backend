CREATE TABLE IF NOT EXISTS bookingSchema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    package VARCHAR(255) NOT NULL,
    amount INT NOT NULL,
    payment_status ENUM('Paid', 'Unpaid') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES userSchema(id) ON DELETE CASCADE
);
