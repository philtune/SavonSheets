function Calculr(args)
{
	typeCheck(args, 'object', true);

	var data_obj = args.data_obj || {};

	if ( typeof data_obj === 'function' ) {
		var result = data_obj.apply(this, []);
		typeCheck(result, 'object');
		data_obj = result;
	}

	/**
	 * @param {object} new_obj
	 * @returns {object} - for current control
	 */
	function getThisDataObj(new_obj) {
		if ( new_obj ) {
			typeCheck(new_obj, 'object');
			return new_obj;
		} else return data_obj;
	}

	/**
	 * @param {array} update_list - running list of controls to be updated
	 * @param {string} control_name - current control
	 * @returns {array}
	 */
	function controlsToBeUpdated(update_list, control_name) {
		var child_dependencies = [];
		$.each(Calculr_instance.dependencies[control_name], function(i, control_name) {
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

	function callUpdater(control_name) {
		if ( Calculr_instance.updaters.hasOwnProperty(control_name) ) {
			var updater = Calculr_instance.updaters[control_name];
			var result = updater.call(Calculr_instance.controller, function (key_str) {
				return Calculr_instance.controller[key_str];
			});
			if ( result !== false )
				Calculr_instance.assigners[control_name](result);
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
			callUpdater(control_name);
		});

		// Apply this function after all updates are completed
		if ( Calculr_instance.finally_func ) {
			Calculr_instance.finally_func.call(Calculr_instance.controller);
		}
	}

	/* object to be returned */
	var Calculr_instance = {
		data_obj: data_obj || {},
		tmp_data_obj: {},
		controller: args.controller || {},
		dependencies: {},
		updaters: {},
		assigners: {},
		tmp_controls: args.tmp_controls || [],
		finally_func: null,
		/**
		 * @param {function} func
		 * @returns {Calculr_instance}
		 */
		addFinally: function(func) {
			typeCheck(func, 'function');
			this.finally_func = func;
			return this;
		},
		/**
		 * @param {object} controls_obj
		 * @returns {Calculr_instance}
		 */
		addControls: function(controls_obj) {
			typeCheck(controls_obj, 'object');
			// Iterate through each set of control options
			$.each(controls_obj, function (control_name, control_options) {
				typeCheck(control_options, 'object');

				var this_data_obj = control_options.is_tmp ? Calculr_instance.tmp_data_obj : Calculr_instance.data_obj;

				if ( control_options.is_tmp ) Calculr_instance.tmp_controls.push(control_name);

				if ( this_data_obj[control_name] === undefined || this_data_obj[control_name] === null ) {
					/* Set default if data property is undefined */
					if ( control_options.default !== undefined )
						this_data_obj[control_name] = control_options.default;
					else if ( control_options.type !== undefined ) {
						typeCheck(control_options.type, 'string');
						this_data_obj[control_name] = {'string':'','number':0}[control_options.type];
					} else if ( control_options.set === undefined )
						throw new Error('Control must have one of the following options defined: \'default\', \'type\' or \'set\'');
				}

				/* Define updaters and dependencies */
				if ( control_options.update !== undefined && control_options.update !== false ) {

					if ( Calculr_instance.updaters.hasOwnProperty(control_name) )
						throw new Error(control_name+' already has updater defined');
					else {
						typeCheck(control_options.update, 'function');
						Calculr_instance.updaters[control_name] = control_options.update;
					}

					control_options.update.call(Calculr_instance.controller, function(key_str){
						if ( !Calculr_instance.dependencies.hasOwnProperty(key_str) )
							Calculr_instance.dependencies[key_str] = [];
						Calculr_instance.dependencies[key_str].push(control_name);
					});
				}

				Calculr_instance.assigners[control_name] = function(val) {
					// Type-check supplied val
					if ( control_options.type )
						typeCheck(val, control_options.type);
					// If set property is defined...
					if ( control_options.set !== undefined ) {
						// and if control is allowed to be set
						if ( control_options.set !== false ) {
							// Type-check the 'set' property
							typeCheck(control_options.set, 'function');
							var result = control_options.set(val);
							// Exit if set() returns false
							if ( result === false ) return;
							this_data_obj[control_name] = result;
						} else {
							alert(control_name+' cannot be set');
							return;
						}
					} else { // If set property is not defined...
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
				};

				// Define getter and setter for this control
				Object.defineProperty(Calculr_instance.controller, control_name, {
					get: function() {
						return this_data_obj[control_name];
					},
					set: function(val) {

						Calculr_instance.assigners[control_name](val);

						updateAllDependencies(control_name);

						// Apply this function after all updates are completed
						if ( Calculr_instance.finally_func ) {
							Calculr_instance.finally_func.call(this);
						}
					},
					enumerable: true
				});
			});
			return this;
		}
	};

	/**
	 * Optionally, if properties are set in the passed args object,
	 * pass their values to the Calculr_instance methods
	 */
	if ( args.controls ) Calculr_instance.addControls(args.controls);
	if ( args.finally_func ) Calculr_instance.addFinally(args.finally_func);

	window.Calculr_instance = Calculr_instance;

	return Calculr_instance;

}
