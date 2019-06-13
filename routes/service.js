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

const getIRData = async function (iURL, iArgs) {
  let authData = await authManager.getAuthenticationData();
  var options = getTaskOption(authData, iURL, iArgs);
  let irData = await reqManager.getRequest(options);

  return irData.body;
}

/* GET home page. */
router.post('/dsx', function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  let args = req.body;
  let URL = req.body.url;
  delete args['url'];
  if(URL == "" || URL == undefined){
    res.json({"message": "Wrong URL"});
  }else{
    getIRData(URL, args).then(function (iData) {
      res.json(iData);
    }).catch(function(iReason){
      res.json(JSON.parse(iReason));
    });
  }
});

module.exports = router;
