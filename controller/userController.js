const db = require('../config/db');
const transporter = require('../config/email');
require('dotenv').config();

exports.submitForm = (req, res) => {
    const {
        parent_name_prefix,
        parent_name,
        student_name_prefix,
        student_name,
        birth_date,
        age,
        school_name,
        linkedin_profile,
        climbing_experience_months,
        climbing_experience_years,
        message,
        email,
        package,
        payment_status
    } = req.body;

    // Validate required fields (except password)
    if (!parent_name_prefix || !parent_name || !student_name_prefix || !student_name || !birth_date || !age ||
        !school_name || !climbing_experience_months || !climbing_experience_years || !email || !package || !payment_status) {
        return res.status(400).json({ error: 'All fields except password are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check for duplicate email
    const checkDuplicateEmailSql = 'SELECT * FROM userSchema WHERE email = ?';
    db.query(checkDuplicateEmailSql, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error checking for duplicate email' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // If no duplicate email, proceed with inserting the form data
        const sql = `
            INSERT INTO userSchema (
                parent_name_prefix,
                parent_name,
                student_name_prefix,
                student_name,
                birth_date,
                age,
                school_name,
                linkedin_profile,
                climbing_experience_months,
                climbing_experience_years,
                message,
                email,
                package,
                payment_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(sql, [
            parent_name_prefix,
            parent_name,
            student_name_prefix,
            student_name,
            birth_date,
            age,
            school_name,
            linkedin_profile,
            climbing_experience_months,
            climbing_experience_years,
            message,
            email,
            package,
            payment_status
        ], (err, result) => {
            if (err) {
                return res.status(500).json({ error: 'Error saving form data' });
            }

            // Send email to admin
            const adminMailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'New Form Submission',
                text: `
                    A new form has been submitted with the following details:
                    Parent Name Prefix: ${parent_name_prefix}
                    Parent Name: ${parent_name}
                    Student Name Prefix: ${student_name_prefix}
                    Student Name: ${student_name}
                    Birth Date: ${birth_date}
                    Age: ${age}
                    School Name: ${school_name}
                    LinkedIn Profile: ${linkedin_profile}
                    Climbing Experience (Months): ${climbing_experience_months}
                    Climbing Experience (Years): ${climbing_experience_years}
                    Message: ${message}
                    Email: ${email}
                    Package: ${package}
                    Payment Status: ${payment_status}
                `
            };

            transporter.sendMail(adminMailOptions, (error, info) => {
                if (error) {
                    return res.status(500).json({ error: 'Error sending email to admin' });
                }
                console.log('Email sent to admin: ' + info.response);
            });

            // Send email to user
            const userMailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Form Submission Confirmation',
                text: `Dear ${parent_name}, your form has been successfully submitted.`
            };

            transporter.sendMail(userMailOptions, (error, info) => {
                if (error) {
                    return res.status(500).json({ error: 'Error sending email to user' });
                }
                console.log('Email sent to user: ' + info.response);
            });

            res.status(201).json({ message: 'Form data saved successfully' });
        });
    });
};

exports.getForms = (req, res) => {
    const sql = 'SELECT * FROM userSchema';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching form data' });
        }
        res.json(results);
    });
};
