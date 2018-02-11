function Recipe(uid)
{
	var data_obj = {},
		tmp_data_obj = {};
	if ( uid !== undefined ) {
		data_obj = Data.get_table_row('oil', uid);
		if ( !data_obj )
			throw new Error('Oil(\''+uid+'\') does not exist');
	} else {
		uid = create_uid(3, Data.get_table('oil'));
	}

	var recipe_calc = Calculr({
		data_obj: data_obj,
		tmp_data_obj: tmp_data_obj,
		static_data: {
			uid: uid,
			created_at: new Date(),
			updated_at: new Date(),
			deleted_at: null
		},
		controller: {
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
				if ( Data.get_table_row('recipe', uid) && confirm('Are you sure you want to delete this recipe?') ) {
					Data.delete_table_row('recipe', uid);
				}
				UI.list_oils();
				UI.out_oil('');
				return {};
			},
			list: function() {
				UI.list_recipes();
				UI.out_recipe(UI.toJSON(data_obj));
				UI.out_recipe_tmp(UI.toJSON(tmp_data_obj));
				return this;
			}
		},
		controls: {
			name: 'string',
			note: 'string',
			percent_naoh: { default: 1 },
			lye_discount: {},
			liquid_lye_ratio: { default: 1 },
			lye_type: {
				set: function(val) {
					return (val < 0 || val > 2) ? 0 : val
				}
			},
			total_oils_weight: {
				update: function(require) {
					return require('oils.weight') //todo: count all oils weight
				}
			},
			// for App, underscore prefix indicates control cannot be set directly, only via update (if given)
			_total_oils_percent: {
				default: 1,
				is_tmp: true,
				set: false,
				update: function(require) {
					return require('oils.percent') // count all oils percent
				}
			},
			_total_liquids_weight: {
				is_tmp: true,
				set: false, //todo: maybe change to allow this control to update liquid_lye_ratio
				update: function(require) {
					return require([ //todo: arrays expect all to be added together
						'_total_naoh_weight',
						'_total_koh_weight'
					]) * require('liquid_lye_ratio')
				}
			},
			_total_additives_weight: {
				is_tmp: true,
				set: false,
				update: function(require) {
					return require('additives.weight') // count all additives weight
				}
			},
			_total_naoh_weight: {
				is_tmp: true,
				set: false,
				update: function(require) {
					return [1, 0, require('percent_naoh')][require('lye_type')]
						* require('oils._naoh_weight')
						* ( 1 - require('lye_discount') )
				}
			},
			_total_koh_weight: {
				is_tmp: true,
				set: false,
				update: function(require) {
					return [1, 0, require('percent_naoh')][require('lye_type')]
						* require('oils._naoh_weight')
						* ( 1 - require('lye_discount') )
				}
			},
			_total_liquids_parts: {
				is_tmp: true,
				set: false,
				update: function(require) {
					return require('liquids.parts');
				}
			},
			_total_recipe_weight: {
				is_tmp: true,
				set: false,
				update: function(require) {
					return require([ //todo: can this be calculated without temporary control values?
						'total_oils_weight',
						'_total_naoh_weight',
						'_total_koh_weight',
						'_total_liquids_weight',
						'_total_additives_weight'
					])
				}
			}
		},
		finally_func: function (controller) {
			controller.save();
		}
	}).init(function(controller){
		controller.list();
	});

	return recipe_calc.controller;
}