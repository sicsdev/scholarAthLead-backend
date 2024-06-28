const db = require("../config/db");
const transporter = require("../config/email");
const bcrypt = require("bcrypt");
require("dotenv").config();

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
      payment_status = "UnPaid",
      application_outcome = "",
    } = req.body;
  
    if (!parent_name || !student_name || !email || !package) {
      return res.status(400).json({
        error: "Parent name, student name, email, and package are required",
      });
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
  
    const checkDuplicateEmailSql = "SELECT * FROM users WHERE email = ?";
    db.query(checkDuplicateEmailSql, [email], (err, results) => {
      if (err) {
        return res.status(500).json({ error: "Error checking for duplicate email" });
      }
  
      if (results.length > 0) {
        return res.status(400).json({ error: "Email already exists" });
      }
  
      // Convert birth_date to YYYY/M/D format
      let formattedBirthDate = null;
      if (birth_date) {
        const date = new Date(birth_date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1; // Months are zero-based in JavaScript
        const day = date.getDate();
        formattedBirthDate = `${year}/${month}/${day}`;
      }
  
      const sql = `
        INSERT INTO users (
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
          payment_status,
          application_outcome
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
  
      db.query(
        sql,
        [
          parent_name_prefix,
          parent_name,
          student_name_prefix,
          student_name,
          formattedBirthDate,
          age,
          school_name,
          linkedin_profile,
          climbing_experience_months,
          climbing_experience_years,
          message,
          email,
          package,
          payment_status,
          application_outcome,
        ],
        (err, result) => {
          if (err) {
            return res.status(500).json({ error: "Error saving form data" });
          }
  
          // Send email to admin
          const adminMailOptions = {
            from: process.env.EMAIL_USER,
            to: "console.log.vivek@gmail.com",
            subject: "New Form Submission",
            text: `
              A new form has been submitted with the following details:
              Student Name: ${student_name}
            `,
          };
  
          transporter.sendMail(adminMailOptions, (error, info) => {
            if (error) {
              console.error("Error sending email to admin: ", error);
            } else {
              console.log("Email sent to admin: " + info.response);
            }
          });
  
          // Send email to user
          const userMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Form Submission Confirmation",
            text: `Dear ${parent_name}, your form has been successfully submitted.`,
          };
  
          transporter.sendMail(userMailOptions, (error, info) => {
            if (error) {
              console.error("Error sending email to user: ", error);
            } else {
              console.log("Email sent to user: " + info.response);
            }
          });
  
          return res.status(201).json({ message: "Form data saved successfully" });
        }
      );
    });
  };

exports.getForms = (req, res) => {
  const sql = "SELECT * FROM users";
  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error fetching form data" });
    }
    res.json(results);
  });
};

exports.updateForm = (req, res) => {
  const email = req.params.email;
  const fieldsToUpdate = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const checkEmailSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkEmailSql, [email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error checking email" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No record found with this email" });
    }

    let updateSql = "UPDATE users SET ";
    const updateValues = [];
    Object.keys(fieldsToUpdate).forEach((field, index) => {
      updateSql += `${field} = ?`;
      if (index < Object.keys(fieldsToUpdate).length - 1) {
        updateSql += ", ";
      }
      updateValues.push(fieldsToUpdate[field]);
    });
    updateSql += " WHERE email = ?";
    updateValues.push(email);

    db.query(updateSql, updateValues, async (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Error updating form data" });
      }

      if (fieldsToUpdate.application_outcome) {
        const userMailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Application Outcome Update",
          text: `Dear ${results[0].parent_name}, your application outcome has been updated to: ${fieldsToUpdate.application_outcome}.`,
        };

        transporter.sendMail(userMailOptions, (error, info) => {
          if (error) {
            return res
              .status(500)
              .json({ error: "Error sending email to user" });
          }
          console.log("Email sent to user: " + info.response);
        });
      }

      res.status(200).json({ message: "Form data updated successfully" });
    });
  });
};

// Set Password Function
exports.setPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const checkEmailSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkEmailSql, [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ error: "Error checking email" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "No record found with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const updatePasswordSql = "UPDATE users SET password = ? WHERE email = ?";

    db.query(updatePasswordSql, [hashedPassword, email], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "Error updating password" });
      }

      const userMailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Set Confirmation",
        text: `Dear ${results[0].parent_name}, your password has been successfully set.`,
      };

      transporter.sendMail(userMailOptions, (error, info) => {
        if (error) {
          return res.status(500).json({ error: "Error sending email to user" });
        }
        console.log("Email sent to user: " + info.response);
      });

      res.status(200).json({ message: "Password set successfully" });
    });
  });
};
