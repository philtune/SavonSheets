function Oil(uid)
{
	var data_obj = {};
	if ( uid !== undefined ) {
		data_obj = Data.get_table_row('oil', uid);
		if ( !data_obj )
			throw new Error('Oil(\''+uid+'\') does not exist');
	} else {
		uid = create_uid(3, Data.get_table('oil'));
	}

	var oil_calc = new Calculr({
		data_obj: data_obj,
		static_data: {
			uid: uid,
			created_at: new Date(),
			updated_at: new Date(),
			deleted_at: null
		},
		controller: { // 'this' will always reference the controller, not Calculr_instance
			save: function() {
				data_obj.updated_at = new Date();
				Data.update_table_row('oil', uid, data_obj);
				this.list();
				return this;
			},
			copy: function() {
				uid = create_uid(3, Data.get_table('oil'));
				data_obj.uid = uid;
				data_obj.name += ' (Copy)';
				data_obj.created_at = new Date();
				this.save();
				return this;
			},
			delete: function() {
				if ( Data.get_table_row('oil', uid) && confirm('Are you sure you want to delete this oil?') ) {
					Data.delete_table_row('oil', uid);
				}
				UI.list_oils();
				UI.out_oil('');
				return {};
			},
			list: function() {
				UI.list_oils();
				UI.out_oil(UI.toJSON(data_obj));
				return this;
			}
		},
		controls: {
			name: 'string',
			koh_sap: {
				set : function(val) {
					return App.round(val, 4);
				},
				update: function(require) {
					return App.round(require('naoh_sap') * App.constants.koh_naoh_ratio, 4);
				}
			},
			naoh_sap: {
				set: function(val) {
					return App.round(val, 4);
				},
				update: function(require) {
					return require('koh_sap') / App.constants.koh_naoh_ratio;
				}
			}
		},
		finally_func: function(controller) {
			controller.save();
		}
	}).init(function(controller) {
		controller.list();
	});

	return oil_calc.controller;

}
