/**
 * @param {object} args
 * @returns {{data: {}, tmp_data: {}, controls: {}, controller: {}, init_controls: Array, addControl: addControl}}
 * @constructor
 */
function Calculr(args)
{

	function updateData(control_name, val)
	{
		var control = Calculr.controls[control_name];
		if ( typeof control.validater === 'function' ) {
			var result = control.validater(val);
			// Exit if validate() returns false
			if ( result === false ) return false;
			control.data[control_name] = result;
		} else { // If validate property is not defined...
			// and if type property === number
			if ( control.type === 'number' ) {
				// convert to number and check for NaN
				val = val / 1;
				if (isNaN(val)) throw new Error('Value must be a number');
			} else if ( control.type === 'string' && typeof val === 'number' )
				val = val + '';
			else typeCheck(val, control.type);
			// If we've made it this far, assign the value to our data
			control.data[control_name] = val;
		}
		return true;
	}

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


	//FIXME: for reference only, delete after needed
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

	var Calculr = {
		//todo: which of these properties/methods can probably be private?
		data: args.data || {},
		tmp_data: args.tmp_data || {},
		controls: {},
		controller: args.controller || {},
		init_controls: [],
		finally_func: args.finally_func || null,

		//todo: define getter and setter on Calculr.controller[control_name] to point to control.get()|set()

		/**
		 *
		 * @param {string} control_name
		 * @param {*} control_options
		 * @returns {Calculr}
		 */
		addControl: function(control_name, control_options) {
			//todo: use this for all controls, including foreign, etc.
			if ( typeof control_options === 'string' )
				control_options = { type: control_options };

			var control = {
				data: control_options.is_tmp ? Calculr.tmp_data : Calculr.data,
				type: control_options.type || 'number',
				updater: control_options.update || null,
				validater: control_options.validate || null,
				is_foreign: control_options.is_foreign || false,
				get: function() {
					return control.data[control_name];
				},
				set: function(val) {
					if ( control_options.assignable === false )
						throw new Error(control_name + ' is not assignable.');

					if ( updateData(control_name, val) ) {


						// todo: call updater on all dependent controls
						// - todo: build a list of controls to be updated
						// Get dependencies arr
						var tmp_controls = getControlsToBeUpdated([control_name], control_name);
						// remove control_name before running updaters
						tmp_controls.shift();

						$.each(tmp_controls, function(i, control_name) {
							updateControl(control_name);
						});



						Calculr.updateAllDependentControls(control_name);
						// Apply this function after all updates are completed
						if ( Calculr.finally_func ) {
							Calculr.finally_func.call(Calculr, Calculr.controller);
						}

					}
				}
			};

			if ( typeof control_options.update === 'function' ) {

			}

			//todo: add dependents property to control

			//todo: set default value for control.data[control_name]

			if ( !Calculr.controls.hasOwnProperty(control_name) )
				Calculr.controls[control_name] = {};

			control = Calculr.controls[control_name] = Object.assign(Calculr.controls[control_name], control);

			// Temporary controls will need to be initialized.
			if ( control_options.is_tmp )
				Calculr.init_controls.push(control);

			return this;
		}
	};

	if ( args.controls )
		$.each(args.controls, function(key, val) {
			Calculr.addControl.apply(Calculr, [key, val]);
		});

	return Calculr;
}