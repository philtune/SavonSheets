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

	/**
	 * @param {string} control_name
	 */
	function updateControl(control_name) {
		if ( Calculr_instance.updaters.hasOwnProperty(control_name) ) {
			var updater = Calculr_instance.updaters[control_name];
			var result = updater.call(Calculr_instance.controller, function (key_str) {
				return Calculr_instance.controller[key_str];
			});
			if ( result !== false ) Calculr_instance.assigners[control_name](result);
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

	var Calculr_instance = {
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
				if ( Calculr_instance.data_obj[control_name] === undefined )
					Calculr_instance.data_obj[control_name] = default_val;
			});
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

				if ( typeof control_options === 'string' )
					control_options = { type: control_options };

				if ( control_options.type === undefined )
					control_options.type = 'number';

				typeCheck(control_options, 'object');

				var this_data_obj = control_options.is_tmp ? Calculr_instance.tmp_data_obj : Calculr_instance.data_obj;

				if ( control_options.is_tmp ) Calculr_instance.tmp_controls.push(control_name);

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

				if ( control_options.set !== undefined && control_options.set !== false )
					typeCheck(control_options.set, 'function');

				/**
				 * @param {string|number} val
				 * @returns {boolean} - true if successful, false on failure
				 */
				Calculr_instance.assigners[control_name] = function(val) {
					// If set property is defined...
					if ( control_options.set !== undefined ) {
						// and if control is allowed to be set
						if ( control_options.set !== false ) {
							var result = control_options.set(val);
							// Exit if set() returns false
							if ( result === false ) return false;
							this_data_obj[control_name] = result;
						} else {
							alert(control_name+' cannot be set');
							return false;
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
					return true;
				};

				// Define getter and setter for this control
				Object.defineProperty(Calculr_instance.controller, control_name, {
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
						if ( Calculr_instance.assigners[control_name](val) ) {
							updateAllDependencies(control_name);
							// Apply this function after all updates are completed
							if (Calculr_instance.finally_func) {
								Calculr_instance.finally_func.call(Calculr_instance, Calculr_instance.controller);
							}
						}
					}
				});
			});
			return this;
		},

		/**
		 * @param {function} func
		 * @param {boolean=false} before_tmp_controls
		 * @returns {Calculr_instance}
		 */
		init: function(func, before_tmp_controls) {
			typeCheck(func, 'function');
			typeCheck(before_tmp_controls, 'boolean');
			function updateTmpControls() {
				$.each(Calculr_instance.tmp_controls, function(i, control_name){
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
	 * pass their values to the Calculr_instance methods
	 */
	if ( args.static_data ) Calculr_instance.addStaticData(args.static_data);
	if ( args.controls ) Calculr_instance.addControls(args.controls);

	window.Calculr_instance = Calculr_instance;

	return Calculr_instance;

}
