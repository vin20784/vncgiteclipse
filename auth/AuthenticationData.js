'use strict';
const os = require('os');
const optionBuilder = require('./OptionBuilder');
const requestManager = require('./RequestManager');
const casAuthentication = require('./CASAuthentication');
const path = require('path');
const fs = require('fs');
const config = require('./config');


var authenticationFile = path.join(__dirname, "Auth/auth.txt");
var authenticationDir = path.join(__dirname, "Auth");

function readAuthenticationData() {

  return new Promise((resolve, reject) => {

    fs.readFile(authenticationFile, 'utf8', (err, data) => {
      if (err) {
        resolve(null);
        return;
      }
      if (data) {
        let obj = JSON.parse(data);
        resolve(obj);
      }
      else {
        resolve(null);
        return;
      }
    })
  });
}

async function isValidJSESSIONID(cookie) {

  let rm = new requestManager();
  let option = new optionBuilder(config.currentUrl + '?owner=' + os.userInfo().username).setCookie(cookie).build();

  let res = await rm.getRequest(option);

  if (res.statusCode !== 200)
    return false;
  else
    return true;
}


class AuthenticationData {

  constructor() {
    this.CASCookie = null;
    this.JSESSIONID = null;
  }

  async storeAuthentication(data) {

    this.JSESSIONID = data.JSESSIONID;
    this.CASCookie = data.CASCookie;
  }

  async getAuthenticationData(iSessionData) {

    try {
      // let resRead = null;//await readAuthenticationData();

      // if (resRead === null) {
      //   console.info("Cookie file not read");
      //   let cas = new casAuthentication({});
      //   await cas.setUserNamePassword();
      //   await cas.doEntrireAuthProcess(this);

      // }
      // else 
      {
        this.CASCookie = iSessionData.CASCookie;
        this.JSESSIONID = iSessionData.JSESSIONID;

        let getRes = await isValidJSESSIONID(this.JSESSIONID);
        if (getRes)
          console.info("Authentication is valid");
        else {
          console.info("Authentication Expired, Renewing authentication cookie");
          let cas = new casAuthentication({});
          cas.partialAuth = true; // for partial authenticating data
          cas.setCASCookie(this.CASCookie);
          await cas.doCASValidation(this);
        }
      }

      return {'JSESSIONID': this.JSESSIONID, 'CASCookie': this.CASCookie};

    } catch (error) {
      console.error("Error in AuthenticationData, getAuthenticationData ", { error });
    }
  }

}

module.exports = AuthenticationData;
