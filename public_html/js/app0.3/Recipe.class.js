function Recipe(uid)
{
	var recipe_data = {},
		recipe_tmp_data = {};
	if ( uid !== undefined ) {
		recipe_data = Data.get_table_row('recipe', uid);
		if ( !recipe_data )
			throw new Error('Recipe(\''+uid+'\') does not exist');
	} else {
		uid = create_uid(3, Data.get_table('recipe'));
	}

	var recipe_calc = Calculr({
		data_obj: recipe_data,
		tmp_data_obj: recipe_tmp_data,
		static_data: {
			uid: uid,
			created_at: new Date(),
			updated_at: new Date(),
			deleted_at: null
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
			// for App, underscore prefix indicates control cannot be assigned, only updated (if update() given)
			_total_oils_percent: {
				is_tmp: true,
				set: false,
				update: function(require) {
					return require('oils.percent') //todo: count all oils percent
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
		controller: {
			save: function() {
				recipe_data.updated_at = new Date();
				Data.update_table_row('recipe', uid, recipe_data);
				this.list();
				return this;
			},
			copy: function() {
				uid = create_uid(3, Data.get_table('recipe'));
				recipe_data.uid = uid;
				recipe_data.name += ' (Copy)';
				recipe_data.created_at = new Date();
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
				UI.out_recipe(UI.toJSON(recipe_data));
				UI.out_recipe_tmp(UI.toJSON(recipe_tmp_data));
				return this;
			// },
			// oil: function(uid) {
			// 	return RecipeOil(uid, recipe_calc);
			}
		},
		lists: {
			oils: {
				control: 'oil',
				class: RecipeOil
			// },
			// liquids: {
			// 	liquid: RecipeLiquid
			// },
			// additives: {
			// 	additive: RecipeAdditive
			}
		},
		finally_func: function (controller) {
			controller.save();
		}
	}).init(function(controller){
		controller.list();
	});

	window.recipe = recipe_calc.controller;

	return recipe_calc.controller;
}