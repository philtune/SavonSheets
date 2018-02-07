function RecipeOil(uid, data, tmp_data, recipe_methods)
{
	// Instance private methods

    var recipe_oil_methods = {

        updateThisById: function() {
            if ( data.oils[uid].oil_id !== '' ) {
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
        }

    };


	// Instance constructor

	if ( uid !== undefined ) { // find an existing RecipeOil
		if ( !data.oils.hasOwnProperty(uid) )
			throw 'RecipeOil(\''+uid+'\') does not exist in this recipe';
	} else { // create new RecipeOil
		uid = create_uid(3, data.oils);
	}
	if ( !data.oils.hasOwnProperty(uid) || typeof data.oils[uid] !== 'object' || data.oils[uid] === null ) {
		data.oils[uid] = {};
		recipe_methods.save();
	}
	tmp_data.oils[uid] = {}; // this is generated for each instance for use with interface


    // Instance public methods

    // var instance = {
    //     delete: function() {
    //         delete data.oils[uid];
    //         delete tmp_data.oils[uid];
    //         data.oils = app.fixObjOrder(data.oils);
    //         recipe_methods.save();
    //     }
    // };
    //
    // app.defineInstanceProps(instance, {
	 //    pos: {
		//     default: Object.keys(data.oils).length-1,
		//     data_obj: data.oils[uid],
		//     set: function(val) {
		// 	    app.change_pos(data.oils, uid, val);
		//     }
	 //    },
	 //    oil_id: {
		//     default: '',
		//     is_string: true,
		//     data_obj: data.oils[uid],
		//     complete: function() {
		// 	    console.log(data.oils[uid]);
		// 	    recipe_oil_methods
		// 		    .updateThisById();
		// 	    recipe_methods
		// 		    .updateRecipeOilsLyesWeight()
		// 		    .updateTotalLyesWeight()
		// 		    .updateTotalLiquidsWeight()
		// 		    .updateRecipeLiquidsWeight()
		// 		    .updateTotalRecipeWeight();
		//     }
	 //    },
	 //    _name: {
		//     default: '',
		//     data_obj: tmp_data.oils[uid],
		//     set: false
	 //    },
	 //    _naoh_sap: {
		//     default: 0,
		//     data_obj: tmp_data.oils[uid],
		//     set: false
	 //    },
	 //    _koh_sap: {
		//     default: 0,
		//     data_obj: tmp_data.oils[uid],
		//     set: false
	 //    },
	 //    percent: {
		//     data_obj: data.oils[uid],
		//     set: function(val) {
		// 	    data.oils[uid].percent = app.round(val, 4);
		//     },
		//     complete: function() {
		// 	    tmp_data.oils[uid].weight = data.total_oils_weight * data.oils[uid].percent;
		// 	    recipe_methods.updateTotalOilsPercent();
		//     }
	 //    },
	 //    weight: {
		//     default: data.total_oils_weight * data.oils[uid].percent,
		//     data_obj: tmp_data.oils[uid],
		//     complete: function() {
		// 	    recipe_methods
		// 		    .updateRecipeOilsLyesWeight()
		// 		    .updateTotalLyesWeight()
		// 		    .updateTotalLiquidsWeight()
		// 		    .updateRecipeLiquidsWeight()
		// 		    .updateTotalRecipeWeight()
    //
		// 		    .updateTotalOilsWeight()
		// 		    .updateRecipeOilsPercent();
		//     }
	 //    },
	 //    _naoh_weight: {
    //     	default: 0,
		//     data_obj: tmp_data.oils[uid],
		//     set: false
	 //    },
	 //    _koh_weight: {
    //     	default: 0,
		//     data_obj: tmp_data.oils[uid],
		//     set: false
	 //    }
    // }, recipe_methods.save);

    var instance_properties = {

	    delete: function() {
		    delete data.oils[uid];
		    delete tmp_data.oils[uid];
		    data.oils = app.fixObjOrder(data.oils);
		    recipe_methods.save();
	    },

	    oil_id: { is_string: true },
	    pos: {
		    default: Object.keys(data.oils).length-1,
		    set: function(val) { app.change_pos(data.oils, uid, val); return false }
	    },
	    percent: {
		    set: function(val) { return app.round(val, 4) },
		    update: function(require) {
			    var result = require('this.weight') / require('total_oils_weight');
			    return isFinite(result) ? app.round(result, 4) : 0;
		    }
	    },
	    _name: {
		    is_string: true,
		    is_tmp: true,
		    set: false,
		    update: function(require) {
			    var oil_id = require('this.oil_id');
			    if ( oil_id !== undefined ) { // when dependencies are being recorded
				    //todo: front-load all Oil()s on init so this doesn't have to be called more than once
				    var oil_instance = Oil(oil_id);
				    if ( $.isEmptyObject(oil_instance) || !oil_instance.hasOwnProperty('name') ) return '';
				    else return oil_instance.name;
			    } else return '';
		    }
	    },
	    _naoh_sap: {
		    is_tmp: true,
		    set: false,
		    update: function(require) {
			    var oil_id = require('this.oil_id');
			    if ( oil_id !== undefined ) { // when dependencies are being recorded
				    //see to-do on _name
				    var oil_instance = Oil(oil_id);
				    if ( $.isEmptyObject(oil_instance) || !oil_instance.hasOwnProperty('naoh_sap') ) return false;
				    else return oil_instance.naoh_sap;
			    } else return 0;
		    }
	    },
	    _koh_sap: {
		    is_tmp: true,
		    set: false,
		    update: function(require) {
			    var oil_id = require('this.oil_id');
			    if ( oil_id !== undefined ) { // when dependencies are being recorded
				    //see to-do on _name
				    var oil_instance = Oil(oil_id);
				    if ( $.isEmptyObject(oil_instance) || !oil_instance.hasOwnProperty('koh_sap') ) return false;
				    else return oil_instance.koh_sap;
			    } else return 0;
		    }
	    },
	    weight: {
		    default: data.total_oils_weight * data.oils[uid].percent,
		    is_tmp: true,
		    update: function(require) { return require('total_oils_weight') * require('this.percent') }
	    },
	    _naoh_weight: {
		    is_tmp: true,
		    set: false,
		    update: function(require) { return require('this.weight') * require('this._naoh_sap') }
	    },
	    _koh_weight: {
		    is_tmp: true,
		    set: false,
		    update: function(require) { return require('this.weight') * require('this._koh_sap') }
	    }

    };

    window.recipe_oil_instance = instance_maker.create(data, tmp_data, instance_properties, recipe_methods.save, 'oils', uid);


	// Init

	recipe_oil_methods
		.updateThisById();
	recipe_methods
		.updateRecipeOilsLyesWeight()
		.updateTotalLyesWeight()
		.updateTotalLiquidsWeight()
		.updateRecipeLiquidsWeight()
		.updateTotalRecipeWeight();

    UI.out_recipe(UI.toJSON(data));
    UI.out_recipe_tmp(UI.toJSON(tmp_data));


    return window.recipe_oil = recipe_oil_instance;
}