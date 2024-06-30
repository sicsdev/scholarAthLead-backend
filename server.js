const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./config/db");
const transporter = require("./config/email");
const userRoutes = require("./routes/userRoutes");
const availabilityRoutes = require("./routes/availabilityRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const adminRoutes = require("./routes/adminRoutes");
const {
  getEnvelopesApi,
  makeEnvelope,
  checkToken,
  makeRecipientViewRequest,
  getDocument,
  listDocuments
} = require("./helpers/docuSignHelper");

require("dotenv").config();
const app = express();

const session = require("express-session");
const port = 3001;
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "asd123jnjj93842394jnjj",
    resave: true,
    saveUninitialized: true,
  })
);
app.get("/api/list-documents", async (req, res) => {
  const { envelopeId } = req.body;

  if (!envelopeId) {
    return res.status(400).json({ error: "Missing envelopeId" });
  }

  try {
    const documents = await listDocuments(req, envelopeId);
    res.status(200).json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// New route to get a document
app.get("/api/get-document", async (req, res) => {
  const { envelopeId, documentId } = req.body;

  if (!envelopeId || !documentId) {
    return res.status(400).json({ error: "Missing envelopeId or documentId" });
  }
  try {
    const documentBuffer = await getDocument(req, envelopeId, documentId);
    res.setHeader("Content-Disposition", "attachment; filename=document.pdf");
    res.setHeader("Content-Type", "application/pdf");
    res.send(documentBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



app.put("/api/update-form/:application_outcome", (request, res) => {
  const email = request.body.email;
  const package = request.body.packages;
  const user_id = request.body.user_id;

  const fieldsToUpdate = request.params;

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

    // Check if application_outcome is "Approve" and add waiver_form_sent = "Yes"
    if (fieldsToUpdate.application_outcome === "Approve") {
      updateSql += ", waiver_form_sent = ?";
      updateValues.push("Yes");
    }

    updateSql += " WHERE email = ?";
    updateValues.push(email);

    db.query(updateSql, updateValues, async (err, asd) => {
      if (err) {
        return res.status(500).json({ error: "Error updating form data" });
      }
      await checkToken(request);
      console.log("req ::", request);

      let envelopesApi = getEnvelopesApi(request);

      let envelope = makeEnvelope(
        request.body.name,
        request.body.email,
        request.body.packages,
        request.body.user_id
      );

      let results = await envelopesApi.createEnvelope(
        process.env.DOCUSIGN_ACCOUNT_ID,
        { envelopeDefinition: envelope }
      );

      let viewRequest = makeRecipientViewRequest(
        request.body.name,
        request.body.email,
        results.envelopeId,
        request.body.packages,
        request.body.user_id
      );

      results = await envelopesApi.createRecipientView(
        process.env.DOCUSIGN_ACCOUNT_ID,
        results.envelopeId,
        { recipientViewRequest: viewRequest }
      );

      console.log("boss ::", results);

      if (fieldsToUpdate.application_outcome === "Approve") {
        const userMailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Application Outcome Update",
          html: `
            <p>Dear ${request.body.name},</p>
            <p>We are pleased to inform you that your application outcome has been updated to: <strong>${fieldsToUpdate.application_outcome}</strong>.</p>
            <p>To proceed, please provide your signature by clicking on the following link:</p>
            <p><a href="${results.url}">Sign Here</a></p>
            <p>Thank you for your prompt attention to this matter.</p>
            <p>Best regards,</p>
            <p>The Application Team</p>
          `,
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
});


//  https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=17145da5-a2ee-4c8a-aa7b-ffaf8243c321&redirect_uri=http://localhost:3001/
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes, availabilityRoutes,bookingRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
