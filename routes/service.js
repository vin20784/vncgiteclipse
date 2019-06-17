var express = require('express');
var router = express.Router();
const AuthenticationData = require('../auth/AuthenticationData');
const optionBuilder = require('../auth/OptionBuilder');
const requestManger = require('../auth/RequestManager');

let authManager = new AuthenticationData();
let reqManager = new requestManger();

function getTaskOption(authentication, iURL, args) {
  let queryString = args['name'] ?
    "name=" + args['name'] :
    Object.keys(args).map(key => key + '=' + args[key]).join('&');
  let urlGet = iURL + '?' + queryString;
  return new optionBuilder(urlGet).setCookie(authentication)
    .setContentType('multipart/form-data')
    .build();
}

const getData = async function (iURL, iArgs) {
  let authData = await authManager.getAuthenticationData();
  var options = getTaskOption(authData, iURL, iArgs);
  let irData = await reqManager.getRequest(options);

  return irData.body;
}

const postData = async function(iURL, iArgs){
  let authData = await authManager.getAuthenticationData();
  var options = getTaskOption(authData, iURL, iArgs);
  let irData = await reqManager.postRequest(options);

  return irData.body;
}

/* GET home page. */
router.post('/dsx/get', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let args = req.body;
  let URL = req.body.url;
  delete args['url'];
  if(URL == "" || URL == undefined){
    res.json({"message": "Wrong URL"});
  }else{
    getData(URL, args).then(function (iData) {
      res.json(iData);
    }).catch(function(iReason){
      res.json(JSON.parse(iReason));
    });
  }
});

router.post('/dsx/post', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let args = req.body;
  let URL = req.body.url;
  delete args['url'];
  if(URL == "" || URL == undefined){
    res.json({"message": "Wrong URL"});
  }else{
    postData(URL, args).then(function (iData) {
      res.json(iData);
    }).catch(function(iReason){
      res.json(JSON.parse(iReason));
    });
  }
});

module.exports = router;
