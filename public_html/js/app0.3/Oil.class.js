function Oil(uid)
{

	var data_obj;

	var oil_calc = new Calculr({
		data_obj: function() {
			if ( uid !== undefined ) {
				data_obj = Data.get_table_row('oil', uid);
				if ( !data_obj )
					throw new Error('Oil(\''+uid+'\') does not exist');
			} else {
				data_obj = {};
				uid = create_uid(3, Data.get_table('oil'));
			}
			return data_obj;
		},
		controller: { // 'this' will always reference the controller, not Calculr_instance
			//todo: maybe add Calculr_instance as an optional argument
			save: function() {
				Data.update_table_row('oil', uid, data_obj);
				this.list();
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
		methods: { // 'this' will reference the Calculr instance, should not contain controls

		},
		controls: { // controller properties - will have setter and getter defined, fully validated and smart defaults set
			uid: {
				default: uid,
				set: false
			},
			name : {
				type: 'string'
			},
			koh_sap : {
				type: 'number',
				set : function(val) {
					return App.round(val, 4);
				},
				update: function(require) {
					return App.round(require('naoh_sap') * App.constants.koh_naoh_ratio, 4);
				}
			},
			naoh_sap : { // one of these should be tmp_data since it can be calculated from the other
				type: 'number',
				// is_tmp: true, //may be easier to list if this data stays in data_obj
				set: function(val) { // passed setter value, returns validated
					return App.round(val, 4);
				},
				update: function(require) { // returns value; will be called when dependency is itself updated
					return require('koh_sap') / App.constants.koh_naoh_ratio;
				}
			}
		},
		finally_func: function() { // called after all updates are finished; 'this' references Calculr_instance.controller
			this.save();
		}
	});

	oil_calc.controller.list();

	return oil_calc.controller;

}