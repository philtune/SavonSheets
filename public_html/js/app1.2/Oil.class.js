/**
 *
 * @param {string} uid
 * @returns {controller}
 * @constructor
 */
function Oil(uid)
{
	var oil_data = {},
		oil_tmp_data = {};

	if ( uid !== undefined ) {
		oil_data = Data.get_table_row('oil', uid);
		if ( !oil_data )
			throw new Error('Oil(\''+uid+'\') does not exist');
	} else
		uid = create_uid(3, Data.get_table('oil'));

	function show_index()
	{
		UI.list_oils();
		UI.out_oil(UI.toJSON(oil_data));
	}

	function save()
	{
		oil_data.updated_at = new Date();
		Data.update_table_row('oil', uid, oil_data);
		show_index();
	}

	function duplicate() {
		uid = create_uid(3, Data.get_table('oil'));
		oil_data.uid = uid; //todo: get rid of uid as soon as possible; it is only used in UI.list_oils()
		oil_data.name += ' (Copy)';
		oil_data.created_at = new Date();
		save();
	}

	function destroy() {
		if ( Data.get_table_row('oil', uid) && confirm('Are you sure you want to delete this oil?') ) {
			Data.delete_table_row('oil', uid);
		}
		show_index();
		window.location.reload(); //fixme: find a better way to destroy controller
	}

	var oil_calc = Calculr({
		data_obj: oil_data,
		tmp_data_obj: oil_tmp_data,
		controller: {
			copy: duplicate,
			delete: destroy
		},
		controls: {
			uid: { //todo: get rid of uid as soon as possible; it is only used in UI.list_oils()
				type: 'string',
				default: uid,
				assignable: false
			},
			created_at: { //fixme: metadata probably not be needed for the calculator
				type: 'date',
				default: new Date(),
				assignable: false
			},
			updated_at: { //fixme: metadata probably not be needed for the calculator
				type: 'date',
				default: new Date(),
				assignable: false
			},
			deleted_at: { //fixme: metadata probably not be needed for the calculator
				type: 'date',
				default: null,
				assignable: false
			},
			name: 'string',
			koh_sap: {
				validate: function(val) {
					return App.round(val, 4);
				},
				update: function(require) {
					return App.round(require('naoh_sap') * App.constants.koh_naoh_ratio, 4);
				}
			},
			naoh_sap: {
				validate: function(val) {
					return App.round(val, 4);
				},
				update: function(require) {
					return require('koh_sap') / App.constants.koh_naoh_ratio;
				}
			}
		},
		finally: save
	}).init(show_index);

	window.oil_calc = oil_calc;

	return oil_calc.controller;
}