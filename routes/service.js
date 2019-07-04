var express = require('express');
var router = express.Router();
var config = require('../auth/config.js');
const AuthenticationData = require('../auth/AuthenticationData');
const optionBuilder = require('../auth/OptionBuilder');
const requestManger = require('../auth/RequestManager');

let authManager = new AuthenticationData();
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

const getData = async function (iURL, iArgs) {
  let authData = await authManager.getAuthenticationData();
  var options = getGetOption(authData, iURL, iArgs);
  let irData = await reqManager.getRequest(options);

  return irData.body;
}

const postData = async function (iURL, iArgs) {

  let authData = await authManager.getAuthenticationData();
  var options = getPostOption(authData, iURL, iArgs);
  let irData = await reqManager.postRequest(options);

  return irData.body;
}

const putData = async function (iURL, iArgs) {

  let authData = await authManager.getAuthenticationData();
  var options = getPostOption(authData, iURL, iArgs);
  let irData = await reqManager.putRequest(options);

  return irData.body;
}

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
        getData(URL, args).then(function (iData) {
          res.json(iData);
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
        postData(URL, args).then(function (iData) {
          res.json(iData);
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
        putData(URL, args).then(function (iData) {
          res.json(iData);
        }).catch(function (iReason) {
          res.json(JSON.parse(iReason));
        });
      }
    });
  }
});

module.exports = router;
