-- submitFormSchema.sql
CREATE TABLE IF NOT EXISTS userSchema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_name_prefix ENUM('Mr.', 'Mrs.') NOT NULL,
    parent_name VARCHAR(255) NOT NULL,
    student_name_prefix ENUM('Mr.', 'Mrs.') NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    age INT CHECK(age BETWEEN 10 AND 18),
    school_name VARCHAR(255) NOT NULL,
    linkedin_profile VARCHAR(255),
    climbing_experience_months INT NOT NULL,
    climbing_experience_years INT NOT NULL,
    message TEXT,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    package VARCHAR(255) NOT NULL,
    payment_status ENUM('Paid', 'Unpaid') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
