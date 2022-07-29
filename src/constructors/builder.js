
const Async = require('async');
const _ = require('lodash');
const Fs_ = require('fs-extra');
const fs = require('fs');
const Path = require('path');
const Docker_ = require('./docker');

const InitializeHelper = require('./initializer').Initialize;

const Initialize = new InitializeHelper();

class Builder {
    constructor(json) {
        if (!json || !_.isObject(json) || json === null || !_.keys(json).length) {
            throw new Error('Invalid JSON was passed to Builder.');
        }
        this.json = json;
    }

    init(next) {
        Fs_.writeJson(`./config/servers/${this.json.uuid}.json`, this.json, { spaces: 2 }, err => {

        });

        Initialize.setup(this.json);

        let DockerServer = new Docker_({"json": this.json}, function( ) {

        })
        
        DockerServer.build(function( ) {
            
        })
    }
}

module.exports = Builder;
