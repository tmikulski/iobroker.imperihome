/* jshint -W097 */// jshint strict:false
/*jslint node: true */
"use strict";

// you have to require the utils module and call adapter function
var utils =    require(__dirname + '/lib/utils'); // Get common adapter utils
var IhAPI     = require(__dirname + '/lib/ihapi.js');
var LE        = require(utils.controllerDir + '/lib/letsencrypt.js');

var webServer = null;
var fs        = null;

var adapter = utils.adapter({
    name: 'imperihome',
    stateChange: function (id, state) {
        if (webServer && webServer.api) {
            webServer.api.stateChange(id, state);
        }
    },
    objectChange: function (id, obj) {
        if (webServer && webServer.api) {
            webServer.api.objectChange(id, obj);
        }

    },
    unload: function (callback) {
        try {
            adapter.log.info('terminating http' + (webServer.settings.secure ? 's' : '') + ' server on port ' + webServer.settings.port);
            //if (webServer.api) webServer.api.close();

            callback();
        } catch (e) {
            callback();
        }
    },
    ready: function () {
        console.log('ImperiHome Started...');
        main();
        
    }
});

function main() {
	
	if (adapter.config.webInstance) {
        console.log('Adapter runs as a part of web service');
        adapter.log.warn('Adapter runs as a part of web service');
        adapter.setForeignState('system.adapter.' + adapter.namespace + '.alive', false, true, function () {
            setTimeout(function () {
                process.exit();
            }, 1000);
        });
        return;
    }

	webServer = initWebServer(adapter.config);


    // in this imperihome all states changes inside the adapters namespace are subscribed
    adapter.subscribeStates('*');
/*
    // examples for the checkPassword/checkGroup functions
    adapter.checkPassword('admin', 'iobroker', function (res) {
        console.log('check user admin pw ioboker: ' + res);
    });

    adapter.checkGroup('admin', 'admin', function (res) {
        console.log('check group user admin group admin: ' + res);
    });

*/

}


function requestProcessor(req, res) {
    if (req.url.indexOf('favicon.ico') !== -1) {
        if (!fs) fs = require('fs');
        var stat = fs.statSync(__dirname + '/img/favicon.ico');

        res.writeHead(200, {
            'Content-Type': 'image/x-icon',
            'Content-Length': stat.size
        });

        var readStream = fs.createReadStream(__dirname + '/img/favicon.ico');
        // We replaced all the event handlers with a simple call to readStream.pipe()
        readStream.pipe(res);
    } else {
        webServer.api.restApi(req, res);
    }
}

function initWebServer(settings) {

    var server = {
        app:       null,
        server:    null,
        api:       null,
        io:        null,
        settings:  settings
    };

    if (settings.port) {
        if (settings.secure && !adapter.config.certificates) return null;

        server.server = LE.createServer(requestProcessor, settings, adapter.config.certificates, adapter.config.leConfig, adapter.log);
        server.server.__server = server;
    } else {
        adapter.log.error('port missing');
        process.exit(1);
    }

    if (server.server) {
        adapter.getPort(settings.port, function (port) {
            if (port != settings.port && !adapter.config.findNextPort) {
                adapter.log.error('port ' + settings.port + ' already in use');
                process.exit(1);
            }
            server.server.listen(port);
            adapter.log.info('http' + (settings.secure ? 's' : '') + ' server listening on port ' + port);
        });
    }

    server.api = new IhAPI(server.server, settings, adapter);

    if (server.server) {
        return server;
    } else {
        return null;
    }
}