'use strict';

//const https = require('https');
// const parser = require('TecUtils/cli-parser');
// const CmdRunner = require('TecUtils/CmdRunner');
const requestManager = require('./RequestManager');
const optionBuilder = require('./OptionBuilder');
const authenticationData = require('./AuthenticationData');
const QsrData = require('./QSRData');
const os = require('os');
const config = require('./config');

var rm = new requestManager();


function getLT (url) {

  let opt = new optionBuilder(url).build();
  return rm.getRequest(opt);
}

function getCASCookie (url, cookie) {

  let option = new optionBuilder(url).setCookie(cookie).build();
  return rm.postRequest(option);
}


function getSTRequest (url, cookie) {

  let option =  new optionBuilder(url).setCookie(cookie).build();
  return rm.getRequest(option);
}

function dummyPost(casObj) {

  let url = casObj.STURL;
  casObj._args.title = 'DummyTitle';
  let qsrData  = new QsrData(casObj._args).body;
  let option =  new optionBuilder(url).setJSON(true).setBody(qsrData).build();
  //let qsrData = new qsrDataBuilder(casObj._args['username']).setTitle('DummyTitle').build();
  // let option =  new optionBuilder(url).setJSON(true).setBody(qsrData).build();
  return rm.postRequest(option);
}


class CASAuthentication {


  constructor(options)
  {

    this.LTCookie = null;
    this.CASCookie = null;
    this.JSESSIONID = null;
    this.STURL = null;
    this._args = {};
  }

  setCASCookie(cookie) {
    this.CASCookie = cookie;
  }

  async doEntrireAuthProcess(authManager) {

    try {

      let url_LT = config.passPortURL+'/login?action=get_auth_params';
      console.log("start auth");
      let res_LT = await getLT(url_LT);
      console.log("res_LT: "+res_LT);
      if(res_LT.statusCode !== 200)
      {
        throw new Error("Error in Getting Login Ticket ");
      }

      // Get the login Ticket and store it
      this.LTCookie = res_LT.headers['set-cookie'];
      this.LT = JSON.parse(res_LT.body).lt;
      let url_CAS = config.passPortURL+'/login?username='+this._args['username']+'&password='+this._args['password']+'&lt='+this.LT+'&rememberMe=on';
      let res_CAS = await getCASCookie(url_CAS,this.LTCookie);
      console.log("res_CAS: "+res_CAS);
      if(res_CAS.statusCode !== 302)
      {
        throw new Error("Error in UserName or Password");
      }

      // Store the CAS Cookie
      this.setCASCookie(res_CAS.headers['set-cookie'][0]);
      let url_ST = config.passPortURL+'/login?service='+config.currentUrl;
      let res_Redirect = await getSTRequest(url_ST,this.CASCookie);
      console.log("res_Redirect: "+res_Redirect);
      if(res_Redirect.statusCode !== 200)
      {
        throw new Error("Error in Accessing DSxR&D");
      }

      // Get the redirection URL with JSessionID
      this.STURL = JSON.parse(res_Redirect.body)['x3ds_service_redirect_url'];
      let res_dummy = await dummyPost(this);
      this.JSESSIONID = res_dummy.headers['set-cookie'][0];

      await authManager.storeAuthentication(this);

      return true;

    } catch(error) {
      console.error("Error in Authentication",{error});
      return false;
    }

  }


  async doCASValidation(authManager) {

    try {

      let url_ST = config.passPortURL+'/login?service='+config.currentUrl;
      let redirectRes = await getSTRequest(url_ST,this.CASCookie);

      this.STURL = JSON.parse(redirectRes.body)['x3ds_service_redirect_url'];

      if(redirectRes.statusCode !== 200)
      {
        this.doEntrireAuthProcess(authManager);
        return true;
      }

      let res_Post = await dummyPost(this);
      this.JSESSIONID = res_Post.headers['set-cookie'][0];
      authManager.storeAuthentication(this);

    } catch (error) {
        console.error("Error in Authentication ",error);
    }

  }

  setUserNamePassword(iUsername, iPassword) {

    try {
      this._args['username'] = iUsername;
      this._args['password'] = iPassword;
    }
    catch(error) {
        console.error("Error in Reading User and Password",error);
    }
  }


  async doItPromise() {

    if(this.partialAuth) {
      return await this.doCASValidation();
    }
    else {
      let authenticationManager = new authenticationData();
      return await this.doEntrireAuthProcess(authenticationManager);
    }
  }

}

module.exports = CASAuthentication;
// Main - called from command line
// if (require.main === module) {
//     parser.runMainPromise(module.exports);
// }
