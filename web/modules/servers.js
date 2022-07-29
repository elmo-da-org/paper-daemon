async function getData(next) {
    var data = [];

    var glob = require('glob');
    var fs = require('fs');

    
    glob.sync( './config/servers/*.json' ).forEach( function( file ) {
        let rawdata = fs.readFileSync(file);
        let student = JSON.parse(rawdata);
        
        data.push(student)
    });

    next(data);
}

module.exports.getData = getData;