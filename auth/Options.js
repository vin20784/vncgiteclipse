'use strict';

class Options {

    constructor(builderOption) {
        this.option = {
            url : builderOption.url,
            headers : builderOption.headers,
            body : builderOption.body || 0,
            formData : builderOption.formData || 0,
            json : builderOption.json || false
        };
    }

}

module.exports = Options;
