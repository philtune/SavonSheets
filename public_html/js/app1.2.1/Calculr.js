/**
 *
 * @param {object} calc_options
 * @returns {Object}
 * @constructor
 */
function Calculr(calc_options)
{
	var Calculr = {
		data_obj: calc_options.data_obj, //todo: this could probably be removed from instance
		tmp_data_obj: calc_options.tmp_data_obj || {}, //todo: this could probably be removed from instance
		controls: {},
		tmp_controls: [],
		controller: calc_options.controller || {},
		parent: calc_options.parent_calc,
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

			var control = this.controls[control_name] = {
				autoupdater: control_options.update,
				dependencies: [],
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
				setValue: function(val)
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
			};

			// If data is not already set OR existing data fails validation
			if ( !( control_data_obj.hasOwnProperty(control_name) && control.setValue(control_data_obj[control_name]) ) ) {
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
				control.setValue(val);
			}

			// Add to tmp_controls (to be set when calculator calls .init())
			if ( control_options.is_tmp )
				this.tmp_controls.push(control_name);

			// Define a getter and setter for the globally accessible controller
			Object.defineProperty(this.controller, control_name, {
				enumerable: true,
				configurable: true, //todo: this is to make it deletable, may have unintended consequences
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
					if ( control_options.assignable === false )
						throw new Error('Control \''+control_name+'\' cannot be directly assigned.');

					// Attempt to update control data; IF successful...
					if ( control.setValue(val) ) {
						// Get dependencies arr
						var collection = findDependenciesOf(control_name, [control_name], Calculr);
						// remove control_name before running updaters
						collection.shift();
						// Update all control's dependents
						$.each(collection, function(i, control_name) {
							runAutoUpdater(control_name);
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
			if ( this.controls.hasOwnProperty(list_name) )
				throw new Error('List \''+list_name+'\' has already been defined.');

			// Add list to data_obj if !exists
			if ( !this.data_obj.hasOwnProperty(list_name) )
				this.data_obj[list_name] = {};
			this.tmp_data_obj[list_name] = {};

			// Create control for this list
			this.controls[list_name] = {};
//			var tmp_list_calc = list_options.class(Calculr);
//			$.each(tmp_list_calc.controls, function(control_name, control){
//				Calculr.controls[list_name][control_name] = control;
//				if ( control.autoupdater !== undefined ) {
//					control.autoupdater(function(control_name){
//						var namespaced = control_name.split('.');
//						if ( namespaced.length > 1 ) {
//							if ( namespaced[0] === 'parent' ) {
//								namespaced.shift();
//
//							}
//						}
//						console.log(control_name);
//					});
//				}
//			});

			var init = this.controller[list_options.control_name] = function(uid) {
				Calculr.controls[list_name][uid] = list_options.class(Calculr, uid);
				return Calculr.controls[list_name][uid].controller;
			};

			// Initialize each list item
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
				$.each(this.tmp_controls, function(i, control_name) {
					runAutoUpdater(control_name);
				});
			}

			if ( !cb_before ) init.call(this);
			callback.call(this);
			if ( cb_before ) init.call(this);

			return this;
		}
	};

	function findDependenciesOf(control_name, controls_arr, calc)
	{ // var collection = fundDependenciesOf('oils.weight', []);
		// IF namespaced, find target calculator and control_name
		var namespaced = control_name.split('.');
		if ( namespaced.length > 1 ) {
			//todo: get list_name and process...
		}

		var tmp_controls_arr = [];
		$.each(calc.controls[control_name].dependencies, function(i, control_name) {
			// IF control_name isn't already on the list, add it
			if ( controls_arr.indexOf(control_name) === -1 ) {
				tmp_controls_arr.push(control_name);
				controls_arr.push(control_name);
			}
		});

		if ( tmp_controls_arr.length ) {
			$.each(tmp_controls_arr, function(i, control_name) {
				controls_arr = findDependenciesOf(control_name, controls_arr, calc);
			});
		}

		return controls_arr;
	}

	function getControlValue(control_name, calc)
	{
		calc = calc || Calculr;

		// IF namespaced, find target calculator and control_name
		var namespaced = control_name.split('.');
		if ( namespaced.length > 1 ) {
			if ( namespaced[0] === 'parent' ) {
				if ( calc.parent === undefined )
					throw new Error('This calc instance does not have a parent instance defined.');
				namespaced.shift();
				return getControlValue(namespaced.join('.'), calc.parent);
			} else {
				//todo?
			}
		}

		return calc.controls[control_name].getValue();
	}

	function runAutoUpdater(control_name)
	{
		var control = Calculr.controls[control_name];
		if ( typeof control.autoupdater === 'function' ) {
			var val = control.autoupdater(function(control_name, record_dependency) {
				var result = 0;
				if ( Array.isArray(control_name) ) {
					$.each(control_name, function(i, control_name) {
						result += getControlValue(control_name)
					});
				} else
					result = getControlValue(control_name);
				return result;
			});
			if ( val !== false )
				control.setValue(val);
		}
	}

	/**
	 * @param {string} dep_control_name
	 * @param {string} child_control_name
	 * @throws Error if undefined parent
	 */
	function recordDependency(dep_control_name, child_control_name)
	{
		//todo: document
		var controls = Calculr.controls,
			namespaced = dep_control_name.split('.');
		if ( namespaced.length > 1 && namespaced[0] === 'parent' ) {
			if ( Calculr.parent === undefined )
				throw new Error('This Calculr instance does not have a parent instance defined.');
			controls = Calculr.parent.controls;
			dep_control_name = namespaced[1];
			child_control_name = calc_options.list_name + '.' + child_control_name;
		}

		if ( controls[dep_control_name].dependencies.indexOf(child_control_name) === -1 )
			controls[dep_control_name].dependencies.push(child_control_name);
	}

	if ( calc_options.controls ) {
		// Register control_names and define their properties
		$.each(calc_options.controls, Calculr.addControl.bind(Calculr));
		// Now record each control's dependencies using the autoupdater and a callback function
		$.each(Calculr.controls, function(control_name, control) {
			if ( typeof control.autoupdater === 'function' ) {
				control.autoupdater(function(dep_control_name, record_dependency) {
					if ( record_dependency !== 'false' ) {
						if ( Array.isArray(dep_control_name) )
							$.each(dep_control_name, function (i, dep_control_name) {
								recordDependency(dep_control_name, control_name);
							});
						else
							if ( typeof dep_control_name === 'string' )
								recordDependency(dep_control_name, control_name);
							else
								throw new Error('Expecting \'dep_control_name\' to be a string or string Array.');
					}
				});
			}
		});
	}

	if ( calc_options.lists )
		$.each(calc_options.lists, Calculr.addList.bind(Calculr));

	return Calculr;
}
