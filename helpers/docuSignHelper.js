const docusign = require("docusign-esign");
const fs = require("fs");
const path = require("path");

function getEnvelopesApi(request) {
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(process.env.DOCUSIGN_API_BASE_PATH);
  dsApiClient.addDefaultHeader(
    "Authorization",
    "Bearer " + request.session.access_token
  );
  return new docusign.EnvelopesApi(dsApiClient);
}

function makeEnvelope(name, email, company) {
  let env = new docusign.EnvelopeDefinition();
  env.templateId = process.env.DOCUSIGN_TEMPLATE_ID;
  let text = docusign.Text.constructFromObject({
    tabLabel: "company_name",
    value: email,
  });

  // Pull together the existing and new tabs in a Tabs object:
  let tabs = docusign.Tabs.constructFromObject({
    textTabs: [text],
  });

  let signer1 = docusign.TemplateRole.constructFromObject({
    email: email,
    name: name,
    tabs: tabs,
    clientUserId: process.env.DOCUSIGN_INTEGRATOR_KEY,
    roleName: "applicant",
  });

  env.templateRoles = [signer1];
  env.status = "sent";
  return env;
}

async function checkToken(request) {
  if (request.session.access_token && Date.now() < request.session.expires_at) {
    // Token is valid, do nothing
  } else {
    let dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(process.env.DOCUSIGN_API_BASE_PATH);
    const results = await dsApiClient.requestJWTUserToken(
      process.env.DOCUSIGN_INTEGRATOR_KEY,
      process.env.DOCUSIGN_USER_ID,
      "signature",
      fs.readFileSync(path.join(__dirname, "../private.key")),
      3600
    );
    console.log("results", results);
    request.session.access_token = results.body.access_token;
    request.session.expires_at =
      Date.now() + (results.body.expires_in - 60) * 1000;
  }
}

function makeRecipientViewRequest(name, email, signatureId, package, user_id) {
  let viewRequest = new docusign.RecipientViewRequest();

  console.log("packagepackage", package);
  viewRequest.returnUrl = `http://localhost:3000/success?email=${email}&name=${name}&package=${package}&user_id=${user_id}&signatureId=${signatureId}`;
  viewRequest.authenticationMethod = "none";

  viewRequest.email = email;
  viewRequest.userName = name;
  viewRequest.clientUserId = process.env.DOCUSIGN_INTEGRATOR_KEY;

  return viewRequest;
}
async function getDocument(request, envelopeId, documentId) {
  await checkToken(request); // Ensure the token is valid
  const envelopesApi = getEnvelopesApi(request);

  return new Promise((resolve, reject) => {
    envelopesApi.getSignatureImage(
      process.env.DOCUSIGN_ACCOUNT_ID,
      envelopeId,
      documentId,
      null,
      (err, documentBuffer) => {
        if (err) {
          reject(new Error("Error fetching document: " + err.message));
        } else {
          resolve(Buffer.from(documentBuffer, "binary"));
        }
      }
    );
  });
}
async function listDocuments(request, envelopeId) {
  await checkToken(request); // Ensure the token is valid
  const envelopesApi = getEnvelopesApi(request);

  try {
    const documents = await envelopesApi.listDocuments(
      process.env.DOCUSIGN_ACCOUNT_ID,
      envelopeId
    );
    return documents.envelopeDocuments;
  } catch (error) {
    throw new Error("Error listing documents: " + error.message);
  }
}

module.exports = {
  getEnvelopesApi,
  getDocument,
  makeEnvelope,
  listDocuments,
  checkToken,
  makeRecipientViewRequest,
};




