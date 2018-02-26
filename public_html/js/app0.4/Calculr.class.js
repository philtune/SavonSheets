/**
 * @param {object} args
 * @returns {{data: {}, tmp_data: {}, controls: {}, controller: {}, init_controls: Array, addControl: addControl}}
 * @constructor
 */
function Calculr(args)
{
	/**
	 * Build a string array of all controls that need to be updated when a depended control is itself updated.
	 *
	 * @param {array} result_arr - running list of controls to be updated
	 * @param {string} control_name - current control
	 * @returns {string[]}
	 */
	function getControlsToBeUpdated(result_arr, control_name)
	{
		var tmp_child_dependencies = [];
		$.each(Calculr.controls[control_name].dependencies, function(i, control_name) {
			if ( result_arr.indexOf(control_name) === -1 ) {
				tmp_child_dependencies.push(control_name);
				result_arr.push(control_name);
			}
		});
		if ( tmp_child_dependencies.length ) {
			$.each(tmp_child_dependencies, function(i, control_name) {
				result_arr = getControlsToBeUpdated(result_arr, control_name);
			});
		}
		return result_arr;
	}

	/**
	 * Runs validation and assigns result to data object
	 *
	 * @param {string} control_name
	 * @param {*} val
	 * @returns {*|boolean} - validated value on success, false on failure
	 */
	function assignToControlData(control_name, val)
	{
		var control = Calculr.controls[control_name];

		// Run type conversions/checks
		if ( control.type === 'number' ) {
			// convert to number and check for NaN
			val = val / 1;
			if (isNaN(val)) throw new Error('Value must be a number');
		} else if ( control.type === 'string' && typeof val === 'number' )
			val = val + '';
		else typeCheck(val, control.type);

		// If we've made it this far, check for user defined validator
		if ( typeof control.validator === 'function' )
			val = control.validator.call(Calculr.controls, val);
		if ( val !== false )
			control.data[control_name] = val;

		return val;

	}

	function buildControlUpdaterDependencies(control)
	{
		if ( typeof control.autoupdater === 'function' ) {
			/**
			 * Define dependencies
			 *
			 * @param {*} dep_control_name - ex. 'control_name', 'list_name.control_name', ['control_name', 'control2_name']
			 * @callback
			 */
			function defineDependenciesCallback(dep_control_name) {
				function setDep(control_name) {
					if ( !Calculr.controls.hasOwnProperty(control_name) )
						Calculr.controls[control_name] = [];
					if ( !Calculr.controls[control_name].hasOwnProperty('dependencies') )
						Calculr.controls[control_name].dependencies = [];
					Calculr.controls[control_name].dependencies.push(control_name);
				}
				if ( Array.isArray(dep_control_name) ) {
					$.each(dep_control_name, function(i, control_name) {
						setDep(control_name);
					});
				} else setDep(dep_control_name);
			}

			control.autoupdater.call(Calculr.controller, defineDependenciesCallback);
		}
	}

	var Calculr = {
		//todo: which of these properties/methods can probably be private?
		data: args.data || {},
		tmp_data: args.tmp_data || {},
		controls: {},
		controller: args.controller || {},
		init_controls: [],
		finally_func: args.finally_func || null,

		//todo: define getter and setter on Calculr.controller[control_name] to point to control.getControl()|assignControl()

		/**
		 *
		 * @param {string} control_name
		 * @param {*} control_options
		 * @returns {Calculr}
		 */
		addControl: function(control_name, control_options)
		{
			if ( typeof control_options === 'string' )
				control_options = { type: control_options };

			var control = {
				data: control_options.is_tmp ? Calculr.tmp_data : Calculr.data,
				type: control_options.type || 'number',
				autoupdater: control_options.update || null,
				validator: control_options.validate || null,
				is_foreign: control_options.is_foreign || false,
				is_assignable: control_options.is_assignable || true,
				assignData: assignToControlData.bind(this),
				getControl: function() {
					return this.data[control_name];
				},
				assignControl: function(val) {
					if ( !this.is_assignable )
						throw new Error(control_name + ' is not assignable.');
					this.update(val);
					return this;
				},

				/**
				 *
				 * @param {string|number} val
				 * @returns {control}
				 */
				update: function(val) {
					val = this.assignData(control_name, val);
					if ( val ) {
						// todo: call autoupdater on all dependent controls
						// - todo: build a list of controls to be updated

//						// Get dependencies arr
//						var tmp_controls = getControlsToBeUpdated([control_name], control_name);
//						// remove control_name before running autoupdaters
//						tmp_controls.shift();
//
//						$.each(tmp_controls, function(i, control_name) {
//							updateControl(control_name);
//						});
//
//
//
//						Calculr.updateAllDependentControls(control_name);
//						// Apply this function after all updates are completed
//						if ( Calculr.finally_func ) {
//							Calculr.finally_func.call(Calculr, Calculr.controller);
//						}
					}
					return this;
				}
			};

			buildControlUpdaterDependencies(control);

			if ( control_options.foreign ) {

				if ( Array.isArray(control_options.foreign.controls) ) {
					//todo: if string Array, do this, else give customization options
					$.each(control_options.foreign.controls, function(i, control_name) {
						var control = {
							is_foreign: true,
							is_static: true,
							is_tmp: true,
							foreign_key: control_name,
							is_assignable: false
						};
						Calculr.addControl(control_name, control);
					});
				}

				var model = typeCheck(control_options.foreign.model, 'function');

				/**
				 * Update dependents w/ foreign data
				 * @param val
				 * @returns {control}
				 */
				control.update = function(val) {
					var instance = model(val);
					val = instance ? val : '';
					this.assignData(control_name, val);

					$.each(control_options.foreign.controls, function(i, control_name) {
						if ( !Calculr.controls.hasOwnProperty(control_name) )
							throw new Error('Nonexistent control \''+control_name+'\'');
						var control = Calculr.controls[control_name],
							val = instance ? instance[control.foreign_key] : 0;
						control.update(val);
					});

					return this;
				}
			}


			//todo: set default value for control.data[control_name]

			if ( !Calculr.controls.hasOwnProperty(control_name) )
				Calculr.controls[control_name] = {};

			control = Calculr.controls[control_name] = Object.assign(Calculr.controls[control_name], control);

			// Temporary controls will need to be initialized.
			if ( control_options.is_tmp )
				Calculr.init_controls.push([control_name, control]);

			return this;
		},

		/**
		 *
		 * @param {string} list_name
		 * @param {object} list_options
		 */
		addList: function(list_name, list_options)
		{
			var calc_options = Object.assign({
				data: this.data,
				tmp_data: this.tmp_data
			}, list_options);
			var list_calc = new window.Calculr(calc_options);
			window[list_name+'_list_calc'] = list_calc;
		}
	};

	if ( args.controls )
		$.each(args.controls, function(key, val) {
			Calculr.addControl.apply(Calculr, [key, val]);
		});

	if ( args.lists )
		$.each(args.lists, function(key, val) {
			Calculr.addList.apply(Calculr, [key, val]);
		});

	return Calculr;
}