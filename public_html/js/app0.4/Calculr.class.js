/**
 *
 * @param {{}} args
 * @constructor
 */
function Calculr(args)
{
	var Calculr = {
		//todo: which of these properties/methods can probably be private?
		data: args.data || {},
		tmp_data: args.tmp_data || {},
		controls: {},
		controller: args.controller || {},
		init_controls: [],
		/**
		 *
		 * @param {string} key
		 * @param {string|object} val
		 * @returns {Calculr}
		 */
		addControl: function(key, val) {
			//todo: use this for foreign controls as well
			var control_name = key,
				control_options = val;
			if ( typeof val === 'string' )
				control_options = { type: val };

			if ( !Calculr.controls.hasOwnProperty(control_name) ) {
				Calculr.controls[control_name] = {};
			}
			var control = Calculr.controls[control_name] = Object.assign(Calculr.controls[control_name], {
				data: control_options.is_tmp ? Calculr.tmp_data : Calculr.data,
				type: control_options.type || 'number',
				updater: control_options.update || null,
				validater: control_options.validate || null,
				is_foreign: control_options.is_foreign || false
			});

			//todo: add dependents property to control

			//todo: might not actually need control_options.assignable if this is only list totals

			//todo: set default value for control.data[control_name]

			//todo: define getter and setter on Calculr.controller[control_name]

			// Temporary controls will need to be initialized.
			if ( control_options.is_tmp ) {
				Calculr.init_controls.push(control);
			}
			return this;
		}
	};

	if ( args.controls )
		$.each(args.controls, function(key, val) {
			Calculr.addControl.apply(Calculr, [key, val]);
		});

	return Calculr;
}