/*
 var recipe = new Recipe();
 var recipe_oil = new recipe.Oil();
 recipe_oil.oil_id = 'foo';
 recipe_oil.weight = 20;
 recipe['oils.weight'] = 50;
 */

function Recipe(uid)
{
	var recipe_data = {},
		recipe_tmp_data = {};
	if ( uid !== undefined ) {
		recipe_data = Data.get_table_row('recipe', uid);
		if ( recipe_data === null ) {
			throw new Error('Recipe(\'' + uid + '\') does not exist');
		}
	} else {
		uid = create_uid(3, Data.get_table('recipe'));
	}

	var recipe_calc = new Calculr({
		data: recipe_data,
		tmp_data: recipe_tmp_data,
		controls: {
			name: 'string',
			note: 'string',
			percent_naoh: { default: 1 },
			lye_discount: {},
			liquid_lye_ratio: { default: 1 },
			lye_type: {
				validate: function(val) {
					return (val < 0 || val > 2) ? 0 : val
				}
			},
			created_at: {
				is_static: true,
				default: new Date()
			},
			updated_at: {
				is_static: true,
				default: new Date()
			},
			deleted_at: {
				is_static: true,
				default: null
			}
		},
		lists: {
			oils: {
				controls: {
					oil_id: {
						type: 'string',
						foreign: {
							model: Oil,
							controls: ['koh_sap', 'naoh_sap']
						}
					},
					percent: {
						validate: function(val) {
							return App.round(val, 4)
						},
						update: function(require) {
							var result = require('this.weight') / require('oils.weight');
							return isFinite(result) ? App.round(result, 4) : 0
						}
					},
					weight: {
						is_tmp: true,
						update: function(require) {
							return require('oils.weight') * require('this.percent')
						}
					},
					// for App, underscore prefix indicates control cannot be assigned, only updated (if update() given)
					_naoh_weight: {
						is_tmp: true,
						is_assignable: false,
						update: function(require) {
							return App.round(require('this.weight') * require('this.naoh_sap'), 5)
						}
					},
					_koh_weight: {
						is_tmp: true,
						is_assignable: false,
						update: function(require) {
							return App.round(require('this.weight') * require('this.koh_sap'), 5)
						}
					}
				}
			},
			liquids: {

			},
			additives: {

			}
		},
		controller: {
			print: function() {
				UI.list_recipes();
				UI.out_recipe(UI.toJSON(recipe_data));
				UI.out_recipe_tmp(UI.toJSON(recipe_tmp_data));
				return this;
			},
			save: function() {
				this.updated_at = new Date();
				Data.update_table_row('recipe', uid, recipe_data);
				this.print();
				return this;
			},
			copy: function() {
				uid = create_uid(3, Data.get_table('recipe'));
				this.name += ' (Copy)';
				this.created_at = new Date();
				this.save();
				return this;
			},
			delete: function() {
				if ( Data.get_table_row('recipe', uid) && confirm('Are you sure you want to delete this recipe?') ) {
					Data.delete_table_row('recipe', uid);
				}
				UI.list_oils();
				UI.out_oil('');
				//todo: find any references to this object instance to delete or =null for garbage collection
				return null;
			}
		},
		finally_func: function(controller) {
			controller.save();
		}
	});

	window.recipe_calc = recipe_calc;

	return recipe_calc.controller;
}
