var app = {

	settings: {
		units: 'g' // 'g|oz|lb|kg'
	},

    constants: {
        koh_naoh_ratio: 1.403,
        grams_per_oz: 28.3495,
        grams_per_lb: 453.592,
        grams_per_kg: 1000
    },

    round: function(number, place)
    {
        if ( place === undefined ) place = 0;
        var factor = Math.pow(10, place);
        return Math.round(number * factor) / factor;
    },

    defineInstanceProps: function(_instance, properties, finally_func)
    {
        $.each(properties, function(key, prop) {
            if (
            	prop.hasOwnProperty('data_obj') && // if data_obj was provided, and
                !prop.data_obj.hasOwnProperty(key) && // if data_obj[key] hasn't been set, and
                prop.hasOwnProperty('default') // if a default was provided...
            ) {
	            prop.data_obj[key] = prop.default; // then set the default value
            }
            Object.defineProperty(_instance, key, {
                set: function (val) {
                    if ( prop.hasOwnProperty('is_number') && prop.is_number ) {
                        if (typeof val === 'boolean') return 'Assigned value must be a number.';
                        val = val / 1;
                        if (isNaN(val)) return 'Assigned value must be a number.';
                    }

                    if ( prop.hasOwnProperty('set') ) {
                    	if (
                    		prop.set === false ||
		                    ( typeof prop.set === 'function' && prop.set(val) === false )
	                    )
                            return false;
                    } else if ( prop.hasOwnProperty('data_obj') ) {
	                    prop.data_obj[key] = val;
                    } else {
                        throw new Error('Missing \'data_obj\' or \'set\' property.');
                    }

                    if ( prop.hasOwnProperty('complete') && typeof prop.complete === 'function' )
                        prop.complete();

                    if ( finally_func && typeof finally_func === 'function' )
                        finally_func();
                },
                get: function () {
                    if ( prop.hasOwnProperty('data_obj') ) {
                        if ( prop.data_obj.hasOwnProperty(key) )
                            return prop.data_obj[key];
                        else if ( prop.hasOwnProperty('is_number') && prop.is_number )
                            return 0;
                        else
                            return '';
                    }
                }
            });
        });
    }
};

UI.list_recipes();
UI.list_oils();
