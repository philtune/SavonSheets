function RecipeLiquid(uid, data, tmp_data, recipe_methods)
{
	// Instance constructor

	if ( uid !== undefined ) { // find an existing RecipeLiquid
		if ( !data.liquids.hasOwnProperty(uid) )
			throw new Error('RecipeLiquid(\''+uid+'\') does not exist in this recipe');
	} else { // create new liquid
		uid = create_uid(3, data.liquids);
		data.liquids[uid] = {};
		recipe_methods.updateDb();
	}

	tmp_data.liquids[uid] = {};


	// Instance private methods
	var recipe_liquid_methods = {
	};


	// Instance public methods

	var _instance = {
		delete: function() {
			delete data.liquids[uid];
			delete tmp_data.liquids[uid];
			data.liquids = recipe_methods.fixObjOrder(data.liquids);
			recipe_methods.updateDb();
		}
	};

	app.defineInstanceProps(_instance, {
		name: {
			default: '',
			data_obj: data.liquids[uid]
		},
		parts: {
			default: 1,
			is_number: true,
			data_obj: data.liquids[uid],
			complete: function() {
				//fixme: not updating??
				console.log(data.liquids[uid], uid);
				recipe_methods
					.updateTotalLiquidsParts()
					.updateRecipeLiquidsPercent()
					.updateRecipeLiquidsWeight();
			}
		},
		pos: {
			default: Object.keys(data.liquids).length-1,
			data_obj: data.liquids[uid],
			set: function(val) {
				recipe_methods.change_pos(data.liquids, uid, val);
			}
		},
		_percent: {
			default: 0,
			is_number: true,
			data_obj: tmp_data.liquids[uid],
			set: false
		},
		_weight: {
			default: 0,
			is_number: true,
			data_obj: tmp_data.liquids[uid],
			set: false
		}
	}, recipe_methods.updateDb);

	recipe_methods
		.updateTotalLiquidsParts()
		.updateRecipeLiquidsPercent()
		.updateRecipeLiquidsWeight();

	window['recipe_liquid'] = _instance;

	return _instance;
}