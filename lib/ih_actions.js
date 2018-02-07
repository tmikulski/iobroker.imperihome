'use strict';


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
			}
		}
	}
