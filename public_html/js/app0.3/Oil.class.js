function Oil(uid)
{

	var data_obj = {};

	if ( uid !== undefined ) {
		data_obj = Data.get_table_row('oil', uid);
		if ( !data_obj ) {
			throw new Error('Oil(\''+uid+'\') does not exist');
		}
	} else {
		uid = create_uid(3, Data.get_table('oil'));
	}

	var oil_calc = Calculr({
		data_obj: data_obj,
		controller: { // 'this' will always reference the controller, not the Calculr instance
			save: function() {
				Data.update_table_row('oil', uid, data_obj);
				this.list();
				return this;
			},
			delete: function() {
				if ( confirm('Are you sure you want to delete this oil?') ) {
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
		finally_func: function() {
		}
	}).addControls({ // controller properties - will have setter and getter defined, fully validated and smart defaults set
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
			default: data_obj.koh_sap / App.constants.koh_naoh_ratio,
			set: function(val) { // passed setter value, returns validated
				return App.round(val, 4);
			},
			update: function(require) { // returns value; will be called when dependency is itself updated
				return require('koh_sap') / App.constants.koh_naoh_ratio;
			}
		}
	}).addFinally(function(){ // called after all updates are finished; 'this' references Calculr instance's controller
		console.log(data_obj);
		this.save();
	});

	oil_calc.controller.list();

	return oil_calc.controller;

}