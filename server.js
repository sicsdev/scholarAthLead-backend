const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const db = require("./config/db");
const transporter = require("./config/email");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const {
  getEnvelopesApi,
  makeEnvelope,
  checkToken,
  makeRecipientViewRequest,
} = require("./helpers/docuSignHelper");

require("dotenv").config();
const docusign = require("docusign-esign");
const app = express();
const path = require("path");

const session = require("express-session");
const port = 3001;
const fs = require("fs");
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

app.put("/update-form/:application_outcome", (request, res) => {
   const email = request.body.email;
   const fieldsToUpdate = request.params;
 
   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
   if (!emailRegex.test(email)) {
     return res.status(400).json({ error: "Invalid email format" });
   }
 
   const checkEmailSql = "SELECT * FROM userSchema WHERE email = ?";
   db.query(checkEmailSql, [email], (err, results) => {
     if (err) {
       return res.status(500).json({ error: "Error checking email" });
     }
 
     if (results.length === 0) {
       return res.status(404).json({ error: "No record found with this email" });
     }
 
     let updateSql = "UPDATE userSchema SET ";
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
 
     db.query(updateSql, updateValues, async (err, asd) => {
       if (err) {
         return res.status(500).json({ error: "Error updating form data" });
       }
       await checkToken(request);
       console.log("req ::", request)

       let envelopesApi = getEnvelopesApi(request);

       let envelope = makeEnvelope(
         request.body.name,
         request.body.email,
         request.body.parents
       );
 
       let results = await envelopesApi.createEnvelope(
         process.env.DOCUSIGN_ACCOUNT_ID,
         { envelopeDefinition: envelope }
       );
       console.log("used", results)
       // Create the recipient view, the Signing Ceremony
       let viewRequest = makeRecipientViewRequest(
         request.body.name,
         request.body.email,
         results.envelopeId // Pass the envelopeId as the signatureId
       );
       console.log("boss ::", results)
 
       results = await envelopesApi.createRecipientView(
         process.env.DOCUSIGN_ACCOUNT_ID,
         results.envelopeId,
         { recipientViewRequest: viewRequest }
       );
 
       console.log("boss ::", results)
 
       if (fieldsToUpdate.application_outcome) {
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


 const packagePrices = {
  weekly: 10000,       // in cents
  monthly: 30000,      // in cents
  biannually: 162000,  // in cents
  annually: 300000     // in cents
};

// Payment Intent Route
app.post('/create-payment-intent', async (req, res) => {
  const { packageType } = req.body;

  if (!packagePrices[packageType]) {
      return res.status(400).send('Invalid package type');
  }

  const amount = packagePrices[packageType];

  try {
      const paymentIntent = await stripe.paymentIntents.create({
          amount: amount,
          currency: 'usd',
          payment_method_types: ['card'],
      });

      res.json({
          clientSecret: paymentIntent.client_secret,
      });
  } catch (error) {
      res.status(500).send(error.message);
  }
});
//  https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=17145da5-a2ee-4c8a-aa7b-ffaf8243c321&redirect_uri=http://localhost:3001/
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
