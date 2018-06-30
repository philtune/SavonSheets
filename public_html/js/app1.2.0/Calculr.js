/**
 *
 * @param {object} calc_options
 * @returns {Object}
 * @constructor
 */
function Calculr(calc_options)
{
	function getControlValCb(req_str)
	{
		var val = 0;
		if ( Array.isArray(req_str) ) {
			$.each(req_str, function(i, req_str) {
				val += Calculr.controls[req_str].getValue();
			});
		} else {
			val = Calculr.controls[req_str].getValue()
		}
		return val;
	}

	function runAutoUpdater(control)
	{
		if ( typeof control.autoupdater === 'function' ) {
			var val = control.autoupdater(getControlValCb);
			if ( val !== false )
				control.setData(val);
		}
	}

	var Calculr = {
		data_obj: calc_options.data_obj,
		tmp_data_obj: calc_options.tmp_data_obj || {},
		controls: {},
		tmp_controls: {},
		controller: calc_options.controller || {},
		finallyFunc: function()
		{
			if ( calc_options.finally !== undefined && typeof calc_options.finally === 'function' )
				return calc_options.finally.call(this);
			return false;
		},

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

			var control_type = control_options.type || 'number',
				control_data_obj = control_options.is_tmp ? this.tmp_data_obj : this.data_obj;

			// Define empty global control object if it doesn't exist yet.
			// (May already exist if a dependency was set by another control.)
			if ( !Calculr.controls.hasOwnProperty(control_name) )
				Calculr.controls[control_name] = {};
			// Merge locally defined control with global control
			var control = Calculr.controls[control_name] = Object.assign(Calculr.controls[control_name], {
				autoupdater: control_options.update,
				/**
				 * @returns {*} - the control data value
				 */
				getValue: function() {
					return control_data_obj[control_name]
				},
				/**
				 * Type validates the value, then applies any custom validation before
				 * assigning the value to the data object. Setting control will not update dependents
				 * @param {*} val
				 * @returns {boolean}
				 * @throws Error if type mismatch
				 */
				setData: function(val)
				{
					// Run type conversions/checks
					if ( control_type === 'number' ) {
						// convert to number and check for NaN
						val = val / 1;
						if (isNaN(val)) throw new Error(control_name + ' value must be a number');
					} else if ( control_type === 'string' && typeof val === 'number' )
						val = val + '';
					else if ( control_type === 'date' ) {
							if ( val !== null && !(val instanceof Date) ) {
								val = new Date(val);
								if ( isNaN(val.getTime()) ) throw new Error('Invalid Date');
							}
						}

					// If we've made it this far, check for user defined validator
					if ( typeof control_options.validate === 'function' )
						val = control_options.validate.call(Calculr.controls, val);
					if ( val !== false )
						control_data_obj[control_name] = val;

					return true;
				}
			});

			// If data is not already set OR existing data fails validation
			if ( !( control_data_obj.hasOwnProperty(control_name) && control.setData(control_data_obj[control_name]) ) ) {
				// Set a default value
				var val;
				if ( control_options.default !== undefined ) {
					val = control_options.default;
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
				control.setData(val);
			}

			// Record dependencies using the autoupdater and a callback function
			if ( typeof control_options.update === 'function' ) {
				/**
				 * @param {string} dep_control_name
				 */
				function recordDependency(dep_control_name)
				{
					//todo: what if 'this.control_name'?
					//todo: what if 'list_name.control_name'?
					if ( !Calculr.controls.hasOwnProperty(dep_control_name) )
						Calculr.controls[dep_control_name] = {};
					if ( !Calculr.controls[dep_control_name].hasOwnProperty('dependencies') )
						Calculr.controls[dep_control_name].dependencies = [];
					if ( Calculr.controls[dep_control_name].dependencies.indexOf(control_name) === -1 )
						Calculr.controls[dep_control_name].dependencies.push(control_name);
				}

				/**
				 * @param {string|string[]} req_str
				 * @throws Error if type mismatch
				 */
				function cb(req_str){
					if ( Array.isArray(req_str) )
						$.each(req_str, function(i, req_str) {
							recordDependency(req_str);
						});
					else if ( typeof req_str === 'string' )
						recordDependency(req_str);
					else
						throw new Error('Expecting \'dep_control_name\' to be a string or string Array.');
				}
				control_options.update(cb);
			}

			// Add to tmp_controls (to be set when calculator calls .init())
			if ( control_options.is_tmp )
				this.tmp_controls[control_name] = control;

			// Define a getter and setter for the globally accessible controller
			Object.defineProperty(this.controller, control_name, {
				enumerable: true,
				get: function() {
					return control.getValue()
				},
				/**
				 * Assigning a value to controller will check if control_is_assignable,
				 * then update control (which updates dependencies) then fires finally_func()
				 * @param {*} val
				 * @throws Error if control isn't assignable
				 */
				set: function(val) {
					// Continue only if control is assignable, else throw error.
					if ( control_options.assignable === false )
						throw new Error('Control \''+control_name+'\' cannot be directly assigned.');

					// Attempt to update control data; If successful...
					if ( control.setData(val) ) {
						function findDependenciesOf(control_name, controls_arr)
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
									controls_arr = findDependenciesOf(control_name, controls_arr);
								});
							}

							return controls_arr;
						}
						// Get dependencies arr
						var collection = findDependenciesOf(control_name, [control_name]);
						// remove control_name before running updaters
						collection.shift();
						// Update all control's dependents
						$.each(collection, function(i, control_name) {
							if ( typeof Calculr.controls[control_name].autoupdater === 'function' )
								runAutoUpdater(Calculr.controls[control_name]);
							else throw new Error('Autoupdater cannot be found for control \''+control_name+'\'');
						});

						Calculr.finallyFunc();
					}
				}
			});

			return this;
		},

		/**
		 *
		 * @param {string} list_name
		 * @param {object} list_options
		 * @returns {Calculr}
		 * @throws Error if list_name has already been defined
		 */
		addList: function(list_name, list_options)
		{
			if ( this.controller.hasOwnProperty(list_options.control_name) )
				throw new Error('List \''+list_options.control_name+'\' has already been defined.');

			if ( !this.data_obj.hasOwnProperty(list_name) )
				this.data_obj[list_name] = {};
			this.tmp_data_obj[list_name] = {};

			var init = this.controller[list_options.control_name] = function(uid) {
				return list_options.class(uid, Calculr.data_obj, Calculr.tmp_data_obj, Calculr.finallyFunc);
			};

			$.each(Object.keys(this.data_obj[list_name]), function(i, uid) {
				init(uid);
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
				//todo
				// Update init_controls
				//todo: tmp_controls could just be an array of control_names
				$.each(this.tmp_controls, function(control_name, control) {
					runAutoUpdater(control);
				});
//				$.each(init_controls, function(i, control_name){
//					updateControl(control_name);
//				});
				// Initiate foreign_controls
//				$.each(foreign_controls, function(foreign_key, options){
//					updateByForeignKey(foreign_key, options.class(Calculr.controller[foreign_key]), options.controls);
//				});
			}

			if ( !cb_before ) init.call(this);
			callback.call(this);
			if ( cb_before ) init.call(this);

			return this;
		}
	};

	if ( calc_options.controls )
		$.each(calc_options.controls, Calculr.addControl.bind(Calculr));

	if ( calc_options.lists )
		$.each(calc_options.lists, Calculr.addList.bind(Calculr));

	return Calculr;
}
