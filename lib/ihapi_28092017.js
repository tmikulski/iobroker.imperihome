/* jshint -W097 */// jshint strict:false
/*jslint node: true */
/*jshint -W061 */
'use strict';

/**
 * IhAPI class
 *
 * From settings used only secure, auth and crossDomain
 *
 * @class
 * @param {object} server http or https node.js object
 * @param {object} webSettings settings of the web server, like <pre><code>{secure: settings.secure, port: settings.port}</code></pre>
 * @param {object} adapter web adapter object
 * @param {object} instanceSettings instance object with common and native
 * @param {object} app express application
 * @return {object} object instance
 */

function IhAPI(server, webSettings, adapter, instanceSettings, app) {
	if (!(this instanceof IhAPI))
		return new IhAPI(server, webSettings, adapter, instanceSettings, app);

	this.server = server;
	this.app = app;
	this.adapter = adapter;
	this.settings = webSettings;
	this.config = instanceSettings ? instanceSettings.native : {};
	this.namespace = instanceSettings ? instanceSettings._id.substring('system.adapter.'.length) : 'imperihome';
	this.devices_to_send = [];
	this.devices_to_send_prep = [];

	this.restApiDelayed = {
		timer: null,
		responseType: '',
		response: null,
		waitId: 0
	};

	var that = this;

	var __construct = (function () {
		that.adapter.log.info('ImperiHome server listening on port ' + that.settings.port);

		if (that.app) {
			adapter.log.info('Install extension on /' + that.namespace + '/');
			that.app.use('/' + that.namespace + '/', function (req, res, next) {
				that.restApi.call(that, req, res);
			});
		}

	}
		.bind(this))();

	this.stateChange = function (id, state) {
		if (that.restApiDelayed.id === id && state && state.ack) {
			adapter.unsubscribeForeignStates(id);
			that.restApiDelayed.response = state;
			setTimeout(restApiDelayedAnswer, 0);
		}
	};

	this.objectChange = function (id, state) {};

	function restApiDelayedAnswer() {
		if (that.restApiDelayed.timer) {
			clearTimeout(that.restApiDelayed.timer);
			that.restApiDelayed.timer = null;

			doResponse(that.restApiDelayed.res, that.restApiDelayed.responseType, 200, {
				'Access-Control-Allow-Origin': '*'
			}, that.restApiDelayed.response, that.restApiDelayed.prettyPrint);
			that.restApiDelayed.id = null;
			that.restApiDelayed.res = null;
			that.restApiDelayed.response = null;
			that.restApiDelayed.prettyPrint = false;
		}
	}

	function findState(idOrName, type, callback) {
		if (typeof type === 'function') {
			callback = type;
			type = null;
		}
		adapter.findForeignObject(idOrName, type, callback);
	}

	function getState(idOrName, type, callback) {
		if (typeof type === 'function') {
			callback = type;
			type = null;
		}
		findState(idOrName, type, function (err, id, originId) {
			if (err) {
				if (callback)
					callback(err, undefined, null, originId);
			} else
				if (id) {
					that.adapter.getForeignState(id, function (err, obj) {
						if (err || !obj) {
							obj = undefined;
						}
						if (callback)
							callback(err, obj, id, originId);
					});
				} else {
					if (callback)
						callback(null, undefined, null, originId);
				}
		});
	}

	function getIoBrokerCmdId(ihId, devices_list) {
		var ret = null;
		for (var i = 0; i < devices_list.length; i++) {
			if (devices_list[i].id == ihId) {
				ret = devices_list[i].params.cmd;
				break;
			}
		}
		return ret;
	}

	function getIoBrokerStateId(ihId, devices_list) {
		for (var i = 0; i < devices_list.length; i++) {
			if (devices_list[i].id == ihId) {
				return devices_list[i].params.state;
			} else {
				return null;
			}
		}
	}

	function devSetStatus(id, st, callback) {
		findState(id, function (err, id, originId) {
			if (err) {
				doResponse(res, 'json', 500, headers, 'error: ' + err);
			} else
				adapter.subscribeForeignStates(id);

			adapter.setForeignState(id, (st == 1) ? true : false, function (err) {

				if (typeof callback !== 'function') {
					callback = false;
				}

				if (err) {
					if (callback)
						callback(false);
				} else {
					//akcja
					if (callback)
						callback(true);
				}

			});
		});
	}

	function doResponse(res, type, status, headers, content, pretty) {
		if (!headers)
			headers = {};

		status = parseInt(status, 10) || 200;

		if (pretty && typeof content === 'object') {
			type = 'plain';
			content = JSON.stringify(content, null, 2);
		}

		res.setHeader('Accept-Encoding', 'gzip, deflate');
		res.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
		res.setHeader('Accept-Ranges', 'bytes');

		switch (type) {
		case 'json':
			res.setHeader('Content-Type', 'application/json');
			res.statusCode = status;
			res.end(JSON.stringify(content), 'utf8');
			break;

		case 'plain':
			res.setHeader('Content-Type', 'text/plain');
			res.statusCode = status;
			if (typeof content === 'object') {
				content = JSON.stringify(content);
			}

			res.end(content, 'utf8');
			break;
		}
	}

	function devPrepStateToSend(d, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}

		that.devices_to_send.push(d);

		if (callback && that.devices_to_send_prep.length === 0)
			callback();
	}

	function devGetState(callback) {
		var dd = that.devices_to_send_prep.pop();
		if (typeof callback !== 'function') {
			callback = false;
		}

		that.adapter.getForeignState(dd.params.state, function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}

			if (callback) {
				callback(dd, obj);
				if (that.devices_to_send_prep.length > 0)
					devGetState(callback);
			}
		});

	}

	this.commands = [];

	this.restApi = function (req, res, isAuth, isChecked) {
		var wait = 0;
		var responseType = 'json';
		var status = 500;
		var headers = {
			'Access-Control-Allow-Origin': '*'
		};
		var response;

		var dev_l = [];
		var value;
		var command = "";

		var url = decodeURI(req.url);

		//wycinanie pierwszego "/"
		url = url.substring(1, url.length);

		//sprawdzenie czy w "url" znajdują się jeszcze jakieś "/"
		var pos = url.indexOf('/');

		//jeżeli nie ma już "/" a komenda jest "devices" to drukujemy listę

		if (url.indexOf('devices') > -1 && url.length < 10)
			command = "devices";
		else if (url.indexOf('devices') > -1 && url.length >= 10)
			command = 'devices/';

		if (url.indexOf('system') > -1 && url.length < 10)
			command = "system";

		if (url.indexOf('rooms') > -1 && url.length < 10)
			command = "rooms";

		if (pos !== -1) {}

		adapter.getForeignObject('system.adapter.imperihome.0', function (err, obj) {
			dev_l = obj.native.devices || [];
			that.devices_to_send_prep = dev_l;
			switch (command) {
				//Lista wszystkich urządzeń
			case 'devices':
				that.devices_to_send = [];
				devGetState(function (d, s) {
					var params = [];
					switch (d.type) {
					case "DevSwitch":
						params.push({
							key: "pulseable",
							value: d.params.pulsable
						});
						params.push({
							key: "energy",
							value: d.params.energy_v
						});
						if (s)
							params.push({
								key: "Status",
								value: s.val
							});
						break;
					}
					d.params = params;

					devPrepStateToSend(d, function () {
						value = {
							devices: that.devices_to_send
						};
						status = 200;
						doResponse(res, responseType, status, headers, value, false);
					});
				});
				break;

			case 'devices/': //dane konkretnego urządzenia
				var p = url.indexOf('action');
				var tmp_url = url.replace('devices/', '');

				var action;
				var devId;
				var tmp;
				var action_value;

				//wyciągnięcie akcji
				if (p > -1) {
					tmp_url = tmp_url.replace('action/', '');
					tmp = tmp_url.split('/');
					devId = tmp[0]
						action = tmp[1];
					action_value = tmp[2];

					var ibId = getIoBrokerCmdId(devId, dev_l);
					if (ibId) {
						devSetStatus(ibId, action_value, function (s) {
							if (s) {
								status = 200;
								response = {
									success: true,
									errormsg: "ok"
								};
								doResponse(res, 'json', status, headers, response, false);
							} else {
								status = 500;
								value = {
									success: true,
									errormsg: "error"
								};
								doResponse(res, responseType, status, headers, value, false);
							}
						});
					}

				}
				break;
			case 'system':
				value = {
					id: "ioBroker",
					apiversion: 1
				}
				status = 200;
				doResponse(res, responseType, status, headers, value, false);
				break;
			case 'rooms':
				var rooms = [];
				adapter.getForeignObject('system.adapter.imperihome.0', function (err, obj) {
					rooms = obj.native.rooms || [];

					value = {
						rooms: rooms
					};
					status = 200;
					doResponse(res, responseType, status, headers, value, false);
				});
				break;
			default:
				that.adapter.log.debug("komenda dupa");
				break;
			}

		});
	};
}

module.exports = IhAPI;
