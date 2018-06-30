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
	}

	function destroy() {
		if ( Data.get_table_row('recipe', uid) && confirm('Are you sure you want to delete this recipe?') ) {
			Data.delete_table_row('recipe', uid);
		}
		//todo: the following needs to be tested
		$.each(Object.keys(recipe_calc.controller), function(i, key){
			delete recipe_calc.controller[key];
		});
		delete recipe_calc.controller;
		show_index();
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
			created_at: { //fixme: metadata probably not be needed for the calculator
				type: 'date',
				default: new Date(),
				assignable: false
			},
			updated_at: { //fixme: metadata probably not be needed for the calculator
				type: 'date',
				default: new Date(),
				assignable: false
			},
			deleted_at: { //fixme: metadata probably not be needed for the calculator
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
				//todo: define list controls here instead of in a separate file
				controls: {
					name: 'string',
					percent: {
						update: function(require) {
							return require('weight') / require('parent.total_oils_weight', false);
						}
					},
					weight: {
						is_tmp: true,
						update: function(require) {
							return require('percent') * require('parent.total_oils_weight');
						}
					}
				},
				/**
				 * @param {string} [uid]
				 * @param {object} recipe_calc
				 * @returns {controller}
				 * @constructor
				 */
				class: function(recipe_calc, uid) {
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
			}
		},
		finally: save
	})
		.init(show_index);

	window.recipe_calc = recipe_calc;

	return recipe_calc.controller;
}