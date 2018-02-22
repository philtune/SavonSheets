function RecipeOil(uid)
{
	var recipe_calc = this;

	if ( uid !== undefined ) {
		if ( !recipe_calc.data_obj.oils.hasOwnProperty(uid) || typeof recipe_calc.data_obj.oils[uid] !== 'object' )
			throw new Error('Missing or invalid data for recipe.oils[\''+uid+'\']');
	} else {
		uid = create_uid(3, Data.get_table('recipe'));
		recipe_calc.data_obj.oils[uid] = {};
	}
	var recipe_oil_data = recipe_calc.data_obj.oils[uid],
		recipe_oil_tmp_data = recipe_calc.tmp_data_obj.oils[uid] = {};

	var recipe_oil_calc = new Calculr({
		extends: recipe_calc,
		list_name: 'oils',
		data_obj: recipe_oil_data,
		tmp_data_obj: recipe_oil_tmp_data,
		controller: {
			delete: function() {
				delete recipe_calc.data_obj.oils[uid];
				delete recipe_calc.tmp_data_obj.oils[uid];
				recipe_calc.data_obj.oils = App.fixObjOrder(recipe_calc.data_obj.oils);
				recipe_calc.controller.save();
				//todo: find any references to this object instance to delete or =null for garbage collection
				return null;
			}
		},
		foreign_data: {
			oil_id: {
				type: 'string',
				class: Oil,
				controls: {
					name: { type: 'string', is_tmp: true },
					koh_sap: { is_tmp: true },
					naoh_sap: { is_tmp: true }
				}
			}
		},
		controls: {
			pos: {
				default: Object.keys(recipe_calc.data_obj.oils).length-1,
				validate: function(val) {
					App.change_pos(recipe_calc.data_obj.oils, uid, val);
					return false // App.change_pos updates the data so control does not need to
				}
			},
			percent: {
				validate: function(val) { return App.round(val, 4) },
				update: function(require) {
					var result = require('weight') / require('parent.total_oils_weight');
					return isFinite(result) ? App.round(result, 4) : 0
				}
			},
			weight: {
				is_tmp: true,
				update: function(require) { return require('parent.total_oils_weight') * require('percent') }
			},
			// for App, underscore prefix indicates control cannot be assigned, only updated (if update() given)
			_naoh_weight: {
				is_tmp: true,
				assignable: false,
				update: function(require) { return App.round(require('weight') * require('naoh_sap'), 5); }
			},
			_koh_weight: {
				is_tmp: true,
				assignable: false,
				update: function(require) { return App.round(require('weight') * require('koh_sap'), 5); }
			}
		},
		finally_func: function (controller) {
			recipe_calc.controller.save();
		}
	}).init(function(controller){
		recipe_calc.controller.print();
	});

	window.recipe_oil_calc = recipe_oil_calc;

	return recipe_oil_calc.controller;
}
