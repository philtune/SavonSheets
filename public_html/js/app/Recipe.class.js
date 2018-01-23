function Recipe()
{
	// Instance data

	var uid = '';
	var data = {}; // this is to be saved in the database
	var tmp_data = {
		oils: {},
		liquids: {},
		additives: {}
	}; // this is generated for each instance for use with interface


	// Instance private methods

	var recipe_methods = {

		updateDb: function() {
			data.updated_at = new Date();
			Data.update_table_row('recipe', uid, data);
			UI.list_recipes();
			UI.out_recipe(UI.toJSON(data));
			UI.out_recipe_tmp(UI.toJSON(tmp_data));
			return this;
		},

		updateRecipeOilsWeights: function() {
			$.each(data.oils, function(key) {
				data.oils[key].weight = app.round(tmp_data.total_oils_weight * tmp_data.oils[key].percent, 4);
			});
			return this;
		},

		updateRecipeOilsLyeWeights: function() {
			$.each(data.oils, function(key) {
				tmp_data.oils[key]._naoh_weight = data.oils[key].weight * tmp_data.oils[key]._naoh_sap;
				tmp_data.oils[key]._koh_weight = data.oils[key].weight * tmp_data.oils[key]._koh_sap;
			});
			return this;
		},

		updateTotalOilsPercent: function() {
			var total_oils_percent = 0;
			$.each(tmp_data.oils, function(key, oil) {
				total_oils_percent += oil.percent;
			});
			tmp_data._total_oils_percent = total_oils_percent;
			return this;
		},

		updateTotalOilsWeight: function() {
			var total_oils_weight = 0;
			$.each(data.oils, function (key) {
				total_oils_weight += data.oils[key].weight;
			});
			tmp_data.total_oils_weight = total_oils_weight;
			return this;
		},

		updateRecipeOilsPercent: function() {
			$.each(data.oils, function(key) {
				tmp_data.oils[key].percent =
					(data.oils[key].weight / tmp_data.total_oils_weight) ||
					0; // in case total_oils_weight is zero
			});
			tmp_data._total_oils_percent = 1;
			return this;
		},

		updateTotalLyesWeight: function() {
			var percent_naoh = [1, 0, data.percent_naoh][data.lye_type],
				percent_koh = [0, 1, 1-data.percent_naoh][data.lye_type],
				total_naoh_weight = 0,
				total_koh_weight = 0;
			$.each(tmp_data.oils, function(key){
				total_naoh_weight += tmp_data.oils[key]._naoh_weight;
				total_koh_weight += tmp_data.oils[key]._koh_weight;
			});
			tmp_data._total_naoh_weight = percent_naoh * total_naoh_weight * (1 - data.lye_discount);
			tmp_data._total_koh_weight = percent_koh * total_koh_weight * (1 - data.lye_discount);

			return this
				.updateTotalLiquidsWeight()
				.updateRecipeLiquidsWeight()
				.updateTotalRecipeWeight();
		},

		updateTotalLiquidsParts: function() {
			var total_liquids_parts = 0;
			$.each(data.liquids, function(key) {
				total_liquids_parts += data.liquids[key].parts;
			});
			tmp_data._total_liquids_parts = total_liquids_parts;
			return this;
		},

		updateRecipeLiquidsPercent: function() {
			$.each(tmp_data.liquids, function(key) {
				tmp_data.liquids[key]._percent = data.liquids[key].parts / tmp_data._total_liquids_parts;
			});
			return this;
		},

		updateRecipeLiquidsWeight: function() {
			$.each(tmp_data.liquids, function(key) {
				tmp_data.liquids[key]._weight = app.round(tmp_data.total_liquids_weight * tmp_data.liquids[key]._percent, 4);
			});
			return this;
		},

		updateTotalLiquidsWeight: function() {
			tmp_data.total_liquids_weight = ( tmp_data._total_naoh_weight + tmp_data._total_koh_weight ) * data.liquid_lye_ratio;
			return this;
		},

		updateRecipeAdditivesWeight: function() {
			$.each(data.additives, function(key) {
				data.additives[key].weight = app.round(tmp_data.total_additives_weight * tmp_data.additives[key].percent, 4);
			});
			return this;
		},

		updateTotalAdditivesWeight: function() {
			var total_additives_weight = 0;
			$.each(data.additives, function(key){
				total_additives_weight += data.additives[key].weight;
			});
			tmp_data.total_additives_weight = total_additives_weight;
			return this;
		},

		updateTotalRecipeWeight: function() {
			tmp_data.total_recipe_weight =
				tmp_data.total_oils_weight +
				tmp_data._total_naoh_weight +
				tmp_data._total_koh_weight +
				tmp_data.total_liquids_weight +
				tmp_data.total_additives_weight;
			return this;
		},

		change_pos: function(data_obj, uid, new_pos) {
			var last_pos = Object.keys(data_obj).length-1,
				original_pos = data_obj[uid].pos;
			if ( new_pos > last_pos )
				new_pos = last_pos;
			else if ( new_pos < 0 )
				new_pos = 0;
			var direction = new_pos - original_pos;
			if ( direction !== 0 ) {
				data_obj[uid].pos = new_pos;
				$.each(data_obj, function(key) {
					if ( key !== uid ) {
						if ( direction < 0 && data_obj[key].pos >= new_pos && data_obj[key].pos < original_pos )
							data_obj[key].pos++;
						if ( direction > 0 && data_obj[key].pos > original_pos && data_obj[key].pos <= new_pos )
							data_obj[key].pos--;
					}
				});
			}
		},

		fixObjOrder: function(obj, pos_key) {
			var broken = $.extend(true, {}, obj),
				cleaned = [],
				duplicates = [],
				final = [];
			if ( pos_key === undefined ) pos_key = 'pos';

			$.each(broken, function(key) {
				var pos = broken[key][pos_key],
					tmp_arr = [key, broken[key]];
				if ( cleaned[pos] ) {
					duplicates[pos] = duplicates[pos] || [];
					duplicates[pos].push(tmp_arr);
				} else cleaned[pos] = tmp_arr;
			});

			$.each(cleaned, function(i){
				var cleaned_arr = cleaned[i];
				if ( cleaned_arr !== undefined ) {
					final.push(cleaned_arr);
					if ( duplicates[i] !== undefined ) {
						$.each(duplicates[i], function(j, duplicate_arr){
							final.push(duplicate_arr);
						});
					}
				}
			});

			var fixed_obj = {};
			$.each(final, function(i){
				fixed_obj[final[i][0]] = final[i][1];
				fixed_obj[final[i][0]][pos_key] = i;
			});

			return fixed_obj;
		}

	};


	// Instance public methods
	
	var instance = {

		save: function() {
			data.updated_at = new Date();
			Data.update_table_row('recipe', uid, data);
			UI.list_recipes();
			UI.out_recipe(UI.toJSON(data));
			UI.out_recipe_tmp(UI.toJSON(tmp_data));
		},

		copy: function() {
			return new Recipe(data);
		},

		delete: function() {
			if ( confirm('Are you sure you want to delete this recipe?') ) {
				Data.delete_table_row('recipe', uid);
			}
			UI.list_recipes();
			UI.out_recipe('');
			UI.out_recipe_tmp('');
		},

		oil: function(oil_uid)
		{
			try {
				var recipe_oil = RecipeOil(oil_uid, data, tmp_data, recipe_methods);
			} catch(e) {
				console.log(e);
				recipe_oil = null;
			}
			return recipe_oil;
		},

		liquid: function(liquid_uid)
		{
			return RecipeLiquid(liquid_uid, data, tmp_data, recipe_methods);
		},

		additive: function(additive_uid)
		{
			//todo: build out RecipeAdditive class
			// return RecipeAdditive(additive_uid, data, tmp_data, recipe_methods);
		}

	};


	// Instance constructor

	if ( arguments[0] !== null ) { // if Recipe( 'uid' | {[data]} )...
		if ( typeof arguments[0] === 'string' ) {
			data = Data.get_table_row('recipe', arguments[0]);
			if ( !data ) {
				throw new Error('Recipe(\''+uid+'\') does not exist');
			} else {
				uid = arguments[0];
			}
		} else if ( typeof arguments[0] === 'object' ) { // from Recipe('uid').copy();
			data = arguments[0];
			uid = create_uid(3, Data.get_table('recipe'));
			data.uid = uid;
			data.name += ' (Copy)';
			data.created_at = new Date();
			recipe_methods.updateDb();
		}
		data.oils = data.oils || {};
		data.liquids = data.liquids || {};
		data.additives = data.additives || {};
	} else { // if new Recipe()...
		uid = create_uid(3, Data.get_table('recipe'));
		data = {
			uid: uid,
			created_at: new Date(),
			updated_at: new Date(),
			oils: {}, // in MySQL, store as JSON('{}')
			liquids: {}, // in MySQL, store as JSON('{}')
			additives: {} // in MySQL, store as JSON('{}')
		};
		recipe_methods.updateDb();
	}


	app.defineInstanceProps(instance, {
		name : {
			default: '',
			data_obj: data
		},
		note: {
			default: '',
			data_obj: data
		},
		lye_type: {
			default: 0, // [0:'NaOH',1:'KOH',2:'Mix']
			is_number: true,
			data_obj: data,
			set: function(val) {
				data.lye_type = ( val < 0 || val > 2 ) ? 0 : val;
			},
			complete: function() {
				recipe_methods
					.updateTotalLyesWeight();
			}
		},
		percent_naoh: {
			default: 1,
			is_number: true,
			data_obj: data,
			complete: function() {
				recipe_methods
					.updateTotalLyesWeight();
			}
		},
		lye_discount: {
			default: 0,
			data_obj: data,
			is_number: true,
			complete: function() {
				recipe_methods
					.updateTotalLyesWeight();
			}
		},
		liquid_lye_ratio: {
			default: 1,
			data_obj: data,
			is_number: true,
			complete: function() {
				recipe_methods
					.updateTotalLiquidsWeight()
					.updateRecipeLiquidsWeight()
					.updateTotalRecipeWeight();
			}
		},
		total_oils_weight: {
			default: 0,
			data_obj: tmp_data,
			complete: function() {
				recipe_methods
					.updateRecipeOilsWeights()
					.updateRecipeOilsLyeWeights()

					.updateTotalLyesWeight();
			}
		},
		_total_liquids_parts: {
			default: 0,
			data_obj: tmp_data,
			is_number: true,
			set: false
		},
		total_liquids_weight: {
			default: 0,
			data_obj: tmp_data,
			is_number: true,
			set: function(val) {
				var update_ratio = val / tmp_data.total_liquids_weight;
				tmp_data.total_liquids_weight = val;
				data.liquid_lye_ratio *= update_ratio;
				recipe_methods
					.updateTotalLiquidsWeight()
					.updateTotalRecipeWeight();
			}
		},
		total_additives_weight: {
			default: 0,
			data_obj: tmp_data,
			is_number: true,
			set: function(val) {
				//todo:
			}
		},
		total_recipe_weight: {
			default: 0,
			is_number: true,
			data_obj: tmp_data,
			set: function(val) {
				var update_ratio = val / tmp_data.total_recipe_weight;
				tmp_data.total_recipe_weight = val;
				tmp_data.total_liquids_weight *= update_ratio;
				// updateTotalRecipeWeight: function() {
				// 	tmp_data.total_recipe_weight =
				// 		tmp_data.total_oils_weight +
				// 		tmp_data._total_naoh_weight +
				// 		tmp_data._total_koh_weight +
				// 		tmp_data.total_liquids_weight +
				// 		tmp_data.total_additives_weight;
				// 	return this;
				// }

				// tmp_data.total_recipe_weight = val;
				// instance.total_oils_weight *= update_ratio;
				//todo: same with total_liquids_weight and total_additives_weight
				//
			}
		},
		_total_oils_percent: {
			default: 1,
			data_obj: tmp_data,
			set: false
		},
		_total_naoh_weight: {
			default: 0,
			data_obj: tmp_data,
			set: false
		},
		_total_koh_weight: {
			default: 0,
			is_number: true,
			data_obj: tmp_data,
			set: false
		}
	}, recipe_methods.updateDb);


	// Load ingredients:
	$.each(data.oils, function(key) {
		instance.oil(key);
	});
	data.oils = recipe_methods.fixObjOrder(data.oils);
	$.each(data.liquids, function(key) {
		instance.liquid(key);
	});
	data.liquids = recipe_methods.fixObjOrder(data.liquids);
	// todo:
	// $.each(data.additives, function(key) {
	// 	instance.additive(key);
	// });
	// data.additives = recipe_methods.fixObjOrder(data.additives);
	recipe_methods
		.updateTotalOilsWeight()
		.updateRecipeOilsPercent()
		.updateTotalAdditivesWeight()

		.updateTotalLyesWeight();
	
	UI.out_recipe(UI.toJSON(data));
	UI.out_recipe_tmp(UI.toJSON(tmp_data));

	window['recipe'] = instance;

	return instance;
}
