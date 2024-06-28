CREATE TABLE IF NOT EXISTS booking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount INT NOT NULL,
    status ENUM('Active', 'Cancelled') DEFAULT 'Active' NOT NULL,
    subscription_id VARCHAR(255),
    customer_id VARCHAR(255),
    card_type VARCHAR(50) NOT NULL,
    schedule_time TIME NOT NULL,
    schedule_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
