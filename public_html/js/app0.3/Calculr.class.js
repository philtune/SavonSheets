function Calculr(args)
{
	/**
	 * Throw error if type mismatch
	 * @param {*} val - The variable to be checked
	 * @param {string} type - The type to be compared
	 * @param {boolean} [check_defined] - Should val also be defined?
	 */
	function typeCheck(val, type, check_defined) {
		var defined = ( check_defined ) ? ( val !== undefined ) : true;
		if ( !defined || typeof val !== type )
			throw new Error('Expecting '+type+', received '+(typeof val));
	}

	typeCheck(args, 'object', true);

	var data_obj = args.data_obj || {},
		finally_func;

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

	/* object to be returned */
	var Calculr_instance = {
		controller: args.controller || {},
		dependencies: args.dependencies || {},
		updaters: args.updaters || {},
		/**
		 * @param {function} func
		 * @returns {Calculr_instance}
		 */
		addFinally: function(func) {
			finally_func = func;
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

				var this_data_obj = getThisDataObj(control_options.data_obj);

				/* Set default if undefined */
				if ( control_options.default !== undefined )
					this_data_obj[control_name] = control_options.default;
				else if ( control_options.type !== undefined ) {
					typeCheck(control_options.type, 'string');
					if ( this_data_obj[control_name] === undefined )
						this_data_obj[control_name] = {'string':'','number':0}[control_options.type];
				} else if ( control_options.set === undefined )
					throw new Error('Control must have one of the following options defined: \'default\', \'type\' or \'set\'');

				/* Define updaters and dependencies */
				if ( control_options.update !== undefined && control_options.update !== false ) {

					if ( Calculr_instance.updaters.hasOwnProperty(control_name) )
						throw new Error(control_name+' already has updater defined');
					else
						Calculr_instance.updaters[control_name] = control_options.update;

					control_options.update.apply(Calculr_instance.controller, [function(key_str){
						if ( !Calculr_instance.dependencies.hasOwnProperty(key_str) )
							Calculr_instance.dependencies[key_str] = [];
						Calculr_instance.dependencies[key_str].push(control_name);
					}]);

				}

				// Define getter and setter for this control
				Object.defineProperty(Calculr_instance.controller, control_name, {
					get: function() {
						return this_data_obj[control_name];
					},
					set: function(val) {
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

						//todo: update dependants

						// Apply this function after all updates are completed
						if ( finally_func ) {
							typeCheck(finally_func, 'function');
							finally_func.apply(this, []);
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
