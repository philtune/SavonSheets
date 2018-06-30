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
		tmp_controls = [];

	var Calculr = {
		data_obj: data_obj, //todo: this could probably be removed from instance
		tmp_data_obj: tmp_data_obj, //todo: this could probably be removed from instance
		controls: {},
		controller: calc_options.controller || {},

		/**
		 *
		 * @param {string} control_name
		 * @param {object} control_options
		 * @returns {Calculr}
		 */
		addControl: function(control_name, control_options)
		{
			// If control_options is just a type string, set it to an object with defined type
			if ( typeof control_options === 'string' )
				control_options = { type: control_options.toString() };

			// Add to tmp_controls (to be set when calculator calls .init())
			if ( control_options.is_tmp )
				tmp_controls.push(control_name);

			var control = {
				data_obj: control_options.is_tmp ? tmp_data_obj : data_obj,
				type: control_options.type,
				default: (function(default_val){
					if ( control_options.default !== undefined ) {
						if ( typeof control_options.default !== ( control_options.type || 'number' ) && control_options.type !== 'date' )
							throw new Error('Default value for '+control_name+' must be a '+( control_options.type || 'number' ));
						default_val = control_options.default;
					} else {
						switch ( control_options.type || 'number' ) {
							case 'number': default_val = 0; break;
							case 'string': default_val = ''; break;
							case 'boolean': default_val = true; break;
							case 'date': default_val = new Date(); break;
							default: default_val = 0; break;
						}
					}
					return default_val;
				})(),
				is_assignable: control_options.assignable !== undefined ? control_options.assignable : true,
				validator: control_options.validate,
				autoupdater: control_options.update,
				dependencies: [],
				/**
				 * Type validates the value, then applies any custom validation before
				 * assigning the value to the data object. Setting control will not update dependents
				 * @param {*} val
				 * @returns {boolean} true if successful
				 * @throws Error if type mismatch
				 */
				setValue: function(val)
				{
					switch ( this.type || 'number' ) {
						case 'number':
							// convert to number and check for NaN
							val = val / 1;
							if (isNaN(val)) throw new Error('Value must evaluate to a number');
							break;
						case 'string':
							if ( typeof val === 'number' )
								val = val + '';
							else if ( typeof val !== 'string' )
								throw new Error('Value must evalutate to a string');
							break;
						case 'date':
							if ( val !== null && !(val instanceof Date) ) {
								val = new Date(val);
								if ( isNaN(val.getTime()) ) throw new Error('Invalid Date');
							}
							break;
						default:
							break;
					}

					// Once value is type validated, check for user defined validator
					if ( typeof this.validator === 'function' )
						val = this.validator.call(Calculr.controls, val);

					if ( val !== false )
						this.data_obj[control_name] = val;

					return true;
				}
			};

			Object.defineProperty(control, 'value', {
				enumerable: true,
				configurable: true,
				get: function() {
					return control.data_obj[control_name]
				},
				/**
				 * Type validates the value, then applies any custom validation before
				 * assigning the value to the data object. Setting control will not update dependents
				 * @param {*} val
				 * @throws Error if type mismatch
				 */
				set: function(val) {
					switch ( control.type || 'number' ) {
						case 'number':
							// convert to number and check for NaN
							val = val / 1;
							if (isNaN(val)) throw new Error('Value must evaluate to a number');
							break;
						case 'string':
							if ( typeof val === 'number' )
								val = val + '';
							else if ( typeof val !== 'string' )
								throw new Error('Value must evalutate to a string');
							break;
						case 'date':
							if ( val !== null && !(val instanceof Date) ) {
								val = new Date(val);
								if ( isNaN(val.getTime()) ) throw new Error('Invalid Date');
							}
							break;
						default:
							break;
					}

					// Once value is type validated, check for user defined validator
					if ( typeof control.validator === 'function' )
						val = control.validator.call(Calculr.controls, val);

					control.data_obj[control_name] = val;
				}
			});

			this.controls[control_name] = control;

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
			$.each(list_options.controls, function(control_name, control_options) {
				if ( control_options.countable )
					Calculr.addControl(list_name+'.'+control_name, control_options);
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

			/**
			 *
			 * @param {string} control_name
			 * @param {Object} [calc]
			 * @returns {*}
			 */
			function getControlValue(control_name, calc)
			{
				calc = calc || Calculr;

				// IF namespaced, find target calculator and control_name
				var namespaced = control_name.split('.');
				if ( namespaced.length > 1 ) {
					if ( namespaced[0] === 'parent' ) {
						namespaced.shift();
						return getControlValue(namespaced.join('.'), calc.parent);
					} else {
						//todo?
					}
				}

				return calc.controls[control_name].value;
			}

			/**
			 *
			 * @param {string} control_name
			 */
			function runAutoUpdater(control_name)
			{
				var control = Calculr.controls[control_name];
				if ( typeof control.autoupdater === 'function' ) {
					control.value = control.autoupdater(function(control_name) {
						var result = 0;
						if ( Array.isArray(control_name) ) {
							$.each(control_name, function(i, control_name) {
								result += getControlValue(control_name)
							});
						} else
							result = getControlValue(control_name);
						return result;
					});
				}
			}

			//fixme: this should actually create the control.dependencies list initially, so it doesn't have to get compiled every time
			/**
			 *
			 * @param {string} control_name
			 * @param {array} controls_arr
			 * @param {Object} calc
			 * @returns {*}
			 */
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

			function init() {
				// Initialize all controls
				$.each(this.controls, function(control_name, control) {
					// Record dependencies on init, so all controls have had time to be registered
					if ( typeof control.autoupdater === 'function' ) {
						control.autoupdater(function(dep_control_name, record_dependency) {
							if ( record_dependency !== 'false' ) {
								if ( Array.isArray(dep_control_name) )
									$.each(dep_control_name, function (i, dep_control_name) {
										recordDependency(dep_control_name, control_name);
									});
								else if ( typeof dep_control_name === 'string' )
									recordDependency(dep_control_name, control_name);
								else
									throw new Error('Expecting \'dep_control_name\' to be a string or string Array.');
							}
						});
					}

					// Set default control values or validate existing data
					control.value =
						control.data_obj.hasOwnProperty(control_name) ?
							control.data_obj[control_name] :
							control.default;

					// Define a getter and setter for the globally accessible controller
					Object.defineProperty(Calculr.controller, control_name, {
						enumerable: true,
						configurable: true, //todo: this is to make it deletable, may have unintended consequences
						get: function() {
							return control.value
						},
						/**
						 * Assigning a value to controller will check if control_is_assignable,
						 * then update control (which updates dependencies) then fires finally_func()
						 * @param {*} val
						 * @throws Error if control isn't assignable
						 */
						set: function(val) {
							if ( !control.is_assignable )
								throw new Error('Control \''+control_name+'\' cannot be directly assigned.');
							else {
								control.value = val;

								/* Update dependent controls */
								// Get dependencies arr
								var collection = findDependenciesOf(control_name, [control_name], Calculr);
								// Remove control_name before running updaters
								collection.shift();
								// Update all control's dependents
								$.each(collection, function(i, control_name) {
									runAutoUpdater(control_name);
								});

								if ( typeof calc_options.finally === 'function' )
									return calc_options.finally.call(this);
							}
						}
					});
				});

				// Initialize temporary control values after all data is available
				$.each(tmp_controls, function(i, control_name) {
					runAutoUpdater(control_name);
				});
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
