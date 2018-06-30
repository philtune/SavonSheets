/**
 * @param {string} [uid]
 * @param {object} data_obj
 * @param {object} tmp_data_obj
 * @param {function} finallyFunc
 * @returns {controller}
 * @constructor
 */
function RecipeOil(uid, data_obj, tmp_data_obj, finallyFunc) {

	if ( uid !== undefined ) {
		if ( !data_obj.oils.hasOwnProperty(uid) )
			throw new Error('UID \''+uid+'\' not found');
	} else {
		uid = create_uid(3, data_obj.oils);
		data_obj.oils[uid] = {};
	}
	var recipe_oil_data = data_obj.oils[uid],
		recipe_oil_tmp_data = tmp_data_obj.oils[uid] = {};

	function destroy()
	{
		delete data_obj.oils[uid];
		delete tmp_data_obj.oils[uid];
		delete this.controller;
		finallyFunc();
	}

	var recipe_oil_calc = Calculr({
		data_obj: recipe_oil_data,
		tmp_data_obj: recipe_oil_tmp_data,
		controller: {
			delete: destroy.bind(this)
		},
		controls: {
			name: 'string',
			percent: {},
			weight: {
				is_tmp: true
			},
			tmp_var: {
				is_tmp: true,
				update: function(require) {
					return require('percent');
				}
			}
		},
		finally: finallyFunc
	}).init(finallyFunc);

	window.recipe_oil_calc = recipe_oil_calc;

	return recipe_oil_calc.controller;
}