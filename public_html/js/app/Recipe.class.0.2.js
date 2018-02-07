function Recipe(uid)
{
	var data = {},
		tmp_data = {
			oils: {},
			liquids: {},
			additives: {}
		};
	if ( uid !== undefined ) {
		if ( typeof uid !== 'string' ) throw new Error('Argument passed to Recipe() must be a string representing the uid');
		data = Data.get_table_row('recipe', uid);
		if ( data === null ) throw new Error('Recipe(\'' + uid + '\') does not exist');
	}

	return window.recipe = Calculator({
		data: data,
		tmp_data: tmp_data,
		methods: {
			show: function () {
				UI.list_recipes();
				UI.out_recipe(UI.toJSON(data));
				UI.out_recipe_tmp(UI.toJSON(tmp_data));
				return this;
			},
			save: function () {
				data.updated_at = new Date();
				Data.update_table_row('recipe', this.uid, data);
				this.show();
				return this;
			},
			copy: function () {
				uid = create_uid(3, Data.get_table('recipe'));
				data.uid = uid;
				data.name += ' (Copy)';
				data.created_at = new Date();
				this.save();
				return this;
			},
			new: function () {
				uid = create_uid(3, Data.get_table('recipe'));
				data = {
					uid: uid,
					created_at: new Date()
				};
				this.save();
				return this;
			},
			delete: function () {
				if (confirm('Are you sure you want to delete this recipe?'))
					Data.delete_table_row('recipe', data.uid);
				this.show();
				delete this;
				return window.recipe = {};
			},
			oils: function (oil_uid) {
				var recipe_instance = this;
				return RecipeOil(recipe_instance, oil_uid, data, tmp_data);
			},
			liquids: function (liquid_uid) {
				var recipe_instance = this;
				return RecipeLiquid(recipe_instance, liquid_uid, data, tmp_data);
			},
			additives: function (additive_uid) {
				var recipe_instance = this;
				/* todo: return RecipeAdditive(recipe_instance, additive_uid, data, tmp_data); */
			}
		},
		props: {
			uid: {is_string: true},
			name: {is_string: true},
			note: {is_string: true},
			percent_naoh: {default: 1},
			lye_discount: {},
			liquid_lye_ratio: {default: 1},
			lye_type: {
				set: function (val) {
					return (val < 0 || val > 2) ? 0 : val
				}
			},
			total_oils_weight: {
				update: function (require) {
					return require('oils.weight')
				}
			},
			_total_liquids_weight: {
				is_tmp: true,
				set: false,
				update: function (require) {
					return require(['_total_naoh_weight', '_total_koh_weight']) * require('liquid_lye_ratio')
				}
			},
			_total_additives_weight: {
				is_tmp: true,
				set: false,
				update: function (require) {
					return require('additives.weight')
				}
			},
			_total_oils_percent: {
				default: 1,
				is_tmp: true,
				set: false,
				update: function (require) {
					return require('oils.percent')
				}
			},
			_total_naoh_weight: {
				is_tmp: true,
				set: false,
				update: function (require) {
					return [1, 0, require('percent_naoh')][require('lye_type')] * require('oils._naoh_weight') * (1 - require('lye_discount'))
				}
			},
			_total_koh_weight: {
				is_tmp: true,
				set: false,
				update: function (require) {
					return [0, 1, 1 - require('percent_naoh')][require('lye_type')] * require('oils._koh_weight') * (1 - require('lye_discount'))
				}
			},
			_total_liquids_parts: {
				is_tmp: true,
				set: false,
				update: function (require) {
					return require('liquids.parts')
				}
			},
			total_recipe_weight: {
				is_tmp: true,
				set: false, //todo
				update: function (require) {
					return require([
						'total_oils_weight',
						'_total_naoh_weight',
						'_total_koh_weight',
						'_total_liquids_weight',
						'_total_additives_weight'
					]);
				}
			}
		},
		after_update: function() {
			this.save()
		},
		init: function() {
			var recipe_instance = this;
			// Build up tmp_data for UI.out_recipe_tmp
			$.each(data.oils, function(key) {
				recipe_instance.oils(key);
			});
			data.oils = app.fixObjOrder(data.oils);
			$.each(data.liquids, function(key) {
				recipe_instance.liquids(key);
			});
			data.liquids = app.fixObjOrder(data.liquids);
			// todo:
			// $.each(data.additives, function(key) {
			// 	recipe_instance.additive(key);
			// });
			// data.additives = app.fixObjOrder(data.additives);

			recipe_instance.show();
		}
	});
}
