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
	this.devices = [];
	this.rooms = [];
	this.devices_list_to_send = [];

	this.restApiDelayed = {
		timer: null,
		responseType: '',
		response: null,
		waitId: 0
	};

	var that = this;

	var __construct = (function () {
		that.adapter.log.info('ImperiHome server listening on port ' + that.settings.port);

		adapter.getForeignObject('system.adapter.imperihome.0', function (err, obj) {
			that.devices = obj.native.devices || [];
			that.rooms = obj.native.rooms || [];
		});

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

	function doResponse(res, status, headers, content) {
		if (!headers)
			headers = {};

		status = parseInt(status, 10) || 200;

		res.setHeader('Accept-Encoding', 'gzip, deflate');
		res.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
		res.setHeader('Accept-Ranges', 'bytes');
		res.setHeader('Content-Type', 'application/json');
		res.statusCode = status;
		res.end(JSON.stringify(content), 'utf8');
	}
	function convertValue(v) {
		switch (v) {
		case "true":
			return true;
			break;
		case "false":
			return false;
			break;
		default:
			return v;
			break;
		}
	}
	function clone(obj) {
		if (null == obj || "object" != typeof obj)
			return obj;
		var copy = obj.constructor();
		for (var attr in obj) {
			if (obj.hasOwnProperty(attr))
				copy[attr] = obj[attr];
		}
		return copy;
	}

	/*
	 *	Obsługa urządzeń
	 */

	//Zwraca typ urządzenia po jego ID
	function DevType(idIh) {
		var ret = null;
		for (var i = 0; i < that.devices.length; i++) {
			if (that.devices[i].id == idIh) {
				ret = that.devices[i].type;
				break;
			}
		}
		return ret;
	}

	//Zwraca ID ioBrokera dla parametru State
	function DevGetState(idIh) {
		var ret = null;
		for (var i = 0; i < that.devices.length; i++) {
			if (that.devices[i].id == idIh) {
				ret = {
					state: that.devices[i].params.state,
					state_v1: that.devices[i].params.state_v1,
					state_v0: that.devices[i].params.state_v0
				};
				break;
			}
		}
		return ret;
	}

	//Zwraca ID ioBrokera dla parametru Value
	function DevGetValue(idIh) {
		var ret = null;
		for (var i = 0; i < that.devices.length; i++) {
			if (that.devices[i].id == idIh) {
				ret = that.devices[i].params.value;
				break;
			}
		}
		return ret;
	}

	//Zwraca ID ioBrokera dla parametru Level
	function DevGetLevel(idIh) {
		var ret = null;
		for (var i = 0; i < that.devices.length; i++) {
			if (that.devices[i].id == idIh) {
				ret = that.devices[i].params.level;
				break;
			}
		}
		return ret;
	}

	//Zwraca ID ioBrokera dla parametru RGB
	function DevGetRGB(idIh) {
		var ret = null;
		for (var i = 0; i < that.devices.length; i++) {
			if (that.devices[i].id == idIh) {
				ret = that.devices[i].params.rgb;
				break;
			}
		}
		return ret;
	}

	//Zwraca ID ioBrokera dla parametru CMD
	function DevGetCmd(idIh) {
		var ret = null;
		for (var i = 0; i < that.devices.length; i++) {
			if (that.devices[i].id == idIh) {
				ret = {
					cmd: that.devices[i].params.cmd,
					cmd_v1: that.devices[i].params.cmd_v1,
					cmd_v0: that.devices[i].params.cmd_v0
				};
				break;
			}
		}
		return ret;
	}
	//Zwraca ID ioBrokera dla parametrów DevElectricitys
	function DevGetElectricitys(idIh) {
		var ret = null;
		for (var i = 0; i < that.devices.length; i++) {
			if (that.devices[i].id == idIh) {
				ret = {
					watts: that.devices[i].params.watts,
					consototal: that.devices[i].params.consototal
				};
				break;
			}
		}
		return ret;
	}

	//zwraca obiekt urządzenia o danym ID
	function DevGetDevice(idIh) {
		var ret = null;
		for (var i = 0; i < that.devices.length; i++) {
			if (that.devices[i].id == idIh) {
				ret = that.devices[i];
				break;
			}
		}
		return ret;
	}

	//dodaje urządzenie do wysyłanej listy
	function DevAddDeviceToList(dev, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}

		if (!that.devices_list_to_send)
			that.devices_list_to_send = [];

		that.devices_list_to_send.push(dev);

		//część odpowiedzialna za wysyłanie
		if (callback && that.devices_list_to_send.length == that.devices.length) {
			callback({
				devices: that.devices_list_to_send
			});
		}
	}

	//callback - funkcja wysyłająca "doResponse"
	//funkcja pobierająca informacje o DevSwitch
	function DevSwitch(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var s = DevGetState(command.deviceId);
		that.adapter.getForeignState(s.state, function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}
			var d = clone(DevGetDevice(command.deviceId));
			var params = [];
			/* TODO
			if (d.params.energy_v)
			params.push({
			key: "Energy",
			value: d.params.energy_v
			});
			 */
			if (d.params.pulsable)
				params.push({
					key: "pulseable",
					value: d.params.pulsable
				});

			if (d.params.state)
				params.push({
					key: "Status",
					value: (obj.val == convertValue(s.state_v1)) ? 1 : 0
				});

			d.params = params;

			if (callback) {
				callback(d);
			}
		});
	}
	//funkcja wykonująca akcję SetState dla DevSwitch
	function DevSwitchSetState(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var c = DevGetCmd(command.deviceId);

		that.adapter.setForeignState(c.cmd, (command.actionParam == 0) ? convertValue(c.cmd_v0) : convertValue(c.cmd_v1), function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}

			if (callback) {
				callback();
			}
		});
	}
	//funkcja wykonująca akcję puleable dla DevSwitch
	function DevSwitchPulse(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var c = DevGetCmd(command.deviceId);

		DevSwitch(command, function (d) {
			//d.params[1].value - [1] ponieważ na 2 miejscu jest status
			that.adapter.setForeignState(c.cmd, (d.params[1].value == 0) ? c.cmd_v1 : c.cmd_v0, function (err, obj) {
				if (err || !obj) {
					obj = undefined;
				}

				if (callback) {
					callback();
				}
			});
		});

	}

	//callback - funkcja wysyłająca "doResponse"
	//funkcja pobierająca informacje o DevDimmer
	function DevDimmer(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var s = DevGetState(command.deviceId);
		that.adapter.getForeignState(s.state, function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}
			var d = clone(DevGetDevice(command.deviceId));
			var params = [];
			/* TODO
			if (d.params.energy_v)
			params.push({
			key: "Energy",
			value: d.params.energy_v
			});
			 */

			that.adapter.getForeignState(DevGetLevel(command.deviceId), function (err1, obj1) {

				if (d.params.state)
					params.push({
						key: "Status",
						value: (obj.val == convertValue(s.state_v1)) ? 1 : 0
					});

				if (d.params.level)
					params.push({
						key: "Level",
						value: obj1.val
					});

				d.params = params;

				if (callback) {
					callback(d);
				}
			});
		});
	}
	//funkcja wykonująca akcję SetState dla DevDimmer
	function DevDimmerSetState(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var c = DevGetCmd(command.deviceId);

		that.adapter.setForeignState(c.cmd, (command.actionParam == 0) ? convertValue(c.cmd_v0) : convertValue(c.cmd_v1), function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}

			if (callback) {
				callback();
			}
		});
	}
	//funkcja wykonująca akcję SetLevel dla DevDimmer
	function DevDimmerSetLevel(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var c = DevGetLevel(command.deviceId);

		that.adapter.setForeignState(c, command.actionParam, function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}

			if (callback) {
				callback();
			}
		});
	}

	//callback - funkcja wysyłająca "doResponse"
	//funkcja pobierająca informacje o DevRGBLight
	function DevRGBLight(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var s = DevGetState(command.deviceId);
		that.adapter.getForeignState(s.state, function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}
			var d = clone(DevGetDevice(command.deviceId));
			var params = [];
			/* TODO
			if (d.params.energy_v)
			params.push({
			key: "Energy",
			value: d.params.energy_v
			});
			 */
			if (d.params.dimmable)
				params.push({
					key: "dimmable",
					value: d.params.dimmable
				});
			if (d.params.whitechannel)
				params.push({
					key: "whitechannel",
					value: d.params.whitechannel
				});

			that.adapter.getForeignState(DevGetLevel(command.deviceId), function (err1, obj1) {

				if (d.params.state)
					params.push({
						key: "Status",
						value: ((typeof obj.val != 'undefined') ? obj.val == convertValue(s.state_v1)) ? 1 : 0 : false
					});

				if (d.params.level)
					params.push({
						key: "Level",
						value: (typeof obj1.val != 'undefined') ? obj1.val : 100
					});

				that.adapter.getForeignState(DevGetRGB(command.deviceId), function (err2, obj2) {

					if (d.params.rgb)
						params.push({
							key: "color",
							value: obj2.val
						});

					d.params = params;

					if (callback) {
						callback(d);
					}
				});
			});
		});
	}
	//funkcja wykonująca akcję SetState dla DevRGBLight
	function DevRGBLightSetState(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var c = DevGetCmd(command.deviceId);

		that.adapter.setForeignState(c.cmd, (command.actionParam == 0) ? convertValue(c.cmd_v0) : convertValue(c.cmd_v1), function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}

			if (callback) {
				callback();
			}
		});
	}
	//funkcja wykonująca akcję SetLevel dla DevRGBLight
	function DevRGBLightSetLevel(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var c = DevGetLevel(command.deviceId);

		that.adapter.setForeignState(c, command.actionParam, function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}

			if (callback) {
				callback();
			}
		});
	}
	//funkcja wykonująca akcję SetColor dla DevRGBLight
	function DevRGBLightSetColor(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var c = DevGetRGB(command.deviceId);

		that.adapter.setForeignState(c, command.actionParam, function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}

			if (callback) {
				callback();
			}
		});
	}

	//callback - funkcja wysyłająca "doResponse"
	//funkcja pobierająca informacje o DevTemperature
	function DevTemperature(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var v = DevGetValue(command.deviceId);
		that.adapter.getForeignState(v, function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}
			var d = clone(DevGetDevice(command.deviceId));
			var params = [];

			if (d.params.value)
				params.push({
					key: "value",
					value: obj.val,
					graphable: convertValue(d.params.graphable),
					unit: d.params.unit
				});

			d.params = params;

			if (callback) {
				callback(d);
			}
		});
	}

	//callback - funkcja wysyłająca "doResponse"
	//funkcja pobierająca informacje o DevGenericSensor
	function DevGenericSensor(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var v = DevGetValue(command.deviceId);
		that.adapter.getForeignState(v, function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}
			var d = clone(DevGetDevice(command.deviceId));
			var params = [];

			if (d.params.value)
				params.push({
					key: "value",
					value: obj.val,
					graphable: convertValue(d.params.graphable),
					unit: d.params.unit
				});

			d.params = params;

			if (callback) {
				callback(d);
			}
		});
	}

	//callback - funkcja wysyłająca "doResponse"
	//funkcja pobierająca informacje o DevElectricitys
	function DevElectricitys(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var s = DevGetElectricitys(command.deviceId);
		that.adapter.getForeignState(s.watts, function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}
			var d = clone(DevGetDevice(command.deviceId));
			var params = [];
			/* TODO
			if (d.params.energy_v)
			params.push({
			key: "Energy",
			value: d.params.energy_v
			});
			 */
			params.push({
				key: "Watts",
				value: obj.val,
				unit: d.params.w_unit,
				graphable: convertValue(d.params.w_graphable)
			});

			that.adapter.getForeignState(s.consototal, function (err1, obj1) {

				params.push({
					key: "consototal",
					value: obj1.val,
					unit: d.params.cy_unit,
					graphable: convertValue(d.params.ct_graphable)
				});

				d.params = params;

				if (callback) {
					callback(d);
				}
			});
		});
	}

	//callback - funkcja wysyłająca "doResponse"
	//funkcja pobierająca informacje o DevCamera
	function DevCamera(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var d = clone(DevGetDevice(command.deviceId));
		var params = [];

		if (d.params.localjpegurl)
			params.push({
				key: "localjpegurl",
				value: d.params.localjpegurl
			});
		if (d.params.localmjpegurl)
			params.push({
				key: "localmjpegurl",
				value: d.params.localmjpegurl
			});
		if (d.params.remotejpegurl)
			params.push({
				key: "remotejpegurl",
				value: d.params.remotejpegurl
			});
		if (d.params.remotemjpegurl)
			params.push({
				key: "remotemjpegurl",
				value: d.params.remotemjpegurl
			});

		d.params = params;

		if (callback) {
			callback(d);
		}
	}

	//Zwraca ID ioBrokera dla parametrów DevDoor, DevFlood, DevMotion, DevSmoke, DevCO2Alert
	function DevGetAlarms(idIh) {
		var ret = null;
		for (var i = 0; i < that.devices.length; i++) {
			if (that.devices[i].id == idIh) {
				ret = {
					armed: that.devices[i].params.armed,
					tripped: that.devices[i].params.tripped,
					lasttrip: that.devices[i].params.lasttrip
				};
				break;
			}
		}
		return ret;
	}

	//funkcja wykonująca akcję SetArmed dla DevDoor, DevFlood, DevMotion, DevSmoke, DevCO2Alert
	function DevSetArmed(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var c = DevGetAlarms(command.deviceId);
		var d = DevGetDevice(command.deviceId);
		that.adapter.setForeignState(c.armed, (command.actionParam == 0) ? convertValue(d.params.armed_v0) : convertValue(d.params.armed_v1), function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}

			if (callback) {
				callback();
			}
		});
	}
	//funkcja wykonująca akcję SetAck dla DevDoor, DevFlood, DevMotion, DevSmoke, DevCO2Alert
	function DevSetAck(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var c = DevGetAlarms(command.deviceId);
		var d = DevGetDevice(command.deviceId);

		that.adapter.log.info('imperi przych: ' + convertValue(d.params.tripped_v0));
		that.adapter.setForeignState(c.tripped, convertValue(d.params.tripped_v0), function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}

			if (callback) {
				callback();
			}
		});
	}
	//callback - funkcja wysyłająca "doResponse"
	//funkcja pobierająca informacje o DevDoor, DevFlood, DevMotion, DevSmoke, DevCO2Alert
	function DevAlarms(command, callback) {
		if (typeof callback !== 'function') {
			callback = false;
		}
		var p = DevGetAlarms(command.deviceId);
		that.adapter.getForeignState(p.armed, function (err, obj) {
			if (err || !obj) {
				obj = undefined;
			}
			var d = clone(DevGetDevice(command.deviceId));
			var params = [];

			if (d.params.armed)
				params.push({
					key: "Armed",
					value: (obj.val == convertValue(d.params.armed_v1)) ? 1 : 0
				});

			that.adapter.getForeignState(p.tripped, function (err1, obj1) {

				if (d.params.tripped)
					params.push({
						key: "tripped",
						value: (obj1.val == convertValue(d.params.tripped_v1)) ? 1 : 0
					});

				that.adapter.getForeignState(p.lasttrip, function (err2, obj2) {

					if (d.params.lasttrip)
						params.push({
							key: "lasttrip",
							value: obj2.val
						});

					d.params = params;

					if (callback) {
						callback(d);
					}
				});
			});
		});
	}

	//Lista urządzeń
	function DevList(res, headers) {
		that.devices_list_to_send = [];

		for (var i = 0; i < that.devices.length; i++) {
			switch (that.devices[i].type) {
			case 'DevSwitch':
				var cmd = {
					deviceId: that.devices[i].id
				};
				DevSwitch(cmd, function (d) {
					DevAddDeviceToList(d, function (list) {
						//WYSŁANIE
						doResponse(res, 200, headers, list);
					});
				});

				break;
			case 'DevDimmer':
				var cmd = {
					deviceId: that.devices[i].id
				};
				DevDimmer(cmd, function (d) {
					DevAddDeviceToList(d, function (list) {
						//WYSŁANIE
						doResponse(res, 200, headers, list);
					});
				});
				break;
			case 'DevRGBLight':
				var cmd = {
					deviceId: that.devices[i].id
				};
				DevRGBLight(cmd, function (d) {
					DevAddDeviceToList(d, function (list) {
						//WYSŁANIE
						doResponse(res, 200, headers, list);
					});
				});
				break;
			case 'DevTemperature':
				var cmd = {
					deviceId: that.devices[i].id
				};
				DevTemperature(cmd, function (d) {
					DevAddDeviceToList(d, function (list) {
						//WYSŁANIE
						doResponse(res, 200, headers, list);
					});
				});
				break;
			case 'DevGenericSensor':
				var cmd = {
					deviceId: that.devices[i].id
				};
				DevGenericSensor(cmd, function (d) {
					DevAddDeviceToList(d, function (list) {
						//WYSŁANIE
						doResponse(res, 200, headers, list);
					});
				});
				break;
			case 'DevCamera':
				var cmd = {
					deviceId: that.devices[i].id
				};
				DevCamera(cmd, function (d) {
					DevAddDeviceToList(d, function (list) {
						//WYSŁANIE
						doResponse(res, 200, headers, list);
					});
				});
				break;
			case 'DevElectricity':
				var cmd = {
					deviceId: that.devices[i].id
				};
				DevElectricitys(cmd, function (d) {
					DevAddDeviceToList(d, function (list) {
						//WYSŁANIE
						doResponse(res, 200, headers, list);
					});
				});
				break;
			case 'DevDoor':
			case 'DevFlood':
			case 'DevMotion':
			case 'DevSmoke':
			case 'DevCO2Alert':
				var cmd = {
					deviceId: that.devices[i].id
				};
				DevAlarms(cmd, function (d) {
					DevAddDeviceToList(d, function (list) {
						//WYSŁANIE
						doResponse(res, 200, headers, list);
					});
				});
				break;
			}
		}
	}

	//określenie typu akcji do wykonania
	function commandType(url) {
		var url = url;
		var ret = {};

		if (url.indexOf('devices') > -1) {
			if (url.indexOf('action') > -1) {
				var u = url.replace('/devices/', '');
				u = u.replace('/action', '');
				var p = u.split('/');

				ret = {
					cmd: 'devices_action',
					deviceId: p[0].toLowerCase(),
					actionName: p[1].toLowerCase(),
					actionParam: (p[2]) ? p[2].toLowerCase() : ""
				}
			} else if (url.indexOf('histo') > -1) {
				var u = url.replace('/devices/', '');
				u = u.replace('/histo', '');
				var p = u.split('/');

				ret = {
					cmd: 'devices_histo',
					deviceId: p[0].toLowerCase(),
					paramName: p[1].toLowerCase(),
					startDate: p[2],
					endDate: p[3]
				}
			} else {
				ret = {
					cmd: 'devices_list'
				}
			}
		}

		if (url.indexOf('system') > -1) {
			ret = {
				cmd: 'system'
			}
		}

		if (url.indexOf('rooms') > -1) {
			ret = {
				cmd: 'rooms'
			}
		}

		return ret;
	}

	this.restApi = function (req, res, isAuth, isChecked) {
		var status = 200;
		var headers = {
			'Access-Control-Allow-Origin': '*'
		};
		var response;
		var command = {};
		var content = "";

		var url = decodeURI(req.url);
		command = commandType(url);

		switch (command.cmd) {
		case 'devices_list':
			DevList(res, headers);
			break;
		case 'devices_action':
			/*
			 *	AKCJE
			 */
			switch (DevType(command.deviceId)) {
			case 'DevSwitch':
				status = 200;
				content = {
					success: true,
					errormsg: "ok"
				};
				if (command.actionName == 'setstatus') {
					DevSwitchSetState(command, function () {
						doResponse(res, 200, headers, content);
					});
				} else if (command.actionName == 'pulse') {
					DevSwitchPulse(command, function () {
						doResponse(res, 200, headers, content);
					});
				}
				break;
			case 'DevDimmer':
				status = 200;
				content = {
					success: true,
					errormsg: "ok"
				};
				if (command.actionName == 'setstatus') {
					DevDimmerSetState(command, function () {
						doResponse(res, 200, headers, content);
					});
				} else if (command.actionName == 'setlevel') {
					DevDimmerSetLevel(command, function () {
						doResponse(res, 200, headers, content);
					});
				}
				break;
			case 'DevRGBLight':
				status = 200;
				content = {
					success: true,
					errormsg: "ok"
				};
				if (command.actionName == 'setstatus') {
					DevRGBLightSetState(command, function () {
						doResponse(res, 200, headers, content);
					});
				} else if (command.actionName == 'setlevel') {
					DevRGBLightSetLevel(command, function () {
						doResponse(res, 200, headers, content);
					});
				} else if (command.actionName == 'setcolor') {
					DevRGBLightSetColor(command, function () {
						doResponse(res, 200, headers, content);
					});
				}
				break;
			case 'DevDoor':
			case 'DevFlood':
			case 'DevMotion':
			case 'DevSmoke':
				//case 'DevCO2Alert':
				status = 200;
				content = {
					success: true,
					errormsg: "ok"
				};
				if (command.actionName == 'setarmed') {
					DevSetArmed(command, function () {
						doResponse(res, 200, headers, content);
					});
				} else if (command.actionName == 'setack') {
					DevSetAck(command, function () {
						doResponse(res, 200, headers, content);
					});
				}
				break;
			}
			//######################
			break;
		case 'devices_histo':

			adapter.log.info("url: " + url);
			var end_d = command.endDate;
			var start_d = command.startDate;
			var valID = DevGetDevice(command.deviceId);

			var idd = '-';
			
			switch(command.paramName){
				case 'value':
					idd = valID.params.value;
					break;
				case 'watts':
					idd = valID.params.watts;
					break;
				//case 'consototal':
				//	idd = valID.params.consototal;
				//	break;
					
			}
			var r = [];
			
			that.adapter.sendTo('history.0', 'getHistory', {
				id: idd,
				options: {
					start: start_d*1,
					end: end_d*1,
					ignoreNull:	true,
					aggregate: 'onchange'
				}
			}, function (result) {
				adapter.log.info(result.result.length);
				adapter.log.info("st: " + start_d);
				adapter.log.info("end: " + end_d);
				adapter.log.info("id: " + idd);
				
				for (var i = 0; i < result.result.length; i++) {
					r.push({
							date:	result.result[i].ts*1,
							value:	Math.round(result.result[i].val * 100) / 100
						});
				}
				//r.reverse();
				content = {
					values:	r
				};
				doResponse(res, 200, headers, content);
			});

			break;
		case 'system':
			//WYSŁANIE
			content = {
				id: 'ioBroker',
				apiversion: 1
			};
			doResponse(res, 200, headers, content);
			break;
		case 'rooms':
			//WYSŁANIE
			content = {
				rooms: that.rooms
			};
			doResponse(res, 200, headers, content);
			break;
		}

	};
}

module.exports = IhAPI;
