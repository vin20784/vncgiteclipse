'use strict';

const https = require('https');
const url = require('url');

class RequestManager {

    //@TODO : Empty Constructor in the file
    constructor() {
    }

    parseOptions(options) {
        this.urlObj = url.parse(options.url);
        return {
            hostname: this.urlObj.hostname,
            path: this.urlObj.path,
            headers: options.headers,
            port: 443
        };
    }

    getRequest(options) {
        options = this.parseOptions(options);
        options.method = 'GET';
        var body = [];
        return new Promise((resolve, reject) => {
            var req = https.request(options, (res) => {
                res.on('data', (data) => {
                    body.push(data);
                });
                res.on('end', function () {
                    body = Buffer.concat(body).toString();
                    res.body = body;
                    resolve(res);
                });
            }).on('error', (error) => {
                reject(error);
            });

            req.end();
        });

    }

    postRequest(options) {
        var postData;
        var isForm = false;
        if (options.formData && !options.body) {
            options = this.formDataHandler(options);
            postData = options.formData;
            isForm = true;
        } else {
            postData = options.body;
        }
        options = this.parseOptions(options);
        options.method = 'POST';
        var body = [];
        return new Promise((resolve, reject) => {
            var req = https.request(options, (res) => {
                res.on('data', (data) => {
                    body.push(data);
                });
                res.on('end', function () {
                    body = Buffer.concat(body).toString();
                    res.body = body;
                    resolve(res);

                });
            }).on('error', (error) => {
                reject(error);
            });

            if (!isForm) {
                req.write(JSON.stringify(postData));
            } else {
                req.write(postData);
            }
            req.end();
        });
    }

    formDataHandler(options) {
        this.sep = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        options.formData = Object.keys(options.formData).reduce((acc, curr) => {
            return `${acc}--${this.sep}\r\nContent-Disposition: form-data; name="${curr}"\r\n\r\n${options.formData[curr]}`;
        }, '');
        options.headers['content-type'] = 'multipart/form-data; boundary=' + this.sep;
        return options;
    }

    putRequest(options) {
        var putData;
        var isForm = false;
        if (options.formData && !options.body) {
            options = this.formDataHandler(options);
            putData = options.formData;
            isForm = true;
        } else {
            putData = options.body;
        }

        options = this.parseOptions(options);
        options.method = 'PUT';
        var body = [];
        return new Promise((resolve, reject) => {
            var req = https.request(options, (res) => {
                res.on('data', (data) => {
                    body.push(data);
                });
                res.on('end', function () {
                    body = Buffer.concat(body).toString();
                    res.body = body;
                    resolve(res);

                });
            }).on('error', (error) => {
                reject(error);
            });
            if (!isForm) {
                req.write(JSON.stringify(putData));
            } else {
                req.write(putData);
            }
            req.end();
        });
    }




  /*getRequest(options) {

    utils.info("Get Request options as "+JSON.stringify(options));
    return new Promise((resolve, reject) => {

      request.get(options, (error, response, body) => {
          if (error) {
              reject(error);s
              return;
          }
          resolve(response);
      });

    });

  }

  postRequest(options) {

    utils.info("Post Request options as "+JSON.stringify(options));
    return new Promise((resolve, reject) => {

      request.post(options, (error,response, body) => {
          if (error) {
              reject(error);
              return;
          }
          resolve(response);
      });
    });
  }

  putRequest(options) {
    utils.info("Put Request options as "+JSON.stringify(options));
    return new Promise((resolve, reject) => {

      request.put(options, (error, response) => {
          if (error) {
              reject(error);
              return;
          }
          resolve(response);
      });
    });
  }*/

}

module.exports = RequestManager;
