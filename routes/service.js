var express = require('express');
var router = express.Router();
const AuthenticationData = require('../auth/AuthenticationData');
const casAuthentication = require('../auth/CASAuthentication');
const optionBuilder = require('../auth/OptionBuilder');
const requestManger = require('../auth/RequestManager');

let reqManager = new requestManger();

function getGetOption(authentication, iURL, args) {
  let queryString = args['name'] ?
    "name=" + args['name'] :
    Object.keys(args).map(key => key + '=' + args[key]).join('&');
  let urlGet = iURL + '?' + queryString;
  return new optionBuilder(urlGet).setCookie(authentication)
    .setContentType('multipart/form-data')
    .build();
}

function getPostOption(authentication, iURL, args) {
  return new optionBuilder(iURL).setCookie(authentication)
    .setFormData(args)
    .setContentType('multipart/form-data')
    .build();
}

const getData = async function (iURL, iArgs, iAuthData) {
  let authManager = new AuthenticationData();
  let authData = await authManager.getAuthenticationData(iAuthData);
  var options = getGetOption(authData.JSESSIONID, iURL, iArgs);
  let irData = await reqManager.getRequest(options);

  return { 'data': irData.body, 'authData': authData };
}

const postData = async function (iURL, iArgs, iAuthData) {
  let authManager = new AuthenticationData();
  let authData = await authManager.getAuthenticationData(iAuthData);
  var options = getPostOption(authData.JSESSIONID, iURL, iArgs);
  let irData = await reqManager.postRequest(options);

  return { 'data': irData.body, 'authData': authData };
}

const putData = async function (iURL, iArgs, iAuthData) {
  let authManager = new AuthenticationData();
  let authData = await authManager.getAuthenticationData(iAuthData);
  var options = getPostOption(authData.JSESSIONID, iURL, iArgs);
  let irData = await reqManager.putRequest(options);

  return { 'data': irData.body, 'authData': authData };
}

const getAuthenticate = async function (iArgs) {
  let authManager = new AuthenticationData();
  let cas = new casAuthentication({});
  cas.setUserNamePassword(iArgs.username, iArgs.password);
  let isAuthenticated = await cas.doEntrireAuthProcess(authManager);

  return {'authData': authManager, "isAuthenticated": isAuthenticated};
}

router.post('/dsx/auth', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method == 'POST') {
    let body = '';
    req.on('data', function (data) {
      body += data;
      if (body.length > 1e6) {
        req.connection.destroy();
      }
    });
    req.on('end', function () {
      let args = JSON.parse(body);
      getAuthenticate(args).then(function(iAuthData){
        req.session['JSESSIONID'] = iAuthData.JSESSIONID;
        req.session['CASCookie'] = iAuthData.CASCookie;
        res.json({'isAuthenticated': iAuthData.isAuthenticated});
      });
    });
  }
});

/* GET home page. */
router.post('/dsx/get', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method == 'POST') {
    let body = '';
    req.on('data', function (data) {
      body += data;
      if (body.length > 1e6) {
        req.connection.destroy();
      }
    });
    req.on('end', function () {
      let args = JSON.parse(body);
      let URL = args.url;
      delete args['url'];
      if (URL == "" || URL == undefined) {
        res.json(JSON.stringify({ "message": "Wrong URL" }));
      } else if (URL.indexOf('ppd') < 0) {
        res.json(JSON.stringify({ "message": "Please use a right pre-production URL" }));
      } else {
        getData(URL, args).then(function (iResponseData) {
          res.json(iResponseData.data);
        }).catch(function (iReason) {
          res.json(JSON.parse(iReason));
        });
      }
    });
  }
});

router.post('/dsx/post', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method == 'POST') {
    let body = '';
    req.on('data', function (data) {
      body += data;
      if (body.length > 1e6) {
        req.connection.destroy();
      }
    });
    req.on('end', function () {
      let args = JSON.parse(body);
      let URL = args.url;
      delete args['url'];
      if (URL == "" || URL == undefined) {
        res.json({ "message": "Wrong URL" });
      } else {
        postData(URL, args).then(function (iResponseData) {
          res.json(iResponseData.data);
        }).catch(function (iReason) {
          res.json(JSON.parse(iReason));
        });
      }
    });
  }
});

router.post('/dsx/put', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method == 'POST') {
    let body = '';
    req.on('data', function (data) {
      body += data;
      if (body.length > 1e6) {
        req.connection.destroy();
      }
    });
    req.on('end', function () {
      let args = JSON.parse(body);
      let URL = args.url;
      delete args['url'];
      if (URL == "" || URL == undefined) {
        res.json({ "message": "Wrong URL" });
      } else {
        putData(URL, args).then(function (iResponseData) {
          res.json(iResponseData.data);
        }).catch(function (iReason) {
          res.json(JSON.parse(iReason));
        });
      }
    });
  }
});

module.exports = router;
