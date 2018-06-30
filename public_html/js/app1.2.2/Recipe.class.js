/**
 *
 * @param {undefined|string} uid
 * @returns {controller}
 * @constructor
 */
function Recipe(uid)
{
	var recipe_data = {},
		recipe_tmp_data = {};

	if ( uid !== undefined ) {
		recipe_data = Data.get_table_row('recipe', uid);
		if ( !recipe_data )
			throw new Error('Oil(\''+uid+'\') does not exist');
	} else {
		uid = create_uid(3, Data.get_table('recipe'));
		recipe_data.uid = uid;
		recipe_data.created_at = new Date();
	}

	window.recipe_data = recipe_data;
	window.recipe_tmp_data = recipe_tmp_data;

	function show_index()
	{
		UI.list_recipes();
		UI.out_recipe(UI.toJSON(recipe_data));
		UI.out_recipe_tmp(UI.toJSON(recipe_tmp_data));
	}

	function save()
	{
		recipe_data.updated_at = new Date();
		Data.update_table_row('recipe', uid, recipe_data);
		show_index();
	}

	function duplicate() {
		uid = create_uid(3, Data.get_table('recipe'));
		recipe_data.uid = uid; //todo: get rid of uid as soon as possible; it is only used in UI.list_recipes()
		recipe_data.name += ' (Copy)';
		recipe_data.created_at = new Date();
		save();
		return this;
	}

	function destroy() {
		if ( Data.get_table_row('recipe', uid) && confirm('Are you sure you want to delete this recipe?') ) {
			recipe_data.deleted_at = new Date(); // if doing soft deletes
			Data.delete_table_row('recipe', uid);
		}
		//todo: the following needs to be tested
		$.each(Object.keys(recipe_calc.controller), function(i, key){
			delete recipe_calc.controller[key];
		});
		delete recipe_calc.controller;
		show_index();
		return {};
	}

	var recipe_calc = Calculr({
		data_obj: recipe_data,
		tmp_data_obj: recipe_tmp_data,
		controller: {
			copy: duplicate.bind(this),
			delete: destroy.bind(this)
		},
		controls: {
			name: 'string',
			note: 'string',
			percent_naoh: {
				default: 1
			},
			lye_discount: {},
			tmp_var: {
				is_tmp: true,
				update: function(require) {
					return require('percent_naoh') * require('liquid_lye_ratio')
				}
			},
			liquid_lye_ratio: {
				default: 1
			},
			lye_type: {
				validate: function(val) {
					return (val < 0 || val > 2) ? 0 : val
				}
			},
			total_oils_weight: {},
			total_oils_percent: {
				is_tmp: true
			},
			total_oils_naoh_weight: {
				is_tmp: true
			},
			total_oils_koh_weight: {
				is_tmp: true
			}
		},
		lists: {
			oils: {
				control_name: 'oil',
				controls: {
					name: 'string',
					pos: {
						validate: function() {
							//todo
						},
						after: function() {
							//todo
						}
					},
					percent: {
						countable: true,
						update: function(require) {
							return require('weight') / require('parent.total_oils_weight', false);
						}
					},
					weight: {
						countable: true,
						is_tmp: true,
						update: function(require) {
							return require('percent') * require('parent.total_oils_weight');
						}
					}
				}
			}
		},
		finally: save
	});

	recipe_calc.init(show_index);

	window.recipe_calc = recipe_calc;

	return recipe_calc.controller;
}