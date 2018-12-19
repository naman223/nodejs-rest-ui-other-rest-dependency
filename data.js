// Services attribute - name, shape, status, endpoint
exports.services = [];

// Message to show the User During creation of Service
exports.formsMessage = "";

//Catalog Service Details
exports.catalogServices = [];

//Username Details from Usernames.json file.
exports.userDetails = [];

//Current User who logged in.
exports.username = "";

//API service endpoint to connect.
exports.apiServiceEndPoint = "http://"+process.env.API_SERVICE_ENDPOINT+"/v2/kafkaServices";
