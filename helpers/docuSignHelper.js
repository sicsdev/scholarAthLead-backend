const docusign = require('docusign-esign');
const fs = require('fs');
const path = require('path');

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
    request.session.access_token = results.body.access_token;
    request.session.expires_at =
      Date.now() + (results.body.expires_in - 60) * 1000;
  }
}

function makeRecipientViewRequest(name, email, signatureId) {
    let viewRequest = new docusign.RecipientViewRequest();
    console.log("viewRequest", new docusign.RecipientViewRequest());
    viewRequest.returnUrl = `http://localhost:3000/success?email=${email}&signatureId=${signatureId}`;
    viewRequest.authenticationMethod = "none";
  
    viewRequest.email = email;
    viewRequest.userName = name;
    viewRequest.clientUserId = process.env.DOCUSIGN_INTEGRATOR_KEY;
  
    return viewRequest;
  }
  

module.exports = {
  getEnvelopesApi,
  makeEnvelope,
  checkToken,
  makeRecipientViewRequest
};
