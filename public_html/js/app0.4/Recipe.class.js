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
		controller: {

		},
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
			}
		},
		finally_func: function(controller) {
			controller.save();
		}
	});

	window.recipe_calc = recipe_calc;

	return recipe_calc.controller;
}
