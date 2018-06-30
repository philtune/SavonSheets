/**
 * @param {string} [uid]
 * @param {object} recipe_calc
 * @returns {controller}
 * @constructor
 */
function RecipeOil(recipe_calc, uid) {

	var recipe_data = recipe_calc.data_obj,
		recipe_tmp_data = recipe_calc.tmp_data_obj;

	if ( uid !== undefined ) {
		if ( !recipe_data.oils.hasOwnProperty(uid) )
			throw new Error('UID \''+uid+'\' not found');
	} else {
		uid = create_uid(3, recipe_data.oils);
		recipe_data.oils[uid] = {};
	}
	recipe_tmp_data.oils[uid] = {};

	function destroy()
	{
		delete recipe_data.oils[uid];
		delete recipe_tmp_data.oils[uid];
		$.each(Object.keys(recipe_oil_calc.controller), function(i, key){
			delete recipe_oil_calc.controller[key];
		});
		delete recipe_oil_calc.controller;
		recipe_calc.finallyFunc();
	}

	var recipe_oil_calc = Calculr({
		parent_calc: recipe_calc,
		list_name: 'oils',
		data_obj: recipe_data.oils[uid],
		tmp_data_obj: recipe_tmp_data.oils[uid],
		controller: {
			delete: destroy
		},
		controls: {
			name: 'string',
			percent: {
				update: function(require) {
					return require('weight') / require('parent.total_oils_weight');
				}
			},
			weight: {
				is_tmp: true,
				update: function(require) {
					return require('percent') * require('parent.total_oils_weight');
				}
			}
		},
		finally: recipe_calc.finallyFunc
	}).init(recipe_calc.finallyFunc);

	window.recipe_oil_calc = recipe_oil_calc;

	return recipe_oil_calc;
}