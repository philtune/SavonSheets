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

	var recipe_oil_calc = recipe_calc.ItemCalculr('oils', uid, {
		data_obj: recipe_oil_data,
		tmp_data_obj: recipe_oil_tmp_data,
		controls: {
			oil_id: {
				type: 'string',
				set: function(val) {
					if ( val !== '' ) {
						var oil_instance = Oil(val); // from the Oils table
						//fixme: these should reference the controls, not the data itself
						recipe_oil_tmp_data._name = oil_instance.name;
						recipe_oil_tmp_data._naoh_sap = oil_instance.naoh_sap;
						recipe_oil_tmp_data._koh_sap = oil_instance.koh_sap;
					} else { //fixme: these should reference the controls, not the data itself
						recipe_oil_tmp_data._name = '';
						recipe_oil_tmp_data._naoh_sap = 0;
						recipe_oil_tmp_data._koh_sap = 0;
					}
					return val;
				}
			},
			pos: {
				default: Object.keys(recipe_calc.data_obj.oils).length-1,
				set: function(val) {
					App.change_pos(recipe_calc.data_obj.oils, uid, val);
					return false // App.change_pos updates the data so control does not need to
				}
			},
			percent: {
				set: function(val) { return App.round(val, 4) },
				update: function(require) {
					var result = require('this.weight') / require('total_oils_weight');
					return isFinite(result) ? App.round(result, 4) : 0
				}
			},
			weight: {
				is_tmp: true,
				update: function(require) { return require('total_oils_weight') * require('this.percent') }
			},
			// for App, underscore prefix indicates control cannot be assigned, only updated (if update() given)
			_name: { type: 'string',  is_tmp: true,  set: false },
			_naoh_sap: { is_tmp: true,  set: false },
			_koh_sap: { is_tmp: true,  set: false },
			_naoh_weight: {
				is_tmp: true,
				set: false,
				update: function(require) { return require('this.weight') * require('this._naoh_sap') }
			},
			_koh_weight: {
				is_tmp: true,
				set: false,
				update: function(require) { return require('this.weight') * require('this._koh_sap') }
			}
		},
		controller: {
			delete: function() {
				delete recipe_calc.data_obj.oils[uid];
				delete recipe_calc.tmp_data_obj.oils[uid];
				recipe_calc.data_obj.oils = App.fixObjOrder(recipe_calc.data_obj.oils);
				recipe_calc.controller.save();
				//todo: find any references to this object instance to delete or =null for garbage collection
			}
		}
	}).init(function(controller){
		controller.list();
	});
console.log(recipe_oil_calc);
	return recipe_oil_calc.controller;
}