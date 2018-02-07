function Recipe() {
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

		show: function() {
			UI.list_recipes();
			UI.out_recipe(UI.toJSON(data));
			UI.out_recipe_tmp(UI.toJSON(tmp_data));
		},

		save: function () {
			data.updated_at = new Date();
			Data.update_table_row('recipe', uid, data);
			recipe_methods.show();
			return this;
		},

		updateRecipeOilsPercent: function() {
			$.each(data.oils, function(key) {
				data.oils[key].percent =
					app.round(tmp_data.oils[key].weight / data.total_oils_weight, 4) ||
					0; // in case total_oils_weight is zero
			});
			tmp_data._total_oils_percent = 1;
			return this;
		},

		updateRecipeOilsWeights: function() {
			$.each(data.oils, function(key) {
				tmp_data.oils[key].weight = data.total_oils_weight * data.oils[key].percent;
			});
			return this;
		},

		updateRecipeAdditivesWeight: function() {
			$.each(data.additives, function(key) {
				data.additives[key].weight = app.round(tmp_data._total_additives_weight * tmp_data.additives[key].percent, 4);
			});
			return this;
		},

		updateTotalOilsPercent: function() {
			var total_oils_percent = 0;
			$.each(data.oils, function(key) {
				total_oils_percent += data.oils[key].percent;
			});
			tmp_data._total_oils_percent = total_oils_percent;
			return this;
		},

		updateTotalOilsWeight: function() {
			var total_oils_weight = 0;
			$.each(tmp_data.oils, function (key) {
				total_oils_weight += tmp_data.oils[key].weight;
			});
			data.total_oils_weight = total_oils_weight;
			return this;
		},

		updateRecipeOilsLyesWeight: function() {
			//fixme: this should not be required before .updateTotalLyesWeight... should only run after updating oil weight and *oh_sap
			$.each(tmp_data.oils, function(key){
				tmp_data.oils[key]._naoh_weight = tmp_data.oils[key].weight * tmp_data.oils[key]._naoh_sap;
				tmp_data.oils[key]._koh_weight = tmp_data.oils[key].weight * tmp_data.oils[key]._koh_sap;
			});
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

			return this;
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
				tmp_data.liquids[key]._weight = app.round(tmp_data._total_liquids_weight * tmp_data.liquids[key]._percent, 4);
			});
			return this;
		},

		updateTotalLiquidsWeight: function() {
			tmp_data._total_liquids_weight = ( tmp_data._total_naoh_weight + tmp_data._total_koh_weight ) * data.liquid_lye_ratio;
			return this;
		},

		updateTotalAdditivesWeight: function() {
			var total_additives_weight = 0;
			$.each(data.additives, function(key){
				total_additives_weight += data.additives[key].weight;
			});
			tmp_data._total_additives_weight = total_additives_weight;
			return this;
		},

		updateTotalRecipeWeight: function() {
			tmp_data.total_recipe_weight =
				data.total_oils_weight +
				tmp_data._total_naoh_weight +
				tmp_data._total_koh_weight +
				tmp_data._total_liquids_weight +
				tmp_data._total_additives_weight;
			return this;
		},

		duplicateOilCheck: function() {
			//todo
		}

	};


	// Instance constructor

	if ( arguments[0] !== undefined ) {
		data = Data.get_table_row('recipe', arguments[0]);
		if (!data) {
			throw new Error('Recipe(\'' + uid + '\') does not exist');
		} else {
			uid = arguments[0];
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
		recipe_methods.save();
	}


	// Instance public methods

	// var instance = {
	//
	// 	copy: function () {
	// 		uid = create_uid(3, Data.get_table('recipe'));
	// 		data.uid = uid;
	// 		data.name += ' (Copy)';
	// 		data.created_at = new Date();
	// 		recipe_methods.save();
	// 		return this;
	// 	},
	//
	// 	delete: function () {
	// 		if ( confirm('Are you sure you want to delete this recipe?') )
	// 			Data.delete_table_row('recipe', uid);
	// 		recipe_methods.show();
	// 		return window.recipe = instance = {};
	// 	},
	//
	// 	oil: function (oil_uid) {
	// 		return RecipeOil(oil_uid, data, tmp_data, recipe_methods);
	// 	},
	//
	// 	liquid: function (liquid_uid) {
	// 		return RecipeLiquid(liquid_uid, data, tmp_data, recipe_methods);
	// 	},
	//
	// 	additive: function (additive_uid) {
	// 		// todo:
	// 		// return RecipeAdditive(additive_uid, data, tmp_data, recipe_methods);
	// 	}
	//
	// };


	// app.defineInstanceProps(instance, {
	// 	name : {
	// 		is_string: true,
	// 		data_obj: data
	// 	},
	// 	note: {
	// 		is_string: true,
	// 		data_obj: data
	// 	},
	// 	lye_type: {
	// 		default: 0, // [0:'NaOH',1:'KOH',2:'Mix']
	// 		data_obj: data,
	// 		set: function(val) {
	// 			data.lye_type = ( val < 0 || val > 2 ) ? 0 : val;
	// 		},
	// 		complete: function() {
	// 			recipe_methods
	// 				.updateRecipeOilsLyesWeight()
	// 				.updateTotalLyesWeight()
	// 				.updateTotalLiquidsWeight()
	// 				.updateRecipeLiquidsWeight()
	// 				.updateTotalRecipeWeight();
	// 		}
	// 	},
	// 	percent_naoh: {
	// 		default: 1,
	// 		data_obj: data,
	// 		complete: function() {
	// 			recipe_methods
	// 				.updateRecipeOilsLyesWeight()
	// 				.updateTotalLyesWeight()
	// 				.updateTotalLiquidsWeight()
	// 				.updateRecipeLiquidsWeight()
	// 				.updateTotalRecipeWeight();
	// 		}
	// 	},
	// 	lye_discount: {
	// 		data_obj: data,
	// 		complete: function() {
	// 			recipe_methods
	// 				.updateRecipeOilsLyesWeight()
	// 				.updateTotalLyesWeight()
	// 				.updateTotalLiquidsWeight()
	// 				.updateRecipeLiquidsWeight()
	// 				.updateTotalRecipeWeight();
	// 		}
	// 	},
	// 	liquid_lye_ratio: {
	// 		default: 1,
	// 		data_obj: data,
	// 		complete: function() {
	// 			recipe_methods
	// 				.updateTotalLiquidsWeight()
	// 				.updateRecipeLiquidsWeight()
	// 				.updateTotalRecipeWeight();
	// 		}
	// 	},
	// 	total_oils_weight: {
	// 		data_obj: data,
	// 		complete: function() {
	// 			recipe_methods
	// 				.updateRecipeOilsWeights()
	// 				.updateRecipeOilsLyesWeight()
	// 				.updateTotalLyesWeight()
	// 				.updateTotalLiquidsWeight()
	// 				.updateRecipeLiquidsWeight()
	// 				.updateTotalRecipeWeight();
	// 		}
	// 	},
	// 	_total_liquids_weight: {
	// 		data_obj: tmp_data,
	// 		set: false
	// 	},
	// 	_total_additives_weight: {
	// 		data_obj: tmp_data,
	// 		set: false
	// 	},
	// 	total_recipe_weight: {
	// 		data_obj: tmp_data,
	// 		set: function(val) {
	// 			//todo
	// 		}
	// 	},
	// 	_total_oils_percent: {
	// 		default: 1,
	// 		data_obj: tmp_data,
	// 		set: false
	// 	},
	// 	_total_naoh_weight: {
	// 		data_obj: tmp_data,
	// 		set: false
	// 	},
	// 	_total_koh_weight: {
	// 		data_obj: tmp_data,
	// 		set: false
	// 	},
	// 	_total_liquids_parts: {
	// 		data_obj: tmp_data,
	// 		set: false
	// 	}
	// }, recipe_methods.save);

	var instance_properties = {

		save: function() {
			data.updated_at = new Date();
			Data.update_table_row('recipe', uid, data);
			recipe_methods.show();
			return this;
		},

		copy: function () {
			uid = create_uid(3, Data.get_table('recipe'));
			data.uid = uid;
			data.name += ' (Copy)';
			data.created_at = new Date();
			recipe_methods.save();
			return this;
		},

		delete: function () {
			if ( confirm('Are you sure you want to delete this recipe?') )
				Data.delete_table_row('recipe', uid);
			recipe_methods.show();
			return window.recipe_instance = {};
		},

		oil: function (oil_uid) {
			return RecipeOil(oil_uid, data, tmp_data, recipe_methods);
		},

		liquid: function (liquid_uid) {
			return RecipeLiquid(liquid_uid, data, tmp_data, recipe_methods);
		},

		additive: function (additive_uid) {
			// todo:
			// return RecipeAdditive(additive_uid, data, tmp_data, recipe_methods);
		},

		name: { is_string: true },
		note: { is_string: true },
		percent_naoh: { default: 1 },
		lye_discount: {},
		liquid_lye_ratio: { default: 1 },
		lye_type: { set: function(val) { return ( val < 0 || val > 2 ) ? 0 : val } },
		total_oils_weight: { update: function(require) { return require('oils.weight') } },
		_total_liquids_weight: {
			is_tmp: true,
			set: false,
			update: function(require) { return require(['_total_naoh_weight', '_total_koh_weight']) * require('liquid_lye_ratio') }
		},
		_total_additives_weight: {
			is_tmp: true,
			set: false,
			update: function(require) { return require('additives.weight') }
		},
		_total_oils_percent: {
			default: 1,
			is_tmp: true,
			set: false,
			update: function(require) { return require('oils.percent') }
		},
		_total_naoh_weight: {
			is_tmp: true,
			set: false,
			update: function(require) {
				return [1, 0, require('percent_naoh')][require('lye_type')] * require('oils._naoh_weight') * (1-require('lye_discount'))
			}
		},
		_total_koh_weight: {
			is_tmp: true,
			set: false,
			update: function(require) {
				return [0, 1, 1-require('percent_naoh')][require('lye_type')] * require('oils._koh_weight') * (1-require('lye_discount'))
			}
		},
		_total_liquids_parts: {
			is_tmp: true,
			set: false,
			update: function(require) { return require('liquids.parts') }
		},
		total_recipe_weight: {
			is_tmp: true,
			set: false, //todo
			update: function(require) {
				return require([
					'total_oils_weight',
					'_total_naoh_weight',
					'_total_koh_weight',
					'_total_liquids_weight',
					'_total_additives_weight'
				]);
			}
		}

	};

	window.recipe_instance = instance_maker.create(data, tmp_data, instance_properties, recipe_methods.save);


	// Init

	// Build up tmp_data for UI.out_recipe_tmp
	$.each(data.oils, function(key) {
		recipe_instance.oil(key);
	});
	data.oils = app.fixObjOrder(data.oils);
	$.each(data.liquids, function(key) {
		recipe_instance.liquid(key);
	});
	data.liquids = app.fixObjOrder(data.liquids);
	// todo:
	// $.each(data.additives, function(key) {
	// 	instance.additive(key);
	// });
	// data.additives = recipe_methods.fixObjOrder(data.additives);
	recipe_methods
		// .updateTotalOilsWeight()
		// .updateRecipeOilsPercent()
		.updateRecipeOilsWeights()
		.updateRecipeLiquidsWeight()
		// .updateTotalAdditivesWeight()

		.updateRecipeOilsLyesWeight()
		.updateTotalLyesWeight()
		.updateTotalLiquidsWeight()
		.updateRecipeLiquidsWeight()
		.updateTotalRecipeWeight()

		.show();

	return window['recipe'] = recipe_instance;
}
