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
	} else
		uid = create_uid(3, Data.get_table('recipe'));

	function show_index()
	{
		UI.list_recipes();
		UI.out_recipe(UI.toJSON(recipe_data));
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
	}

	function destroy() {
		if ( Data.get_table_row('recipe', uid) && confirm('Are you sure you want to delete this recipe?') ) {
			Data.delete_table_row('recipe', uid);
		}
		show_index();
		window.location.reload(); //fixme: find a better way to destroy controller
	}

	var recipe_calc = Calculr({
		data_obj: recipe_data,
		tmp_data_obj: recipe_tmp_data,
		controller: {
			copy: duplicate,
			delete: destroy
		},
		controls: {
			uid: { //todo: get rid of uid as soon as possible; it is only used in UI.list_recipes()
				type: 'string',
				default: uid,
				assignable: false
			},
			created_at: {
				type: 'date',
				default: new Date(),
				assignable: false
			},
			updated_at: {
				type: 'date',
				default: new Date(),
				assignable: false
			},
			deleted_at: {
				type: 'date',
				default: null,
				assignable: false
			},
			name: 'string',
			note: 'string',
			percent_naoh: {
				default: 1
			},
			lye_discount: {},
			liquid_lye_ratio: {
				default: 1
			},
			lye_type: {
				validate: function(val) {
					return (val < 0 || val > 2) ? 0 : val
				}
			}
		},
		finally: save
	})
		.addList('oils', {
			controls: {

			}
		})
		.init(show_index);

	window.recipe_calc = recipe_calc;

	return recipe_calc.controller;
}