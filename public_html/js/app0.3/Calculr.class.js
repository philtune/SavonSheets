/**
 * @param {object} args
 * @returns {{data_obj: *|{}, tmp_data_obj: {}, controller: {}, dependencies: {}, updaters: {}, assigners: {}, lists: {}, finally_func: null, addForeignData: addForeignData, addControl: addControl, addStaticData: addStaticData, addList: addList, init: init}}
 * @constructor
 */
function Calculr(args)
{
	typeCheck(args, 'object', true);

	var data_obj = args.data_obj || {},
		tmp_data_obj = args.tmp_data_obj || {},
		controller = args.controller || {},
		finally_func = args.finally_func || null;

	if ( typeof data_obj === 'function' ) {
		var result = data_obj.apply(this, []);
		typeCheck(result, 'object');
		data_obj = result;
	}

	/**
	 * Build an update_list of all controls that need to be updated when a depended control is itself updated.
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
		else
			throw new Error('Key \'' + key + '\' does not exist in controller.');
	}

	/**
	 * Performs all the validation, should only be called within Calculr instance
	 *
	 * @param {string} control_name
	 * @param {*} val
	 * @returns {boolean} - true if successful, false on failure
	 */
	function assignControl(control_name, val)
	{
		var this_data_obj = Calculr.controls[control_name].this_data_obj,
			control_options = Calculr.controls[control_name].control_options;
		// If validate property is defined...
		if ( control_options.validate !== undefined ) {
			typeCheck(control_options.validate, 'function');
			var result = control_options.validate(val);
			// Exit if validate() returns false
			if ( result === false ) return false;
			this_data_obj[control_name] = result;
		} else { // If validate property is not defined or false...
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
					assignControl(control_name, result);
//					Calculr.assigners[control_name](result);
			}
		}
	}

	/**
	 * When control is updated, update all controls that depend on this control
	 * @param {string} control_name
	 */
	function updateAllDependentControls(control_name) {
		// Get dependencies arr
		var update_list = controlsToBeUpdated([control_name], control_name);
		// remove control_name before running updaters
		update_list.shift();

		$.each(update_list, function(i, control_name) {
			updateControl(control_name);
		});
	}

	/**
	 *
	 * @param {string} control_name
	 * @param {object} control_options
	 * @param {object} this_data_obj
	 * @returns {*}
	 */
	function defineControl(control_name, control_options, this_data_obj)
	{
		// Assign default value to this_data_obj
		if ( this_data_obj[control_name] === undefined || this_data_obj[control_name] === null ) {
			/* Assign default if data property is undefined */
			if ( control_options.default !== undefined )
				this_data_obj[control_name] = control_options.default;
			else {
				if ( control_options.type === undefined )
					control_options.type = 'number';
				this_data_obj[control_name] = {'string':'','number':0}[control_options.type];
			}
		}

		Calculr.controls[control_name] = {
			this_data_obj: this_data_obj,
			control_options: control_options
		};

		return control_options;
	}

	function addToUpdatersAndDependencies(control_name, control_options)
	{
		if ( control_options.update ) {
			// Define updaters
			if ( Calculr.updaters.hasOwnProperty(control_name) )
				throw new Error(control_name+' already has updater defined');
			else {
				typeCheck(control_options.update, 'function');
				Calculr.updaters[control_name] = control_options.update;
			}
			// Define dependencies
			/**
			 * @param {string} key - ex. 'control_name', 'parent.control_name', ['control_name', 'control2_name']
			 */
			function cb(key) {
				function setDep(key) {
					if ( !Calculr.dependencies.hasOwnProperty(key) )
						Calculr.dependencies[key] = [];
					Calculr.dependencies[key].push(control_name);
				}
				if ( Array.isArray(key) ) {
					$.each(key, function(i, key) {
						setDep(key);
					});
				} else setDep(key);
			}
			control_options.update.call(Calculr.controller, cb);
		}
	}

	/**
	 *
	 * @param {string} foreign_key
	 * @param {object} foreign_controller
	 * @param {object} controls
	 */
	function updateByForeignKey(foreign_key, foreign_controller, controls)
	{
		if ( foreign_controller ) {
			updateAllDependentControls(foreign_key);
			$.each(controls, function(control_name) {
				var val = foreign_controller[control_name];
				assignControl(control_name, val);
				updateAllDependentControls(control_name);
			});
		}
	}

	var init_controls = [],
		foreign_controls = {};

	var Calculr = {
		//todo go-live: which of these properties/methods can probably be private?
		data_obj: data_obj,
		tmp_data_obj: tmp_data_obj,
		controller: controller,
		controls: {},
		dependencies: {},
		updaters: {},
		lists: {},
		finally_func: finally_func,

		/**
		 * @param {string} foreign_key
		 * @param {object} options
		 * @returns {Calculr}
		 */
		addForeignData: function(foreign_key, options)
		{
			var this_data_obj = options.is_tmp ? Calculr.tmp_data_obj : Calculr.data_obj;

			defineControl(foreign_key, options, this_data_obj);

			Object.defineProperty(Calculr.controller, foreign_key, {
				enumerable: true,
				/**
				 * @returns {string|number}
				 */
				get: function() {
					return this_data_obj[foreign_key];
				},
				/**
				 * @param {string|number} val
				 */
				set: function(val) {
					if ( assignControl(foreign_key, val) ) {
						updateByForeignKey(foreign_key, options.class(val), options.controls);
						// Apply this function after all updates are completed
						if ( Calculr.finally_func ) {
							Calculr.finally_func.call(Calculr, Calculr.controller);
						}
					}
				}
			});

			foreign_controls[foreign_key] = options;

			$.each(options.controls, function(control_name, control_options) {
				var this_data_obj = control_options.is_tmp ? Calculr.tmp_data_obj : Calculr.data_obj;

				defineControl(control_name, control_options, this_data_obj);

				Object.defineProperty(Calculr.controller, control_name, {
					enumerable: true,
					get: function() {
						return this_data_obj[control_name];
					},
					set: function() {
						alert(control_name+' is not assignable.');
						return false;
					}
				})
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

			var this_data_obj = control_options.is_tmp ? Calculr.tmp_data_obj : Calculr.data_obj;

			// Add to init_controls
			if ( control_options.is_tmp ) init_controls.push(control_name);

			defineControl(control_name, control_options, this_data_obj);

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
					if ( control_options.assignable === false ) {
						alert(control_name+' is not assignable.');
						return false;
					} else {
						if ( assignControl(control_name, val) ) {
//						if ( Calculr.assigners[control_name](val) ) {
							updateAllDependentControls(control_name);
							// Apply this function after all updates are completed
							if (Calculr.finally_func) {
								Calculr.finally_func.call(Calculr, Calculr.controller);
							}
						}
					}
				}
			});

			addToUpdatersAndDependencies(control_name, control_options);

			return this;
		},

		/**
		 * Static data is recorded privately but is not added to the controller, so no setter, getter or update().
		 * @param {string} control_name
		 * @param {*} input
		 * @returns {Calculr}
		 */
		addStaticData: function(control_name, input)
		{
			var default_val = input,
				this_data_obj = Calculr.data_obj;
			if ( typeof input === 'object' && input !== null && !Array.isArray(input) ) {
				if ( input.is_tmp ) this_data_obj = Calculr.tmp_data_obj;
				default_val = input.default;
			}
			if ( this_data_obj[control_name] === undefined )
				this_data_obj[control_name] = default_val;

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
			if ( Calculr.controller.hasOwnProperty(list_name) )
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
			}
			//todo: build this out some more; maybe hold dependencies for entire list (so individual list items don't need to hold them)
		},

		/**
		 * @param {function} func
		 * @param {boolean} [before_init_controls=false]
		 * @returns {Calculr}
		 */
		init: function(func, before_init_controls)
		{
			function init() {
				// Initialize lists by loading each
				$.each(Calculr.lists, function(list_name, list_item_name) {
					$.each(Calculr.data_obj[list_name], function(index) {
						Calculr.controller[list_item_name](index);
					});
				});
				// Update init_controls
				$.each(init_controls, function(i, control_name){
					updateControl(control_name);
				});
				// Initiate foreign_controls
				$.each(foreign_controls, function(foreign_key, options){
					updateByForeignKey(foreign_key, options.class(Calculr.controller[foreign_key]), options.controls);
				});
			}
			if ( !before_init_controls ) init();
			func.apply(this, [this.controller]);
			if ( before_init_controls ) init();
			return this;
		}

	};

	/**
	 * Optionally, if properties are defined in the passed args object,
	 * pass their values to the Calculr methods
	 */
	if ( args.static_data ) {
		typeCheck(args.static_data, 'object');
		$.each(args.static_data, Calculr.addStaticData);
	}
	if ( args.controls ) {
		typeCheck(args.controls, 'object');
		// Iterate through each group of control options
		$.each(args.controls, Calculr.addControl);
	}
	if ( args.lists ) {
		typeCheck(args.lists, 'object');
		$.each(args.lists, Calculr.addList);
	}
	if ( args.foreign_data ) {
		typeCheck(args.foreign_data, 'object');
		$.each(args.foreign_data, Calculr.addForeignData);
	}

	window.Calculr_instance = Calculr;

	return Calculr;

}
