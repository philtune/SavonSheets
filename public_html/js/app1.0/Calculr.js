/**
 *
 * @param {object} calc_options
 * @returns {Object}
 * @constructor
 */
function Calculr(calc_options)
{
	var data_obj = calc_options.data_obj,
		tmp_data_obj = calc_options.tmp_data_obj || {},
		tmp_controls = {},
		finally_func = calc_options.finally || null;

	function finallyFunc()
	{
		if ( typeof finally_func === 'function' )
			return finally_func.call(Calculr);
		return false;
	}

	var Calculr = {
		controls: {},
		controller: {},

		/**
		 *
		 * @param {string} control_name
		 * @param {object} control_options
		 * @returns {Calculr}
		 */
		addControl: function(control_name, control_options)
		{
			if ( typeof control_options === 'string' )
				control_options = { type: control_options };
			var control_is_tmp = control_options.hasOwnProperty('is_tmp') ? control_options.is_tmp : false,
				control_is_assignable = control_options.hasOwnProperty('assignable') ? control_options.assignable : true,
				control_default = control_options.default,
				control_type = control_options.type || 'number',
				control_data_obj = control_is_tmp ? tmp_data_obj : data_obj,
				control_validator = control_options.validate || null,
				control_autoupdater = control_options.update;

			/**
			 * Validates and assigns value to data object
			 * @param {*} val
			 * @returns {boolean}
			 */
			function updateControlData(val)
			{
				// Run type conversions/checks
				if ( control_type === 'number' ) {
					// convert to number and check for NaN
					val = val / 1;
					if (isNaN(val)) throw new Error('Value must be a number');
				} else if ( control_type === 'string' && typeof val === 'number' )
					val = val + '';
				else if ( control_type === 'date' ) {
					if ( val !== null && !(val instanceof Date) ) {
						val = new Date(val);
						if ( isNaN(val.getTime()) ) throw new Error('Invalid Date');
					}
				}

				// If we've made it this far, check for user defined validator
				if ( typeof control_validator === 'function' )
					val = control_validator.call(Calculr.controls, val);
				if ( val !== false )
					control_data_obj[control_name] = val;

				return true;
			}

			var control = {
				autoupdater: control_autoupdater,
				/**
				 * @returns {*} - the control data value
				 */
				getValue: function() {
					return control_data_obj[control_name]
				},
				/**
				 * Setting control will not update dependents
				 */
				setValue: updateControlData
			};

			// If data is not already set OR existing data fails validation
			if ( !( control_data_obj.hasOwnProperty(control_name) && updateControlData(control_data_obj[control_name]) ) ) {
				// Set a default value
				var val;
				if ( control_default !== undefined ) {
					val = control_default;
				} else {
					switch ( control_type )
					{
						case 'number': val = 0; break;
						case 'string': val = ''; break;
						case 'boolean': val = true; break;
						case 'date': val = new Date(); break;
						default: val = 0; break;
					}
				}
				updateControlData(val);
			}

			if ( typeof control_autoupdater === 'function' ) {
				function defineDependenciesCb(req_str)
				{
					if ( Array.isArray(req_str) ) {
						$.each(req_str, function(i, req_str) {
							defineDependenciesCb(req_str);
						});
					} else if ( typeof req_str === 'string' ) {
						//todo: what if 'this.control_name'?
						//todo: what if 'list_name.control_name'?
						var dep_control_name = req_str;
						if ( !Calculr.controls.hasOwnProperty(dep_control_name) )
							Calculr.controls[dep_control_name] = {};
						if ( !Calculr.controls[dep_control_name].hasOwnProperty('dependencies') )
							Calculr.controls[dep_control_name].dependencies = [];
						if ( Calculr.controls[dep_control_name].dependencies.indexOf(control_name) === -1 )
							Calculr.controls[dep_control_name].dependencies.push(control_name);
					} else {
						throw new Error('Expecting string \'control_name\' or string Array.');
					}
				}
				control_autoupdater(defineDependenciesCb);
			}

			function collectDependenciesOf(control_name, controls_arr)
			{
				var tmp_controls_arr = [];
				$.each(Calculr.controls[control_name].dependencies, function(i, control_name) {
					if ( controls_arr.indexOf(control_name) === -1 ) {
						tmp_controls_arr.push(control_name);
						controls_arr.push(control_name);
					}
				});

				if ( tmp_controls_arr.length ) {
					$.each(tmp_controls_arr, function(i, control_name) {
						controls_arr = collectDependenciesOf(control_name, controls_arr);
					});
				}

				return controls_arr;
			}

			/**
			 * Update control data then update all control's dependents
			 */
			function updateControl(val)
			{
				if ( updateControlData(val) ) {
					// Get dependencies arr
					var collection = collectDependenciesOf(control_name, [control_name]);
					// remove control_name before running updaters
					collection.shift();

					$.each(collection, function(i, control_name) {
						if ( typeof Calculr.controls[control_name].autoupdater === 'function' ) {
							function getControlValCb(req_str)
							{
								var val;
								if ( Array.isArray(req_str) ) {
									$.each(req_str, function(i, req_str) {
										val += getControlValCb(req_str);
									});
								} else {
									val = Calculr.controls[req_str].getValue()
								}
								return val;
							}
							var val = Calculr.controls[control_name].autoupdater(getControlValCb);
							if ( val !== false ) {
								Calculr.controls[control_name].setValue(val);
							}
						} else throw new Error('Autoupdater cannot be found for control \''+control_name+'\'');
					});
					return true;
				}
				return false;
			}

			if ( !this.controls.hasOwnProperty(control_name) )
				this.controls[control_name] = {};
			control = this.controls[control_name] = Object.assign(this.controls[control_name], control);

			if ( control_is_tmp )
				tmp_controls[control_name] = control;

			Object.defineProperty(this.controller, control_name, {
				enumerable: true,
				get: function() {
					return control.getValue()
				},
				/**
				 * Assigning a value to controller will check if control_is_assignable,
				 * then update control (which updates dependencies) then fires finally_func)
				 * @param {*} val
				 */
				set: function(val) {
					if ( !control_is_assignable )
						throw new Error('Control \''+control_name+'\' cannot be directly assigned.');
					updateControl(val);
					finallyFunc();
				}
			});

			return this;
		},

		/**
		 *
		 * @param {function} callback
		 * @param {boolean} [cb_before]
		 * @returns {Calculr}
		 */
		init: function(callback, cb_before)
		{
			function init() {
//				// Initialize lists by loading each
//				$.each(Calculr.lists, function(list_name, list_item_name) {
//					$.each(Calculr.data_obj[list_name], function(index) {
//						Calculr.controller[list_item_name](index);
//					});
//				});
//				// Update init_controls
//				$.each(init_controls, function(i, control_name){
//					updateControl(control_name);
//				});
//				// Initiate foreign_controls
//				$.each(foreign_controls, function(foreign_key, options){
//					updateByForeignKey(foreign_key, options.class(Calculr.controller[foreign_key]), options.controls);
//				});
			}

			if ( !cb_before ) init();
			callback.call(this);
			if ( cb_before ) init();

			return this;
		}
	};

	if ( calc_options.controls )
		$.each(calc_options.controls, Calculr.addControl.bind(Calculr));

	return Calculr;
}
