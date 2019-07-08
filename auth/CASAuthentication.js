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

function getPassword (user)
{
  return new Promise(resolve => {
    resolve(config.password);
      // let rl = readline.createInterface({
      //     input: process.stdin,
      //     output: process.stdout
      // });

      // rl.stdoutMuted = true;

      // rl.question(`Enter password for ${user} : `, (pwd) => {
      //     rl.close();
      //     resolve(pwd);
      // });
      // let pwd='';
      // rl._writeToOutput = function _writeToOutput(stringToWrite) {

      //     if (rl.stdoutMuted)
      //         rl.output.write("\x1B[2K\x1B[200D"+(pwd+="*"));
      //     else
      //         rl.output.write(stringToWrite);
      // }
  });
}

function getUserName() {
  return new Promise(resolve => {
    resolve(config.username);
    // let rl = readline.createInterface({
    //   input: process.stdin,
    //   output: process.stdout
    // });

    // //rl.stdoutMuted = true;

    // rl.question('Enter username : ', (usr) => {
    //   rl.close();
    //   resolve(usr);
    // });

  });

}


class CASAuthentication {


  constructor(options)
  {

    this.LTCookie = null;
    this.CASCookie = null;
    this.JSESSIONID = null;
    this.STURL = null;
    this._args = {};
    // this.setup(options || this.parse());
  }

//   parse(argv) {
//     this.syntax = [
//         {
//             header: 'Description',
//             content: ['CAS Authentication for accessing Web Services']
//         },
//         parser.SynopsisFiles,
//         {
//             header: 'Main Options',
//             optionList: [
//                 {
//                     name: 'username', alias: 'u', typeLabel: 'UN',
//                     required: true,
//                     description: 'User Name'
//                 },
//                 {
//                     name: 'password', alias: 'p', typeLabel: 'PWD',
//                     required: true,
//                     description: 'Password of user'
//                 }
//             ]
//         },
//         CmdRunner.syntax()
//     ];
//     const validateObj = {
//       required: [['username', 'password']]
//     };
//     this.syntax.push({header:'validator', optionList:validateObj});
//     return parser.parse(this.syntax, argv);
//   }

  /**
     Interpret and store the setup values.
      @param {Object} args Setup arguments
  */
//   setup(args) {
//     this._args = args;
//     this._runner = new CmdRunner(this._args);
//   }

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

        let userName = os.userInfo().username;
        let password = await getPassword(userName);
        // this.setup({'username':userName, 'password':password});
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

  async setUserNamePassword() {

    try {
      this._args['username'] = await getUserName();
      this._args['password'] = await getPassword(this._args['username']);
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
