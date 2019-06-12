'use strict';

const Options = require('./Options');

class OptionBuilder {

    constructor(url) {
        this.url = encodeURI(url);
        this.headers = {
            'content-type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            accept:'application/json'
        };
    }

    setBody(body) {
        this.body = body;
        return this;
    }

    setFormData(body){
        this.formData = body;
        return this;
    }

    setCookie(cookie) {
        this.headers.cookie = cookie;
        return this;
    }

    setJSON(value) {
        this.json = value;
        return this;
    }

    setContentType(content){
        this.headers['content-type'] = content;
        return this;
    }

    build() {
        let optionObject = new Options(this);
        return optionObject.option;
    }


}

module.exports = OptionBuilder;
