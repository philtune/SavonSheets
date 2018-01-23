function RecipeOil(uid, data, tmp_data, recipe_methods)
{
	// Instance constructor

	if ( uid !== undefined ) { // find an existing RecipeOil
		if ( !data.oils.hasOwnProperty(uid) )
			throw 'RecipeOil(\''+uid+'\') does not exist in this recipe';
	} else { // create new RecipeOil
		uid = create_uid(3, data.oils);
	}
	if ( !data.oils.hasOwnProperty(uid) || typeof data.oils[uid] !== 'object' || data.oils[uid] === null ) {
		data.oils[uid] = {};
		recipe_methods.updateDb();
	}
	tmp_data.oils[uid] = {}; // this is generated for each instance for use with interface


	// Instance private methods
    var recipe_oil_methods = {

        updateThisById: function() {
        	/*
        	Uses:
        	- data.oils[uid].oil_id
        	- Oil() data
        	Updates:
        	- tmp_data.oils[uid].name (UI use only)
        	- tmp_data.oils[uid].*oh_saps
        	- tmp_data.oils[uid].*oh_weights (by method call)
        	- tmp_data.total_*oh_weights (by method's method call)
        	 */
            if ( data.oils[uid].oil_id !== 0 ) {
                var oil_instance = Oil(data.oils[uid].oil_id); // from the Oils table
                if ($.isEmptyObject(oil_instance)) {
                    return false;
                } else {
                    tmp_data.oils[uid]._name = oil_instance.name;
                    tmp_data.oils[uid]._naoh_sap = oil_instance.naoh_sap;
                    tmp_data.oils[uid]._koh_sap = oil_instance.koh_sap;
                }
            } else {
                tmp_data.oils[uid]._name = '';
                tmp_data.oils[uid]._naoh_sap = 0;
                tmp_data.oils[uid]._koh_sap = 0;
            }
            return this;
        },

	    updateThisLyesWeight: function() {
        	/*
        	Called by constructor with uid using Oil() data
        	Uses:
        	- data.oils[uid].weight_
        	- data.oils[uid].*oh_saps (read-only)
        	Updates:
        	- tmp_data.oils[uid].*oh_weights
        	 */
		    tmp_data.oils[uid]._naoh_weight = data.oils[uid].weight * tmp_data.oils[uid]._naoh_sap;
		    tmp_data.oils[uid]._koh_weight = data.oils[uid].weight * tmp_data.oils[uid]._koh_sap;

		    recipe_methods
			    .updateTotalLiquidsWeight()
			    .updateRecipeLiquidsWeight()
			    .updateTotalRecipeWeight();

		    return this;
	    }

    };


    // Instance public methods

    var _instance = {
        delete: function() {
            delete data.oils[uid];
            delete tmp_data.oils[uid];
            data.oils = recipe_methods.fixObjOrder(data.oils);
            recipe_methods.updateDb();
        }
    };

    app.defineInstanceProps(_instance, {
        oil_id: {
            default: 0,
            data_obj: data.oils[uid],
	        complete: function() {
            	recipe_oil_methods
		            .updateThisById()
		            .updateThisLyesWeight();
		        recipe_methods
			        .updateTotalLyesWeight();
	        }
        },
        weight: {
            default: 0,
            is_number: true,
            data_obj: data.oils[uid],
	        set: function(val) {
            	data.oils[uid].weight = app.round(val, 4);
	        },
            complete: function() {
	            recipe_oil_methods.updateThisLyesWeight();
	            recipe_methods
		            .updateTotalOilsWeight()
		            .updateRecipeOilsPercent()

		            .updateTotalLyesWeight();
            }
        },
        pos: {
            default: Object.keys(data.oils).length-1,
	        is_number: true,
            data_obj: data.oils[uid],
	        set: function(val) {
            	recipe_methods.change_pos(data.oils, uid, val);
	        }
        },
        percent: {
            default: data.oils[uid].weight / tmp_data.total_oils_weight,
	        is_number: true,
            data_obj: tmp_data.oils[uid],
	        complete: function() {
            	data.oils[uid].weight = app.round(tmp_data.total_oils_weight * tmp_data.oils[uid].percent, 4);
            	recipe_methods.updateTotalOilsPercent();
	        }
        },
	    _name: {
        	default: '',
		    data_obj: tmp_data.oils[uid],
		    set: false
	    },
        _naoh_sap: {
            default: 0,
	        is_number: true,
            data_obj: tmp_data.oils[uid],
	        set: false
        },
        _koh_sap: {
            default: 0,
	        is_number: true,
            data_obj: tmp_data.oils[uid],
	        set: false
        },
	    _naoh_weight: {
        	default: 0,
		    is_number: true,
		    data_obj: tmp_data.oils[uid],
		    set: false
	    },
	    _koh_weight: {
        	default: 0,
		    is_number: true,
		    data_obj: tmp_data.oils[uid],
		    set: false
	    }
    }, recipe_methods.updateDb);


	recipe_oil_methods
		.updateThisById()
		.updateThisLyesWeight();

    UI.out_recipe(UI.toJSON(data));
    UI.out_recipe_tmp(UI.toJSON(tmp_data));

    window['recipe_oil'] = _instance;

    return _instance;
}