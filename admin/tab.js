'use strict';

function ImperiHome(main, instance) {
	var that = this;
	var editMode = false;
	this.main = main;
	this.devices = [];
	this.rooms = [];

	instance = instance || 0;

	function saveSettingsAfterDelete(force) {

		that.saveTimer = setTimeout(function () {
				that.saveTimer = null;
				that.saveRunning = true;

				that.main.socket.emit('getObject', 'system.adapter.imperihome.' + instance, function (err, obj) {
					if (err) {
						that.main.showError(err);
					} else if (obj) {
						obj.native.devices = that.devices;

						that.main.socket.emit('setObject', obj._id, obj, function (err) {
							if (err) {
								that.main.showError(err);
							} else {
								$('#btn_save_settings').button('disable');
							}
							that.saveRunning = false;
						});
					}
					showDevices();
				});

			}, force ? 0 : 500);
	}

	function saveSettings(force, dial) {

		if (!$('#input_id').val()) {
			that.main.showError("Brak ID");
			return;
		}

		$('#btn_save_settings').button('enable');

		if (that.saveTimer) {
			clearTimeout(that.saveTimer);
			that.saveTimer = null;
		}

		that.saveTimer = setTimeout(function () {
				that.saveTimer = null;
				that.saveRunning = true;

				that.main.socket.emit('getObject', 'system.adapter.imperihome.' + instance, function (err, obj) {
					if (err) {
						that.main.showError(err);
					} else if (obj) {
						var p = {};
						switch ($('#input_type option:selected').text()) {
						case 'DevSwitch':
							p = {
								pulsable: $('#input_switch_pulsable[data-index="switch"] option:selected').val(),
								//energy_v: $('#input_switch_energy_val').val(),
								//energy_u: $('#input_switch_energy_unit').val(),
								state: $('#input_state[data-index="switch"]').val(),
								state_v1: $('#input_state_v1[data-index="switch"]').val(),
								state_v0: $('#input_state_v0[data-index="switch"]').val(),
								cmd: $('#input_cmd[data-index="switch"]').val(),
								cmd_v1: $('#input_cmd_v1[data-index="switch"]').val(),
								cmd_v0: $('#input_cmd_v0[data-index="switch"]').val()
							};
							break;
						case 'DevDimmer':
							p = {
								level: $('#input_level[data-index="dimmer"]').val(),
								//energy_v: $('#input_switch_energy_val').val(),
								//energy_u: $('#input_switch_energy_unit').val(),
								state: $('#input_state[data-index="dimmer"]').val(),
								state_v1: $('#input_state_v1[data-index="dimmer"]').val(),
								state_v0: $('#input_state_v0[data-index="dimmer"]').val(),
								cmd: $('#input_cmd[data-index="dimmer"]').val(),
								cmd_v1: $('#input_cmd_v1[data-index="dimmer"]').val(),
								cmd_v0: $('#input_cmd_v0[data-index="dimmer"]').val()
							};
							break;
						case 'DevRGBLight':
							p = {
								dimmable: $('#input_dimmable[data-index="rgb"] option:selected').val(),
								whitechannel: $('#input_whitechannel[data-index="rgb"] option:selected').val(),
								level: $('#input_level[data-index="rgb"]').val(),
								rgb: $('#input_rgb[data-index="rgb"]').val(),
								//energy_v: $('#input_switch_energy_val').val(),
								//energy_u: $('#input_switch_energy_unit').val(),
								state: $('#input_state[data-index="rgb"]').val(),
								state_v1: $('#input_state_v1[data-index="rgb"]').val(),
								state_v0: $('#input_state_v0[data-index="rgb"]').val(),
								cmd: $('#input_cmd[data-index="rgb"]').val(),
								cmd_v1: $('#input_cmd_v1[data-index="rgb"]').val(),
								cmd_v0: $('#input_cmd_v0[data-index="rgb"]').val()
							};
							break;
						case 'DevTemperature':
							p = {
								graphable: $('#input_graphable[data-index="temperature"] option:selected').val(),
								value: $('#input_temperature[data-index="temperature"]').val(),
								unit: $('#input_unit[data-index="temperature"] option:selected').val(),
							};
							break;
						case 'DevGenericSensor':
							p = {
								graphable: $('#input_graphable[data-index="genericsensor"] option:selected').val(),
								value: $('#input_value[data-index="genericsensor"]').val(),
								unit: $('#input_unit[data-index="genericsensor"]').val(),
							};
							break;
						case 'DevCamera':
							p = {
								localjpegurl: $('#input_localjpegurl[data-index="camera"]').val(),
								localmjpegurl: $('#input_localmjpegurl[data-index="camera"]').val(),
								remotejpegurl: $('#input_remotejpegurl[data-index="camera"]').val(),
								remotemjpegurl: $('#input_remotemjpegurl[data-index="camera"]').val()
							};
							break;
						case 'DevElectricity':
							p = {
								w_graphable: $('#input_w_graphable[data-index="electricitys"] option:selected').val(),
								ct_graphable: $('#input_ct_graphable[data-index="electricitys"] option:selected').val(),
								watts: $('#input_watts[data-index="electricitys"]').val(),
								w_unit: $('#input_w_unit[data-index="electricitys"]').val(),
								consototal: $('#input_consototal[data-index="electricitys"]').val(),
								ct_unit: $('#input_ct_unit[data-index="electricitys"]').val()
							};
							break;
						case 'DevDoor':
						case 'DevFlood':
						case 'DevMotion':
						case 'DevSmoke':
						case 'DevCO2Alert':
							p = {
								armable: $('#input_armable[data-index="alarms"] option:selected').val(),
								ackable: $('#input_ackable[data-index="alarms"] option:selected').val(),
								armed: $('#input_armed[data-index="alarms"]').val(),
								armed_v1: $('#input_armed_v1[data-index="alarms"]').val(),
								armed_v0: $('#input_armed_v0[data-index="alarms"]').val(),
								tripped: $('#input_tripped[data-index="alarms"]').val(),
								tripped_v1: $('#input_tripped_v1[data-index="alarms"]').val(),
								tripped_v0: $('#input_tripped_v0[data-index="alarms"]').val(),
								lasttrip: $('#input_time[data-index="alarms"]').val()
							};
							break;
						}

						var device = {
							id: $('#input_id').val(),
							name: $('#input_name').val(),
							type: $('#input_type option:selected').text(),
							room: $('#input_room1').val(),
							params: p
						};
						var idExist = false;
						var dev_index = -1;
						for (var r = 0; r < that.devices.length; r++) {
							var id = that.devices[r].id;
							if (id === device.id) {
								idExist = true;
								dev_index = r;
								break;
							}
						}
						//editMode - jeżeli jesteśmy w editMode to id może występować w tablicy
						if (editMode === false) {
							if (idExist === false)
								that.devices.push(device);
							else
								main.showMessage('Podane ID już istnieje', '', ''); //error
						} else {
							if (dev_index > -1) {
								that.devices[dev_index] = device;
							}
						}

						obj.native.devices = that.devices;

						that.main.socket.emit('setObject', obj._id, obj, function (err) {
							if (err) {
								that.main.showError(err);
							} else {
								$('#btn_save_settings').button('disable');
							}
							that.saveRunning = false;
						});
					}
					if (dial != null)
						$(dial).dialog('close');
					showDevices();
				});

			}, force ? 0 : 500);
	}

	this.prepare = function () {
		$('#btn_refresh').button({
			icons: {
				primary: 'ui-icon-refresh'
			},
			text: false
		}).css({
			width: 18,
			height: 18
		}).click(function () {
			//that.init(true, true);
			showDevices();
		});
		var $btnNewDevice = $('#btn_new_device');
		$btnNewDevice.button({
			icons: {
				primary: 'ui-icon-plus'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			that.addNewDevice();
		});
		$('#btn_save_settings').button({
			icons: {
				primary: 'ui-icon-disk'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			saveSettings(true, null);
		}).button('disable');

		/*
		 *		OBSŁUGA ROOMS
		 */
		$('#btn_open_rooms').button({
			icons: {
				primary: 'ui-icon-note'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			$('#dialog-rooms').dialog('open');
			$('#input_name_room').val("");
			$('#input_id_room').val("");
			showRooms();
		});

		$('#btn_save_room').click(function () {
			that.main.socket.emit('getObject', 'system.adapter.imperihome.' + instance, function (err, obj) {
				if (err) {
					that.main.showError(err);
				} else if (obj) {
					var rName = $('#input_name_room').val();
					var rId = $('#input_id_room').val();

					var idExist = false;
					var rIndex = -1;
					for (var r = 0; r < that.rooms.length; r++) {
						var id = that.rooms[r].id;
						if (id === rId) {
							idExist = true;
							rIndex = r;
							break;
						}
					}
					if (idExist === false)
						that.rooms.push({
							id: rId,
							name: rName
						});
					else
						if ($('#input_id_room').prop('disabled') === true) {
							that.rooms[rIndex].name = rName;
						} else {
							main.showMessage('Podane ID już istnieje', '', ''); //error
						}

					obj.native.rooms = that.rooms;

					that.main.socket.emit('setObject', obj._id, obj, function (err) {
						if (err) {
							that.main.showError(err);
						}
					});
				}
				$('#input_name_room').val("");
				$('#input_id_room').val("");
				$('#input_id_room').prop('disabled', false);
				showRooms();
			});
		});

		$('#btn_input_id_room_clear').button({
			icons: {
				primary: 'ui-icon-trash'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			$('#input_id_room').val("");
			$('#input_id_room').prop('disabled', false);
		});

		$('#btn_input_name_room_clear').button({
			icons: {
				primary: 'ui-icon-trash'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			$('#input_name_room').val("");
		});

		$('#btn_del_room').click(function () {
			that.main.socket.emit('getObject', 'system.adapter.imperihome.' + instance, function (err, obj) {
				if (err) {
					that.main.showError(err);
				} else if (obj) {}
				showRooms();
			});
		});

		$('#input_rooms').change(function () {
			var rId = $(this).val();
			var rName = $('#input_rooms option[value="' + rId + '"]').text();

			$('#input_name_room').val(rName);
			$('#input_id_room').val(rId);
			$('#input_id_room').prop('disabled', true);
		});

		function showRooms() {
			$('#input_rooms').empty();
			for (var r = 0; r < that.rooms.length; r++) {
				$('#input_rooms').append($("<option></option>")
					.attr("value", that.rooms[r].id)
					.text(that.rooms[r].name));
			}
		}
		/*
		 *##########################################
		 */
		//akcja dla zmiany typu
		$('#input_type').change(function () {
			$("#input_type option:selected").each(function () {
				showParams($(this).text(), null);
			});
		});

		//wybór zmiennej dla state
		$('.select-id-state').button({
			icons: {
				primary: 'ui-icon ui-icon-folder-open'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			var index = $(this).data('index');
			var sid = that.main.initSelectId();

			sid.selectId('show', '', function (newId) {
				$('#input_state[data-index="' + index + '"]').val(newId || '').trigger('change');
			});
		});
		//wybór zmiennej dla cmd
		$('.select-id-cmd').button({
			icons: {
				primary: 'ui-icon ui-icon-folder-open'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			var index = $(this).data('index');
			var sid = that.main.initSelectId();

			sid.selectId('show', '', function (newId) {
				$('#input_cmd[data-index="' + index + '"]').val(newId || '').trigger('change');
			});
		});

		//wybór zmiennej dla Level
		$('.select-id-level').button({
			icons: {
				primary: 'ui-icon ui-icon-folder-open'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			var index = $(this).data('index');
			var sid = that.main.initSelectId();
			sid.selectId('show', '', function (newId) {
				$('#input_level[data-index="' + index + '"]').val(newId || '').trigger('change');
			});
		});

		//wybór zmiennej dla Temperature
		$('.select-id-temperature').button({
			icons: {
				primary: 'ui-icon ui-icon-folder-open'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			var index = $(this).data('index');
			var sid = that.main.initSelectId();
			sid.selectId('show', '', function (newId) {
				$('#input_temperature[data-index="' + index + '"]').val(newId || '').trigger('change');
			});
		});

		//wybór zmiennej dla RGB
		$('.select-id-rgb').button({
			icons: {
				primary: 'ui-icon ui-icon-folder-open'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			var index = $(this).data('index');
			var sid = that.main.initSelectId();
			sid.selectId('show', '', function (newId) {
				$('#input_rgb[data-index="' + index + '"]').val(newId || '').trigger('change');
			});
		});
		//wybór zmiennej dla VALUE
		$('.select-id-value').button({
			icons: {
				primary: 'ui-icon ui-icon-folder-open'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			var index = $(this).data('index');
			var sid = that.main.initSelectId();
			sid.selectId('show', '', function (newId) {
				$('#input_value[data-index="' + index + '"]').val(newId || '').trigger('change');
			});
		});
		//wybór zmiennej dla Watts
		$('.select-id-watts').button({
			icons: {
				primary: 'ui-icon ui-icon-folder-open'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			var index = $(this).data('index');
			var sid = that.main.initSelectId();
			sid.selectId('show', '', function (newId) {
				$('#input_watts[data-index="' + index + '"]').val(newId || '').trigger('change');
			});
		});
		//wybór zmiennej dla consototal
		$('.select-id-consototal').button({
			icons: {
				primary: 'ui-icon ui-icon-folder-open'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			var index = $(this).data('index');
			var sid = that.main.initSelectId();
			sid.selectId('show', '', function (newId) {
				$('#input_consototal[data-index="' + index + '"]').val(newId || '').trigger('change');
			});
		});
		//wybór zmiennej dla time
		$('.select-id-time').button({
			icons: {
				primary: 'ui-icon ui-icon-folder-open'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			var index = $(this).data('index');
			var sid = that.main.initSelectId();
			sid.selectId('show', '', function (newId) {
				$('#input_time[data-index="' + index + '"]').val(newId || '').trigger('change');
			});
		});
		//wybór zmiennej dla armed
		$('.select-id-armed').button({
			icons: {
				primary: 'ui-icon ui-icon-folder-open'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			var index = $(this).data('index');
			var sid = that.main.initSelectId();
			sid.selectId('show', '', function (newId) {
				$('#input_armed[data-index="' + index + '"]').val(newId || '').trigger('change');
			});
		});
		//wybór zmiennej dla tripped
		$('.select-id-tripped').button({
			icons: {
				primary: 'ui-icon ui-icon-folder-open'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			var index = $(this).data('index');
			var sid = that.main.initSelectId();
			sid.selectId('show', '', function (newId) {
				$('#input_tripped[data-index="' + index + '"]').val(newId || '').trigger('change');
			});
		});
		/**
		 *	Okno dialogowe z ustawieniami urządzenia
		 */
		$('#dialog-device').dialog({
			autoOpen: false,
			modal: true,
			width: 650,
			//height:   300,
			buttons: [{
					text: _('Ok'),
					click: function () {
						saveSettings(true, this);
					}
				}, {
					text: _('Cancel'),
					click: function () {
						// restore settings
						var native = that.main.objects['system.adapter.imperihome.' + instance].native;
						$('#input_id').val('');
						$(this).dialog('close');
					}
				}
			]
		});

		/**
		 *	Okno dialogowe z ustawieniami pokoi
		 */
		$('#dialog-rooms').dialog({
			autoOpen: false,
			modal: true,
			width: 450,
			//height:   300,
			buttons: [{
					text: _('Ok'),
					click: function () {
						$(this).dialog('close');
					}
				}
			]
		});

	};

	//wczytywanie odpowiedniego zestawu parametrów
	function showParams(p, device) {

		if (editMode) {
			$('#input_type').val(device.type);
			$('#input_id').prop('disabled', true);
		} else
			$('#input_id').prop('disabled', false);

		switch (p) {
		case 'DevSwitch':
			$('#dialog-device-dimmer').hide();
			$('#dialog-device-rgb').hide();
			$('#dialog-device-temperature').hide();
			$('#dialog-device-genericsensor').hide();
			$('#dialog-device-camera').hide();
			$('#dialog-device-electricitys').hide();
			$('#dialog-device-alarms').hide();
			$('#dialog-device-switch').show();
			if (device != null) {
				$('#input_switch_pulsable[data-index="switch"]').val(device.params.pulsable);
				//$('#input_switch_energy_val').val(device.params.energy_v);
				//$('#input_switch_energy_unit').val(device.params.energy_u);
				$('#input_state[data-index="switch"]').val(device.params.state);
				$('#input_state_v1[data-index="switch"]').val(device.params.state_v1);
				$('#input_state_v0[data-index="switch"]').val(device.params.state_v0);
				$('#input_cmd[data-index="switch"]').val(device.params.cmd);
				$('#input_cmd_v1[data-index="switch"]').val(device.params.cmd_v1);
				$('#input_cmd_v0[data-index="switch"]').val(device.params.cmd_v0);
			}
			break;
		case 'DevDimmer':
			$('#dialog-device-switch').hide();
			$('#dialog-device-rgb').hide();
			$('#dialog-device-temperature').hide();
			$('#dialog-device-genericsensor').hide();
			$('#dialog-device-camera').hide();
			$('#dialog-device-electricitys').hide();
			$('#dialog-device-alarms').hide();
			$('#dialog-device-dimmer').show();
			if (device != null) {
				$('#input_level[data-index="dimmer"]').val(device.params.level);
				//$('#input_switch_energy_val').val(device.params.energy_v);
				//$('#input_switch_energy_unit').val(device.params.energy_u);
				$('#input_state[data-index="dimmer"]').val(device.params.state);
				$('#input_state_v1[data-index="dimmer"]').val(device.params.state_v1);
				$('#input_state_v0[data-index="dimmer"]').val(device.params.state_v0);
				$('#input_cmd[data-index="dimmer"]').val(device.params.cmd);
				$('#input_cmd_v1[data-index="dimmer"]').val(device.params.cmd_v1);
				$('#input_cmd_v0[data-index="dimmer"]').val(device.params.cmd_v0);
			}
			break;
		case 'DevRGBLight':
			$('#dialog-device-switch').hide();
			$('#dialog-device-dimmer').hide();
			$('#dialog-device-temperature').hide();
			$('#dialog-device-genericsensor').hide();
			$('#dialog-device-camera').hide();
			$('#dialog-device-electricitys').hide();
			$('#dialog-device-alarms').hide();
			$('#dialog-device-rgb').show();
			if (device != null) {
				$('#input_dimmable[data-index="rgb"]').val(device.params.dimmable);
				$('#input_whitechannel[data-index="rgb"]').val(device.params.whitechannel);
				$('#input_level[data-index="rgb"]').val(device.params.level);
				$('#input_rgb[data-index="rgb"]').val(device.params.rgb);
				//$('#input_switch_energy_val').val(device.params.energy_v);
				//$('#input_switch_energy_unit').val(device.params.energy_u);
				$('#input_state[data-index="rgb"]').val(device.params.state);
				$('#input_state_v1[data-index="rgb"]').val(device.params.state_v1);
				$('#input_state_v0[data-index="rgb"]').val(device.params.state_v0);
				$('#input_cmd[data-index="rgb"]').val(device.params.cmd);
				$('#input_cmd_v1[data-index="rgb"]').val(device.params.cmd_v1);
				$('#input_cmd_v0[data-index="rgb"]').val(device.params.cmd_v0);
			}
			break;
		case 'DevTemperature':
			$('#dialog-device-switch').hide();
			$('#dialog-device-dimmer').hide();
			$('#dialog-device-rgb').hide();
			$('#dialog-device-genericsensor').hide();
			$('#dialog-device-camera').hide();
			$('#dialog-device-electricitys').hide();
			$('#dialog-device-alarms').hide();
			$('#dialog-device-temperature').show();
			if (device != null) {
				$('#input_graphable[data-index="temperature"]').val(device.params.graphable);
				$('#input_temperature[data-index="temperature"]').val(device.params.value);
				$('#input_unit[data-index="temperature"]').val(device.params.unit);
			}
			break;
		case 'DevGenericSensor':
			$('#dialog-device-switch').hide();
			$('#dialog-device-dimmer').hide();
			$('#dialog-device-rgb').hide();
			$('#dialog-device-temperature').hide();
			$('#dialog-device-camera').hide();
			$('#dialog-device-electricitys').hide();
			$('#dialog-device-alarms').hide();
			$('#dialog-device-genericsensor').show();
			if (device != null) {
				$('#input_graphable[data-index="genericsensor"]').val(device.params.graphable);
				$('#input_value[data-index="genericsensor"]').val(device.params.value);
				$('#input_unit[data-index="genericsensor"]').val(device.params.unit);
			}
			break;
		case 'DevCamera':
			$('#dialog-device-switch').hide();
			$('#dialog-device-dimmer').hide();
			$('#dialog-device-rgb').hide();
			$('#dialog-device-temperature').hide();
			$('#dialog-device-genericsensor').hide();
			$('#dialog-device-electricitys').hide();
			$('#dialog-device-alarms').hide();
			$('#dialog-device-camera').show();
			if (device != null) {
				$('#input_localjpegurl[data-index="camera"]').val(device.params.localjpegurl);
				$('#input_localmjpegurl[data-index="camera"]').val(device.params.localmjpegurl);
				$('#input_remotejpegurl[data-index="camera"]').val(device.params.remotejpegurl);
				$('#input_remotemjpegurl[data-index="camera"]').val(device.params.remotemjpegurl);
			}
			break;
		case 'DevElectricity':
			$('#dialog-device-switch').hide();
			$('#dialog-device-dimmer').hide();
			$('#dialog-device-rgb').hide();
			$('#dialog-device-temperature').hide();
			$('#dialog-device-camera').hide();
			$('#dialog-device-genericsensor').hide();
			$('#dialog-device-alarms').hide();
			$('#dialog-device-electricitys').show();
			if (device != null) {
				$('#input_w_graphable[data-index="electricitys"]').val(device.params.w_graphable);
				$('#input_ct_graphable[data-index="electricitys"]').val(device.params.ct_graphable);
				$('#input_watts[data-index="electricitys"]').val(device.params.watts);
				$('#input_w_unit[data-index="electricitys"]').val(device.params.w_unit);
				$('#input_consototal[data-index="electricitys"]').val(device.params.consototal);
				$('#input_ct_unit[data-index="electricitys"]').val(device.params.ct_unit);
			}
			break;
		case 'DevDoor':
		case 'DevFlood':
		case 'DevMotion':
		case 'DevSmoke':
		case 'DevCO2Alert':
			$('#dialog-device-dimmer').hide();
			$('#dialog-device-rgb').hide();
			$('#dialog-device-temperature').hide();
			$('#dialog-device-genericsensor').hide();
			$('#dialog-device-camera').hide();
			$('#dialog-device-electricitys').hide();
			$('#dialog-device-switch').hide();
			$('#dialog-device-alarms').show();
			if (device != null) {
				$('#input_armable[data-index="alarms"]').val(device.params.armable);
				$('#input_ackable[data-index="alarms"]').val(device.params.ackable);
				$('#input_armed[data-index="alarms"]').val(device.params.armed);
				$('#input_armed_v1[data-index="alarms"]').val(device.params.armed_v1);
				$('#input_armed_v0[data-index="alarms"]').val(device.params.armed_v0);
				$('#input_tripped[data-index="alarms"]').val(device.params.tripped);
				$('#input_tripped_v1[data-index="alarms"]').val(device.params.tripped_v1);
				$('#input_tripped_v0[data-index="alarms"]').val(device.params.tripped_v0);
				$('#input_time[data-index="alarms"]').val(device.params.lasttrip);
			}
			break;
		}
	}

	function showDevices() {
		$('#tab-rules-body').empty();
		for (var r = 0; r < that.devices.length; r++) {

			$('#tab-rules-body').append('<tr><td>' + r + '</td><td>' + that.devices[r].name + '</td><td>' + that.devices[r].id + '</td><td>' + that.devices[r].type + '</td><td>' + that.devices[r].room + '</td><td><button class="btn_device_settings" data-index="' + that.devices[r].id + '" /></td><td><button class="btn_device_delete" data-index="' + that.devices[r].id + '" /></td></tr>');
		}

		$('.btn_device_settings').button({
			icons: {
				primary: 'ui-icon-note'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			editMode = true;
			var device = {};
			var index = $(this).data('index');
			$('#dialog-device').dialog('open');

			if (!index)
				console.log("index: null");
			else {
				for (var r = 0; r < that.devices.length; r++) {
					var id = that.devices[r].id;
					if (id === index) {
						device = that.devices[r];
						break;
					}
				}
				$('#input_id').val(device.id);
				$('#input_name').val(device.name);
				$('#input_type').val(device.type);
				//dodawanie listy pomieszczeń
				$('#input_room1').empty();
				for (var r = 0; r < that.rooms.length; r++) {
					$('#input_room1').append($("<option></option>")
						.attr("value", that.rooms[r].id)
						.text(that.rooms[r].name));
				}
				$('#input_room1').val(device.room);
			}
			showParams($('#input_type option:selected').text(), device);

		});

		$('.btn_device_delete').button({
			icons: {
				primary: 'ui-icon-trash'
			},
			text: false
		}).css({
			width: 21,
			height: 21
		}).click(function () {
			var device = {};
			var index = $(this).data('index');
			that.main.confirmMessage(_('Are you sure (ID: ' + index + ')?'), _('Confirm deletion'), 'trash', function (result) {
				if (result) {
					var rr = -1;
					for (var r = 0; r < that.devices.length; r++) {
						var id = that.devices[r].id;
						if (id === index) {
							device = that.devices[r];
							rr = r;
							break;
						}
					}
					if (rr > -1) {
						console.log("delete1: " + that.devices.length);
						var x = that.devices.splice(r, 1);
						console.log("delete2: " + JSON.stringify(x));
						console.log("delete3: " + that.devices.length);
						saveSettingsAfterDelete(true);
					}
				}
			});

			console.log("delete: " + device.id);
		});
	}

	this.addNewDevice = function () {
		/*this.devices.push({
		id:		'',
		name:	'',
		type:	'',
		room:	'',
		param:	{}
		});
		showDevices();*/
		editMode = false;
		$('#input_id').val("");
		$('#input_name').val("");
		//$('#input_type').val("");
		$('#input_room1').val("");

		$('#dialog-device').dialog('open');

		//dodawanie listy pomieszczeń
		$('#input_room1').empty();
		for (var r = 0; r < that.rooms.length; r++) {
			$('#input_room1').append($("<option></option>")
				.attr("value", that.rooms[r].id)
				.text(that.rooms[r].name));
		}
		//$('#input_room1').val(device.room);

		showParams($('#input_type option:selected').text());
	};

	this.init = function (update) {
		if (!this.main.objectsLoaded) {
			setTimeout(function () {
				that.init();
			}, 250);
			return;
		}
		if (update) {
			that.main.socket.emit('getObject', 'system.adapter.imperihome.' + instance, function (err, obj) {
				if (err) {
					that.main.showError(err);
				}
				if (obj) {
					that.main.objects['system.adapter.imperihome.' + instance] = obj;
					if (obj.native) {
						that.devices = obj.native.devices || [];
						that.rooms = obj.native.rooms || [];
					} else {
						that.devices = [];
						that.rooms = [];
					}
					showDevices();
				}
			});
		} else {
			if (this.main.objects['system.adapter.imperihome.' + instance] && this.main.objects['system.adapter.imperihome.' + instance].native) {
				this.devices = this.main.objects['system.adapter.imperihome.' + instance].native.devices || [];
				this.rooms = this.main.objects['system.adapter.imperihome.' + instance].native.rooms || [];
			} else {
				this.devices = [];
				that.rooms = [];
			}
			showDevices();
		}
	};

	this.objectChange = function (id, obj) {};

	this.stateChange = function (id, state) {};
}

var main = {
	socket: io.connect(),
	saveConfig: function (attr, value) {
		if (!main.config)
			return;
		if (attr)
			main.config[attr] = value;

		if (typeof storage != 'undefined') {
			storage.set('adminConfig', JSON.stringify(main.config));
		}
	},
	showError: function (error) {
		main.showMessage(_(error), _('Error'), 'alert');
	},
	showMessage: function (message, title, icon) {
		$dialogMessage.dialog('option', 'title', title || _('Message'));
		$('#dialog-message-text').html(message);
		if (icon) {
			$('#dialog-message-icon').show();
			$('#dialog-message-icon').attr('class', '');
			$('#dialog-message-icon').addClass('ui-icon ui-icon-' + icon);
		} else {
			$('#dialog-message-icon').hide();
		}
		$dialogMessage.dialog('open');
	},
	confirmMessage: function (message, title, icon, callback) {
		$dialogConfirm.dialog('option', 'title', title || _('Message'));
		$('#dialog-confirm-text').html(message);
		if (icon) {
			$('#dialog-confirm-icon').show();
			$('#dialog-confirm-icon').attr('class', '');
			$('#dialog-confirm-icon').addClass('ui-icon ui-icon-' + icon);
		} else {
			$('#dialog-confirm-icon').hide();
		}
		$dialogConfirm.data('callback', callback);
		$dialogConfirm.dialog('open');
	},
	initSelectId: function () {
		if (main.selectId)
			return main.selectId;
		main.selectId = $('#dialog-select-member').selectId('init', {
				objects: main.objects,
				states: main.states,
				noMultiselect: true,
				imgPath: '../../lib/css/fancytree/',
				filter: {
					type: 'state'
				},
				name: 'rules-select-state',
				texts: {
					select: _('Select'),
					cancel: _('Cancel'),
					all: _('All'),
					id: _('ID'),
					name: _('Name'),
					role: _('Role'),
					room: _('Room'),
					value: _('Value'),
					selectid: _('Select ID'),
					from: _('From'),
					lc: _('Last changed'),
					ts: _('Time stamp'),
					wait: _('Processing...'),
					ack: _('Acknowledged'),
					selectAll: _('Select all'),
					unselectAll: _('Deselect all'),
					invertSelection: _('Invert selection')
				},
				columns: ['image', 'name', 'role', 'room', 'value']
			});
		return main.selectId;
	},
	objects: {},
	states: {},
	currentHost: '',
	objectsLoaded: false,
	waitForRestart: false,
	selectId: null,
	selectIds: null
};

var $dialogMessage = $('#dialog-message');
var $dialogConfirm = $('#dialog-confirm');

// Read all positions, selected widgets for every view,
// Selected view, selected menu page,
// Selected widget or view page
// Selected filter
if (typeof storage != 'undefined') {
	try {
		main.config = storage.get('adminConfig');
		if (main.config) {
			main.config = JSON.parse(main.config);
		} else {
			main.config = {};
		}
	} catch (e) {
		console.log('Cannot load edit config');
		main.config = {};
	}
}

var attributes = decodeURIComponent(window.location.search.substring(1)).split('&');
var instance = 0;
for (var i = 0; i < attributes.length; i++) {
	var sParams = attributes[i].split('=');

	if (sParams[0] === 'instance')
		instance = sParams[1];
}

var firstConnect = true;
var ih = new ImperiHome(main, instance);

function getStates(callback) {
	main.socket.emit('getStates', function (err, res) {
		main.states = res;
		if (typeof callback === 'function') {
			setTimeout(function () {
				callback();
			}, 0);
		}
	});
}

function getObjects(callback) {
	main.socket.emit('getObjects', function (err, res) {
		setTimeout(function () {
			var obj;
			main.objects = res;
			for (var id in main.objects) {
				obj = res[id];
			}
			main.objectsLoaded = true;

			ih.prepare();
			ih.init();

			if (typeof callback === 'function')
				callback();
		}, 0);
	});
}

function objectChange(id, obj) {
	var isNew = false;

	// update main.objects cache
	if (obj) {
		if (obj._rev && main.objects[id])
			main.objects[id]._rev = obj._rev;
		if (!main.objects[id]) {
			isNew = true;
		}
		if (isNew || JSON.stringify(main.objects[id]) != JSON.stringify(obj)) {
			main.objects[id] = obj;
		}
	} else if (main.objects[id]) {
		delete main.objects[id];
	}

	if (main.selectId)
		main.selectId.selectId('object', id, obj);
	if (main.selectIds)
		main.selectIds.selectId('object', id, obj);

	ih.objectChange(id, obj);
}

function stateChange(id, state) {
	id = id ? id.replace(/ /g, '_') : '';

	if (!id || !id.match(/\.messagebox$/)) {
		if (main.selectId)
			main.selectId.selectId('state', id, state);
		if (main.selectIds)
			main.selectIds.selectId('state', id, state);

		if (!state) {
			delete main.states[id];
		} else {
			main.states[id] = state;
		}

		ih.stateChange(id, state);
	}
}

main.socket.on('permissionError', function (err) {
	main.showMessage(_('Has no permission to %s %s %s', err.operation, err.type, (err.id || '')));
});
main.socket.on('objectChange', function (id, obj) {
	setTimeout(objectChange, 0, id, obj);
});
main.socket.on('stateChange', function (id, obj) {
	setTimeout(stateChange, 0, id, obj);
});
main.socket.on('connect', function () {
	$('#connecting').hide();
	if (firstConnect) {
		firstConnect = false;

		main.socket.emit('getUserPermissions', function (err, acl) {
			main.acl = acl;
			// Read system configuration
			main.socket.emit('getObject', 'system.config', function (err, data) {
				main.systemConfig = data;
				if (!err && main.systemConfig && main.systemConfig.common) {
					systemLang = main.systemConfig.common.language;
				} else {
					systemLang = window.navigator.userLanguage || window.navigator.language;

					if (systemLang !== 'en' && systemLang !== 'de' && systemLang !== 'ru') {
						main.systemConfig.common.language = 'en';
						systemLang = 'en';
					}
				}

				translateAll();

				$dialogMessage.dialog({
					autoOpen: false,
					modal: true,
					buttons: [{
							text: _('Ok'),
							click: function () {
								$(this).dialog("close");
							}
						}
					]
				});

				$dialogConfirm.dialog({
					autoOpen: false,
					modal: true,
					buttons: [{
							text: _('Ok'),
							click: function () {
								var cb = $(this).data('callback');
								$(this).dialog('close');
								if (cb)
									cb(true);
							}
						}, {
							text: _('Cancel'),
							click: function () {
								var cb = $(this).data('callback');
								$(this).dialog('close');
								if (cb)
									cb(false);
							}
						}

					]
				});

				getStates(getObjects);
			});
		});
	}
	if (main.waitForRestart) {
		location.reload();
	}
});
main.socket.on('disconnect', function () {
	$('#connecting').show();
});
main.socket.on('reconnect', function () {
	$('#connecting').hide();
	if (main.waitForRestart) {
		location.reload();
	}
});
main.socket.on('reauthenticate', function () {
	location.reload();
});
