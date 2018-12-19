var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var data = require('./data.js');
var app = express();
var globalRequest = require("request");
app.use(express.static('views'));
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({
    secret: 'cookie_secret',
    resave: true,
    saveUninitialized: true
}));

const status = {
    CREATE: {
        API_CREATE: "Create",
        CREATING: "Creating",
        CREATEFAIL: "Creation Failed"
    },
    DELETE: {
        API_DELETE: "Delete",
        DELETING: "Deleting",
        DELETEFAIL: "Deletion Failed"
    },
    RUNNING: "Running",
    API_FAILED: "Failed",
    API_SUCCESS: "Success"
};

const message = {
    CREATE: {
        CREATING: "Service Creation is Still In-Progress. Please try again after sometime.",
        CREATESTART: "Service Creation Started. Please Monitor Dashboard to verify the Status of Service Creation.",
        CREATESUCCESSFUL: "Service Creation is Completed. ",
        CREATEFAIL: "Internal Server Error during Create Operation. Please see the log for more Details.",
        EXIST: "Service with Same name already exists. It might present in another namespace. Please try with different name."
    },
    DELETE: {
        DELETING: "Service Deletion is Still In-Progress. Please try again after sometime.",
        DELETEFAIL: "Internal Server Error during Delete Operation. Please see the log for more Details."
    },
    STATUS: {
        STATUSFAIL: "Status verification failed due to Internal Error. Please check Server Log."
    }
};

/*
It's landing page for Login.
 */
app.get('/', function (request, response) {
    response.render("login", {formsMessage:data.formsMessage});
});

/*
It's landing page for Dashboard UI.
 */
app.get('/index', function (request, response) {
    sess = request.session;
    if(sess && sess.username) {
        response.render("index", {formsMessage: "", services: data.services, catalogServices: data.catalogServices, username: data.username});
    } else {
        data.formsMessage = "Please login Again. Your session is invalidate."
        response.render("login", {formsMessage:data.formsMessage});
    }
});

/*
It's landing page for Create Service.
 */
app.get('/create', function (request, response) {
    sess = request.session;
    if(sess && sess.username) {
        response.render("create", {formsMessage: "", catalogServices: data.catalogServices, username: data.username});
    } else {
        data.formsMessage = "Please login Again. Your session is invalidate."
        response.render("login", {formsMessage:data.formsMessage});
    }
});

/*
Page related to check status for creating Service.
 */
app.get('/dashboard', function (request, response) {
    sess = request.session;
    if(sess && sess.username) {
        response.render("index", {formsMessage: data.formsMessage, services: data.services, catalogServices: data.catalogServices, username: data.username});
    } else {
        data.formsMessage = "Please login Again. Your session is invalidate."
        response.render("login", {formsMessage:data.formsMessage});
    }
});

/*
It's landing page for Create Service.
 */
app.get('/creating', function (request, response) {
    sess = request.session;
    if(sess && sess.username) {
        response.render("create", {formsMessage: data.formsMessage, catalogServices: data.catalogServices, username: data.username});
    } else {
        data.formsMessage = "Please login Again. Your session is invalidate."
        response.render("login", {formsMessage:data.formsMessage});
    }
});

/*
It's landing page for Dashboard UI.
 */
app.get('/certificate', function (request, response) {
    sess = request.session;
    if(sess && sess.username) {
        response.render("certificate", {services: data.services, username: data.username});
    } else {
        data.formsMessage = "Please login Again. Your session is invalidate."
        response.render("login", {formsMessage:data.formsMessage});
    }
});


/*
REST - List Services.
 */
app.get('/api/services', function (request, response) {
    response.send(data.services);
});

/*
REST - Get Service Details.
 */
app.get('/api/services/:name', function (request, response) {
    for (var index = 0; index < data.services.length; index++) {
        if (data.services[index].name === request.params.name) {
            response.send(data.services[index]);
            return;
        }
    }
});

/*
It's landing page for Submit from UI
 */
