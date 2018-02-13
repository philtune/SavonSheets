/**
 * @param {object} args
 * @returns {{data_obj: *|{}, tmp_data_obj: {}, controller: {}, dependencies: {}, updaters: {}, assigners: {}, tmp_controls: Array, lists: Array, finally_func: null, addStaticData: addStaticData, addControl: addControl, addList: addList, init: init}}
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
	 * Build an update_list of all controls that need to be updated when a depended control is set
	 * @param {array} update_list - running list of controls to be updated
	 * @param {string} control_name - current control
	 * @returns {string[]}
	 */
	function controlsToBeUpdated(update_list, control_name)
	{
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

	/**
	 * @param {string} key - ex. 'control_name', 'parent.control_name'
	 * @returns {*} - the getter value of the control
	 */
	function getControlVal(key)
	{
		// check for namespace
		var namespaced = key.split('.');
		if ( namespaced.length > 1 ) {
			if ( namespaced[0] === 'parent' ) {
				//todo: find some way to recognize what control 'parent' refers to
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
		else {
			console.log(Calculr);
			throw new Error('Key \'' + key + '\' does not exist in controller.');
		}
	}

	/**
	 * Update a control value directly using its assigner instead of its setter (to avoid dependency updates)
	 * @param {string} control_name
	 */
	function updateControl(control_name)
	{
		if ( Calculr.updaters.hasOwnProperty(control_name) ) {
			var updater = Calculr.updaters[control_name];
			if ( updater !== undefined ) {
				/**
				 * @param {array|string} key - ex. 'control_name', 'parent.control_name', ['control_name', 'control2_name']
				 * @returns {number}
				 */
				function cb(key)
				{
					var result = 0;
					if ( Array.isArray(key) ) {
						$.each(key, function(i, key) {
							result += getControlVal(key);
						});
					} else {
						result = getControlVal(key);
					}
					return result;
				}
				var result = updater.call(Calculr.controller, cb);
				if ( result !== undefined && result !== false && !isNaN(result) )
					Calculr.assigners[control_name](result);
			}
		}
	}

	/**
	 * When control is set, update all controls that depend on this control
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
		lists: {},
		finally_func: finally_func,

		/**
		 * @param {object} controls_obj
		 * @returns {Calculr}
		 */
		addStaticData: function(controls_obj)
		{
			typeCheck(controls_obj, 'object');
			$.each(controls_obj, function(control_name, default_val){
				if ( Calculr.data_obj[control_name] === undefined )
					Calculr.data_obj[control_name] = default_val;
			});
			return this;
		},

		/**
		 * @param {string} control_name
		 * @param {object} control_options
		 * @returns {Calculr}
		 */
		addControl: function(control_name, control_options)
		{
			if ( typeof control_options === 'string' )
				control_options = { type: control_options };

			typeCheck(control_options, 'object');

			if ( control_options.type === undefined )
				control_options.type = 'number';

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
					} else if ( Calculr.assigners[control_name].call(Calculr, val) ) {
						updateAllDependencies(control_name);
						// Apply this function after all updates are completed
						if (Calculr.finally_func) {
							Calculr.finally_func.call(Calculr, Calculr.controller);
						}
					}
				}
			});
			return this;
		},

		/**
		 * @example
		 * Calculr.addList('oils', {control: 'oil', class: RecipeOil});
		 * @param {string} list_name
		 * @param {object} list_options
		 */
		addList: function(list_name, list_options)
		{
			if ( this.controller.hasOwnProperty(list_name) )
				throw new Error(list_name+' already exists.');

			if ( list_options.control !== undefined && list_options.class !== undefined ) {
				Calculr.data_obj[list_name] = Calculr.data_obj[list_name] || {};
				Calculr.tmp_data_obj[list_name] = {};
				Calculr.controller[list_name] = {};
				Calculr.controller[list_options.control] = function(index) {
					var listCalculr = list_options.class.call(Calculr, index);
					Calculr.controller[list_name][index] = listCalculr;
					return listCalculr;
				};
				Calculr.lists[list_name] = list_options.control;
				//todo: use list_options to front-load existing data?
			}
		},

		/**
		 * @param {function} func
		 * @param {boolean} [before_tmp_controls=false]
		 * @returns {Calculr}
		 */
		init: function(func, before_tmp_controls)
		{
			function init() {
				// Initialize lists by loading each
				$.each(Calculr.lists, function(list_name, list_item_name) {
					$.each(Calculr.data_obj[list_name], function(index) {
						console.log(index, list_item_name);
						Calculr.controller[list_item_name](index);
					});
				});
				// Update tmp_controls
				$.each(Calculr.tmp_controls, function(i, control_name){
					updateControl(control_name);
				});
			}
			if ( !before_tmp_controls ) init();
			func.apply(this, [this.controller]);
			if ( before_tmp_controls ) init();
			return this;
		}

	};

	/**
	 * Optionally, if properties are set in the passed args object,
	 * pass their values to the Calculr methods
	 */
	if ( args.static_data ) Calculr.addStaticData(args.static_data);
	if ( args.controls ) {
		typeCheck(args.controls, 'object');
		// Iterate through each set of control options
		$.each(args.controls, function (control_name, control_options) {
			Calculr.addControl(control_name, control_options);
		});
	}
	if ( args.lists ) {
		typeCheck(args.lists, 'object');
		$.each(args.lists, function(list_name, list_options) {
			Calculr.addList(list_name, list_options);
		});
	}

	window.Calculr_instance = Calculr;

	return Calculr;

}
