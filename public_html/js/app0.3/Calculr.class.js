/**
 * @param {object} args
 * @returns {{data_obj: {}, tmp_data_obj: {}, controller: {}, dependencies: {}, updaters: {}, assigners: {}, tmp_controls: Array, finally_func: null, addStaticData: addStaticData, addControls: addControls, init: init}}
 * @constructor
 */
function Calculr(args)
{
	typeCheck(args, 'object', true);

	var data_obj = args.data_obj || {},
		tmp_data_obj = args.tmp_data_obj || {},
		controller = args.controller || {},
		tmp_controls = args.tmp_controls || [],
		finally_func = args.finally_func || null;

	if ( typeof data_obj === 'function' ) {
		var result = data_obj.apply(this, []);
		typeCheck(result, 'object');
		data_obj = result;
	}

	/**
	 * @param {array} update_list - running list of controls to be updated
	 * @param {string} control_name - current control
	 * @returns {array}
	 */
	function controlsToBeUpdated(update_list, control_name) {
		var child_dependencies = [];
		$.each(Calculr.dependencies[control_name], function(i, control_name) {
			if ( update_list.indexOf(control_name) === -1 ) {
				child_dependencies.push(control_name);
				update_list.push(control_name);
			}
		});
		if ( child_dependencies.length ) {
			$.each(child_dependencies, function(i, control_name) {
				update_list = controlsToBeUpdated(update_list, control_name);
			});
		}
		return update_list;
	}

	function getControlVal(key) {
		// check for namespace
		var namespaced = key.split('.');
		if ( namespaced.length > 1 ) {
			if ( namespaced[0] === 'this' ) {
				//todo: find some way to recognize what control 'this' refers to
			} else if ( Calculr.controller.hasOwnProperty(namespaced[0]) ) {
				var result = 0;
				$.each(Calculr.controller[namespaced[0]], function(list_key, list_data) {
					if ( list_data.hasOwnProperty(namespaced[1]) )
						result += list_data[namespaced[1]];
				});
				return result;
			}
		} else if ( Calculr.controller.hasOwnProperty(key) )
			return Calculr.controller[key];
		else
			throw new Error('Key \''+key+'\' does not exist in controller.');

	}

	/**
	 * @param {string} control_name
	 */
	function updateControl(control_name) {
		if ( Calculr.updaters.hasOwnProperty(control_name) ) {
			var updater = Calculr.updaters[control_name];
			if ( updater !== undefined ) {
				var result = updater.call(Calculr.controller, function (key) {
					var result = 0;
					if ( Array.isArray(key) ) {
						$.each(key, function(i, key) {
							result += getControlVal(key);
						});
					} else {
						result = getControlVal(key);
					}
					return result;
				});
				if ( result !== undefined && result !== false && !isNaN(result) )
					Calculr.assigners[control_name](result);
			}
		}
	}

	/**
	 * @param {string} control_name
	 */
	function updateAllDependencies(control_name) {
		// Get dependencies arr
		var update_list = controlsToBeUpdated([control_name], control_name);
		// remove control_name before running updaters
		update_list.shift();

		$.each(update_list, function(i, control_name) {
			updateControl(control_name);
		});
	}

	var Calculr = {
		data_obj: data_obj,
		tmp_data_obj: tmp_data_obj,
		controller: controller,
		dependencies: {},
		updaters: {},
		assigners: {},
		tmp_controls: tmp_controls,
		finally_func: finally_func,

		/**
		 * @param {object} controls_obj
		 */
		addStaticData: function(controls_obj) {
			typeCheck(controls_obj, 'object');
			$.each(controls_obj, function(control_name, default_val){
				if ( Calculr.data_obj[control_name] === undefined )
					Calculr.data_obj[control_name] = default_val;
			});
			return this;
		},

		/**
		 * @param {object} controls_obj
		 * @returns {Calculr}
		 */
		addControls: function(controls_obj) {
			typeCheck(controls_obj, 'object');
			// Iterate through each set of control options
			$.each(controls_obj, function (control_name, control_options) {

				if ( typeof control_options === 'string' )
					control_options = { type: control_options };

				if ( control_options.type === undefined )
					control_options.type = 'number';

				typeCheck(control_options, 'object');

				var this_data_obj = control_options.is_tmp ? Calculr.tmp_data_obj : Calculr.data_obj;

				if ( control_options.is_tmp ) Calculr.tmp_controls.push(control_name);

				if ( this_data_obj[control_name] === undefined || this_data_obj[control_name] === null ) {
					/* Set default if data property is undefined */
					if ( control_options.default !== undefined )
						this_data_obj[control_name] = control_options.default;
					else {
						typeCheck(control_options.type, 'string');
						this_data_obj[control_name] = {'string':'','number':0}[control_options.type];
					}
				}

				/* Define updaters and dependencies */
				if ( control_options.update !== undefined && control_options.update !== false ) {

					if ( Calculr.updaters.hasOwnProperty(control_name) )
						throw new Error(control_name+' already has updater defined');
					else {
						typeCheck(control_options.update, 'function');
						Calculr.updaters[control_name] = control_options.update;
					}

					control_options.update.call(Calculr.controller, function(key_str){
						if ( !Calculr.dependencies.hasOwnProperty(key_str) )
							Calculr.dependencies[key_str] = [];
						Calculr.dependencies[key_str].push(control_name);
					});
				}

				if ( control_options.set !== undefined && control_options.set !== false )
					typeCheck(control_options.set, 'function');

				/**
				 * @param {string|number} val
				 * @returns {boolean} - true if successful, false on failure
				 */
				Calculr.assigners[control_name] = function(val) {
					// If set property is defined...
					if ( control_options.set !== undefined && typeof control_options.set === 'function' ) {
						var result = control_options.set(val);
						// Exit if set() returns false
						if ( result === false ) return false;
						this_data_obj[control_name] = result;
					} else { // If set property is not defined or false...
						// and if type property === number
						if ( control_options.type ) {
							if ( control_options.type === 'number' ) {
								// convert to number and check for NaN
								val = val / 1;
								if (isNaN(val)) throw new Error('Value must be a number');
							} else if ( control_options.type === 'string' && typeof val === 'number' )
								val = val + '';
							else typeCheck(val, control_options.type);
						}
						// If we've made it this far, assign the value to our data
						this_data_obj[control_name] = val;
					}
					return true;
				};

				// Define getter and setter for this control
				Object.defineProperty(Calculr.controller, control_name, {
					enumerable: true,
					/**
					 * @returns {string|number}
					 */
					get: function() {
						return this_data_obj[control_name];
					},
					/**
					 * @param {string|number} val
					 */
					set: function(val) {
						if ( control_options.set === false ) {
							alert(control_name+' cannot be set');
							return false;
						} else if ( Calculr.assigners[control_name](val) ) {
							updateAllDependencies(control_name);
							// Apply this function after all updates are completed
							if (Calculr.finally_func) {
								Calculr.finally_func.call(Calculr, Calculr.controller);
							}
						}
					}
				});
			});
			return this;
		},

		addList: function(list_name, list_options)
		{
			if ( !this.controller.hasOwnProperty(list_name) ) {
				this.data_obj[list_name] = this.data_obj[list_name] || {};
				this.controller[list_name] = {};
			} else {
				throw new Error(list_name+' already exists.');
			}
		},

		/**
		 * @param {function} func
		 * @param {boolean=false} before_tmp_controls
		 * @returns {Calculr}
		 */
		init: function(func, before_tmp_controls) {
			function updateTmpControls() {
				$.each(Calculr.tmp_controls, function(i, control_name){
					updateControl(control_name);
				});
			}
			if ( !before_tmp_controls ) updateTmpControls();
			func.apply(this, [this.controller]);
			if ( before_tmp_controls ) updateTmpControls();
			return this;
		}

	};

	/**
	 * Optionally, if properties are set in the passed args object,
	 * pass their values to the Calculr methods
	 */
	if ( args.static_data ) Calculr.addStaticData(args.static_data);
	if ( args.controls ) Calculr.addControls(args.controls);
	if ( args.lists ) {
		typeCheck(args.lists, 'object');
		$.each(args.lists, function(list_name, list_options) {
			Calculr.addList(list_name, list_options);
		});
	}

	window.Calculr_instance = Calculr;

	return Calculr;

}
