function RecipeOil(recipe_instance, oil_uid, data, tmp_data)
{
	data.oils = data.oils || {};
	tmp_data.oils = tmp_data.oils || {};
	if ( oil_uid !== undefined ) {
		if ( !data.oils.hasOwnProperty(oil_uid) || typeof data.oils[oil_uid] !== 'object' || !data.oils[oil_uid] )
			throw new Error('Missing or invalid data for data.oils[\''+oil_uid+'\']');
		tmp_data.oils[oil_uid] = {};
	}


	return window.recipe_oil = Calculator({
	    data: data,
	    tmp_data: tmp_data,
		parent_instance: recipe_instance,
	    methods: {
	    	new: function() {
			    oil_uid = create_uid(3, data.oils);
			    data.oils[oil_uid] = {};
			    tmp_data.oils[oil_uid] = {};
			    recipe_instance.save();
			    return this;
		    },
		    delete: function () {
			    delete data.oils[oil_uid];
			    delete tmp_data.oils[oil_uid];
			    data.oils = app.fixObjOrder(data.oils);
			    recipe_instance.save();
		    },
		    updateThisById: function() {
			    if ( data.oils[oil_uid].oil_id !== '' ) {
				    var oil_instance = Oil(data.oils[oil_uid].oil_id); // from the Oils table
				    if ($.isEmptyObject(oil_instance)) {
					    return false;
				    } else {
					    tmp_data.oils[oil_uid]._name = oil_instance.name;
					    tmp_data.oils[oil_uid]._naoh_sap = oil_instance.naoh_sap;
					    tmp_data.oils[oil_uid]._koh_sap = oil_instance.koh_sap;
				    }
			    } else {
				    tmp_data.oils[oil_uid]._name = '';
				    tmp_data.oils[oil_uid]._naoh_sap = 0;
				    tmp_data.oils[oil_uid]._koh_sap = 0;
			    }
			    return this;
		    }
	    },
		props: {

		    oil_id: { is_string: true },
		    pos: {
			    default: Object.keys(data.oils).length-1,
			    set: function(val) { app.change_pos(data.oils, oil_uid, val); return false }
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
				    if ( !oil_id ) { // when dependencies are being recorded
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
				    if ( !oil_id ) { // when dependencies are being recorded
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
				    if ( !oil_id ) { // when dependencies are being recorded
					    //see to-do on _name
					    var oil_instance = Oil(oil_id);
					    if ( $.isEmptyObject(oil_instance) || !oil_instance.hasOwnProperty('koh_sap') ) return false;
					    else return oil_instance.koh_sap;
				    } else return 0;
			    }
		    },
		    weight: {
			    default: data.total_oils_weight * data.oils[oil_uid].percent,
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

	    },
	    after_update: function() {
		    recipe_instance.save()
	    },
	    list_name: 'oils',
	    list_id: oil_uid,
	    init: function() {
	    	var recipe_oil_instance = this;
	    	this.updateDependentPropsOf('oil_id');
		    // recipe_oil_methods
		    // 	.updateThisById();
		    // recipe_methods
		    // 	.updateRecipeOilsLyesWeight()
		    // 	.updateTotalLyesWeight()
		    // 	.updateTotalLiquidsWeight()
		    // 	.updateRecipeLiquidsWeight()
		    // 	.updateTotalRecipeWeight();

		    recipe_instance.show();
	    }
    });
}