app.post('/api/services/ui/create', function (request, response) {
    sess = request.session;
    if(sess && sess.username) {
        var service = request.body;
        service.status = "Initialize";
        service.username = sess.username;
        for (var index = 0; index < data.services.length; index++) {
            if (data.services[index].name === service.name) {
                data.formsMessage = message.CREATE.EXIST;
                response.redirect("/creating");
                return;
            }
        }

        console.log("Creating Service:");
        console.log(service);
        globalRequest({
            headers: {
                'X-KafkaService-API-Originating-Identity': sess.username,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            uri: data.apiServiceEndPoint,
            method: "POST",
            json: {
                'serviceName': service.name
            }
        }, function(error, res, body) {
            console.log("Creating Service Started:");
            console.log(body);
            if (!error && res.statusCode == 202) {
                service.status = status.CREATE.CREATING;
                service.pollurl = body['pollUrl'];
                service.endpoint = "";
                data.services.push(service);
                data.formsMessage = message.CREATE.CREATESTART;
                response.redirect("/creating");
            } else {
                console.log("Error during POST command from UI:" + service.name);
                console.log(body);
                data.formsMessage = message.CREATE.CREATEFAIL;
                response.redirect("/creating");
            }
        });
    } else {
        data.formsMessage = "Please login Again. Your session is invalidate."
        response.render("login", {formsMessage:data.formsMessage});
    }
});

/*
It's landing page for Check Status from UI
 */
app.post('/api/services/ui/jobstatus', function (request, response) {
    sess = request.session;
    if(sess && sess.username) {
        var selectedService = request.body.selectedService;
        var val = selectedService.split("$$$",2);
        serviceName = val[0];
        var found = 0
        for (var index = 0; index < data.services.length; index++) {
            if (data.services[index].name === serviceName) {
                found = index;
                break;
            }
        }
        myservice = data.services[found];

        //verifying status
        globalRequest({
            headers: {
                'X-KafkaService-API-Originating-Identity': sess.username,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            uri: myservice.pollurl,
            method: "GET"
        }, function(error, res, body) {
            if(body) {
                var info = JSON.parse(body);
                console.log("Getting Service Status:");
                console.log(info);
                if (!error && res.statusCode == 200) {
                    if (info.operation === status.CREATE.API_CREATE) {
                        if (info.status === status.API_SUCCESS) {
                            updateEndpoints(myservice.name, sess.username);
                            data.formsMessage = message.CREATE.CREATESUCCESSFUL;
                            response.redirect("/dashboard");
                        } else if (info.status === status.API_FAILED) {
                            myservice.status = status.CREATE.CREATEFAIL;
                            data.services.splice(found, 1);
                            data.services.push(myservice);
                            data.formsMessage = message.CREATE.CREATEFAIL;
                            response.redirect("/dashboard");
                        } else {
                            data.formsMessage = message.CREATE.CREATING;
                            response.redirect("/dashboard");
                        }
                    } else if (info.operation === status.DELETE.API_DELETE) {
                        if (info.status === status.API_SUCCESS) {
                            deleteService(myservice.name);
                            data.formsMessage = "";
                            response.redirect("/index");
                        } else if (info.status === status.API_FAILED) {
                            myservice.status = status.DELETE.DELETEFAIL;
                            data.services.splice(found, 1);
                            data.services.push(myservice);
                            data.formsMessage = message.DELETE.DELETEFAIL;
                            response.redirect("/dashboard");
                        } else {
                            data.formsMessage = message.DELETE.DELETING;
                            response.redirect("/dashboard");
                        }
                    }
                } else {
                    console.log("Error during Job Status command from UI:" + serviceName);
                    console.log(body);
                    data.formsMessage = message.STATUS.STATUSFAIL;
                    response.redirect("/dashboard");
                }
            } else {
                data.formsMessage = "";
                response.redirect("/index");
            }
        });
    } else {
        data.formsMessage = "Please login Again. Your session is invalidate."
        response.render("login", {formsMessage:data.formsMessage});
    }
});

/**
 It's Delete for Service
 */
function deleteService(serviceName) {
    var found = 0
    for (var index = 0; index < data.services.length; index++) {
        if (data.services[index].name === serviceName) {
            found = index;
            break;
        }
    }
    console.log("Deleted Service:" + serviceName);
    data.services.splice(found,1);
}

    /**
 It's Update Endpoints for Service
 */
function updateEndpoints(serviceName, username) {
    var found = 0
    for (var index = 0; index < data.services.length; index++) {
        if (data.services[index].name === serviceName) {
            found = index;
            break;
        }
    }
    myservice = data.services[found];

    globalRequest({
        headers: {
            'X-KafkaService-API-Originating-Identity': username,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        },
        uri: data.apiServiceEndPoint+"/"+serviceName,
        method: "GET"
    }, function(error, res, body) {
        var info = JSON.parse(body);
        console.log("Getting endpoints for Service:");
        console.log(info);
        if (!error && res.statusCode == 200) {
            myservice.pollurl = "";
            myservice.endpoint = "";
            myservice.tls = "";

            // updating endpoints
            for (var index = 0; index < info.cluster.brokerUrlList.length; index++) {
                if (index === info.cluster.brokerUrlList.length - 1)
                    myservice.endpoint += info.cluster.brokerUrlList[index];
                else
                    myservice.endpoint += info.cluster.brokerUrlList[index] + ",";
            }

            // changing status to running
            myservice.status = status.RUNNING;

            // updating certificate details for service
            myservice.ca = info.tls.ca;
            myservice.cert = info.tls.cert;
            myservice.key = info.tls.key;

            data.services.splice(found,1);
            data.services.push(myservice);
        } else {
            console.log("Error during updation of endpoint:"+ serviceName);
            console.log(body);
        }
    });
}

/*
It's landing page for Delete from UI
 */
app.post('/api/services/ui/delete', function (request, response) {
    sess = request.session;
    if(sess && sess.username) {
        var selectedService = request.body.selectedService;
        var val = selectedService.split("$$$",2);
        serviceName = val[0];
        var found = 0
        for (var index = 0; index < data.services.length; index++) {
            if (data.services[index].name === serviceName) {
                found = index;
                break;
            }
        }

        myservice = data.services[found];
        console.log("Deleting Service:");
        console.log(myservice);

        globalRequest({
            headers: {
                'X-KafkaService-API-Originating-Identity': sess.username,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            },
            uri: data.apiServiceEndPoint+"/"+serviceName,
            method: "DELETE"
        }, function(error, res, body) {
            console.log("Deleting Service Started:");
            var info = JSON.parse(body);
            console.log(info);
            if (!error && res.statusCode == 202) {
                myservice.status = status.DELETE.DELETING;
                myservice.pollurl = info.pollUrl;
                myservice.endpoint = "";
                data.services.splice(found,1);
                data.services.push(myservice);
                data.formsMessage = "";
                response.redirect("/index");
            } else {
                console.log("Error during DELETE command from UI:" + serviceName);
                console.log(body);
                data.formsMessage = message.DELETE.DELETEFAIL;
                response.redirect("/dashboard");
            }
        });
    } else {
        data.formsMessage = "Please login Again. Your session is invalidate."
        response.render("login", {formsMessage:data.formsMessage});
    }
});

/*
It's landing page for Submit from UI
 */
app.post('/api/services/ui/edit', function (request, response) {
    var found = 0;
    var service = request.body;
    for (var index = 0; index < data.services.length; index++) {
        if (data.services[index].name == service.name) {
            found = index;
            break;
        }
    }
    data.services.splice(found,1);
    service.status = "Editing";
    data.services.push(service);
    response.redirect("/edited?name="+service.name);
});

/*
It's landing page for Validating Username & Password
 */
app.post('/api/services/ui/login', function (request, response) {
    var userdetails = request.body;
    var found = 0;
    for (var index = 0; index < data.userDetails.length; index++) {
      if(userdetails.username == data.userDetails[index].username)
      {
        if(userdetails.password == data.userDetails[index].password) {
          found = 1;
          break;
        }
      }
    }
    if(found == 1) {
      sess = request.session;
      sess.username=userdetails.username;
      data.username=userdetails.username;
      response.redirect("/index");
    } else {
      request.session.destroy(function(err) {
          if(err) {
            console.log(err);
          } else {
            data.formsMessage = "User Credentials are Not Valid.";
            response.redirect("/");
          }
      });
    }
});

/*
It's landing page for logout
 */
app.get('/logout',function(req,res){
  req.session.destroy(function(err) {
      if(err) {
        console.log(err);
      } else {
        data.formsMessage = "";
        res.redirect('/');
      }
  });
});

/*
Starting HTTP Server.
 */
app.listen(8090, function () {
    console.log("Listening on port 8090.");
    var catalog = require('./resource/catalog.json');
    var userdetails = require('./resource/usernames.json');
    data.catalogServices = catalog.services;
    data.userDetails = userdetails.usernames;
});
