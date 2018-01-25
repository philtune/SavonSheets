function RecipeLiquid(uid, data, tmp_data, recipe_methods)
{
	// Instance constructor

	if ( uid !== undefined ) { // find an existing RecipeLiquid
		if ( !data.liquids.hasOwnProperty(uid) )
			throw new Error('RecipeLiquid(\''+uid+'\') does not exist in this recipe');
	} else { // create new liquid
		uid = create_uid(3, data.liquids);
		data.liquids[uid] = {};
		recipe_methods.save();
	}
	tmp_data.liquids[uid] = {};


	// Instance private methods
	var recipe_liquid_methods = {
	};


	// Instance public methods

	var instance = {
		delete: function() {
			delete data.liquids[uid];
			delete tmp_data.liquids[uid];
			data.liquids = app.fixObjOrder(data.liquids);
			recipe_methods.save();
		}
	};

	app.defineInstanceProps(instance, {
		pos: {
			default: Object.keys(data.liquids).length-1,
			data_obj: data.liquids[uid],
			set: function(val) {
				app.change_pos(data.liquids, uid, val);
			},
			requires: [],
			ignore: []
		},
		name: {
			default: '',
			data_obj: data.liquids[uid],
			requires: [],
			ignore: []
		},
		parts: {
			default: 1,
			is_number: true,
			data_obj: data.liquids[uid],
			complete: function() {
				recipe_methods
					.updateTotalLiquidsParts()
					.updateRecipeLiquidsPercent()
					.updateRecipeLiquidsWeight();
			},
			requires: [],
			ignore: []
		},
		_percent: {
			default: 0,
			is_number: true,
			data_obj: tmp_data.liquids[uid],
			set: false,
			requires: [
				'_total_liquid_parts',
				'this.parts'
			],
			ignore: []
		},
		_weight: {
			default: 0,
			is_number: true,
			data_obj: tmp_data.liquids[uid],
			set: false,
			requires: [
				'_total_liquid_weight',
				'this._percent'
			],
			ignore: []
		}
	}, recipe_methods.save);


	// Init

	recipe_methods
		.updateTotalLiquidsParts()
		.updateRecipeLiquidsPercent()
		.updateRecipeLiquidsWeight();

	return window.recipe_liquid = instance;
}