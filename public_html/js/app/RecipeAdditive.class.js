function RecipeAdditive(uid, data, tmp_data, recipe_methods)
{
	// Instance constructor

	if ( uid !== undefined ) { // find an existing RecipeAdditive
		if ( !data.additives.hasOwnProperty(uid) )
			throw new Error('RecipeAdditive(\''+uid+'\') does not exist in this recipe');
	} else { // create new additive
		uid = create_uid(3, data.additives);
		data.additives[uid] = {};
		recipe_methods.save();
	}
	tmp_data.additives[uid] = {};


	// Instance private methods
	var recipe_additive_methods = {
	};


	// Instance public methods

	var instance = {
		delete: function() {
			delete data.additives[uid];
			delete tmp_data.additives[uid];
			data.additives = app.fixObjOrder(data.additives);
			recipe_methods.save();
		}
	};

	app.defineInstanceProps(instance, {
		// name: {
		// 	default: '',
		// 	data_obj: data.additives[uid]
		// },
		// parts: {
		// 	default: 1,
		// 	is_number: true,
		// 	data_obj: data.additives[uid],
		// 	complete: function() {
		// 		recipe_methods
		// 			.updateTotalAdditivesParts()
		// 			.updateRecipeAdditivesPercent()
		// 			.updateRecipeAdditivesWeight();
		// 	}
		// },
		// pos: {
		// 	default: Object.keys(data.additives).length-1,
		// 	data_obj: data.additives[uid],
		// 	set: function(val) {
		// 		app.change_pos(data.additives, uid, val);
		// 	}
		// },
		// _percent: {
		// 	default: 0,
		// 	is_number: true,
		// 	data_obj: tmp_data.additives[uid],
		// 	set: false
		// },
		// _weight: {
		// 	default: 0,
		// 	is_number: true,
		// 	data_obj: tmp_data.additives[uid],
		// 	set: false
		// }
	}, recipe_methods.save);


	// Init

	// recipe_methods
	// 	.updateTotalAdditivesParts()
	// 	.updateRecipeAdditivesPercent()
	// 	.updateRecipeAdditivesWeight();
	
	return window.recipe_additive = instance;
}