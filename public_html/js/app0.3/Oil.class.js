function Oil(uid)
{
	var data_obj = {};

	var oil_calc = new Calculr({
		data_obj: function() {
			if ( uid !== undefined ) {
				data_obj = Data.get_table_row('oil', uid);
				if ( !data_obj )
					throw new Error('Oil(\''+uid+'\') does not exist');
			} else {
				uid = create_uid(3, Data.get_table('oil'));
			}
			data_obj.uid = uid;
			data_obj.created_at = data_obj.created_at || new Date();
			data_obj.updated_at = data_obj.updated_at || new Date();
			data_obj.deleted_at = data_obj.deleted_at || null;
			return data_obj;
		},
		static_data: {//todo
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
		controls: { // controller properties - will have setter and getter defined, fully validated and smart defaults set
			name: {
				type: 'string'
			},
			koh_sap: {
				type: 'number',
				set : function(val) {
					return App.round(val, 4);
				},
				update: function(require) {
					return App.round(require('naoh_sap') * App.constants.koh_naoh_ratio, 4);
				}
			},
			naoh_sap: { // one of these should be tmp_data since it can be calculated from the other
				type: 'number',
				// is_tmp: true, //may be easier to list if this data stays in data_obj
				set: function(val) { // passed setter value, returns validated
					return App.round(val, 4);
				},
				update: function(require) { // returns value; will be called when dependency is itself updated
					return require('koh_sap') / App.constants.koh_naoh_ratio;
				}
			},
			tmp_naoh_sap: {
				type: 'number',
				is_tmp: true,
				update: function(require) {
					return require('naoh_sap') / 2;
				}
			},
			tmp_koh_sap: {
				type: 'number',
				is_tmp: true,
				update: function(require) {
					return require('tmp_naoh_sap') * 8;
				}
			}
		},
		finally_func: function(Calculr_instance) { // called after all updates are finished; 'this' references Calculr_instance.controller
			console.log(Calculr_instance.tmp_data_obj);
			this.save();
		}
	}).init(function(controller) {
		controller.list();
		console.log(this.tmp_data_obj);
	});

	return oil_calc.controller;

}
