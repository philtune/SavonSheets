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
                !prop.data_obj.hasOwnProperty(key) // if data_obj[key] hasn't been set...
            ) {
	            if ( prop.hasOwnProperty('default') ) { // if a default was provided...
		            prop.data_obj[key] = prop.default; // then set the default value
	            } else {
	            	prop.data_obj[key] =
			            ( prop.hasOwnProperty('is_string') && prop.is_string ) ?
				            '' : 0;
	            }
            }
            Object.defineProperty(_instance, key, {
                set: function (val) {
                    if ( !( prop.hasOwnProperty('is_string') && prop.is_string ) ) {
                        if ( typeof val === 'boolean' ) return 'Assigned value must be a number.';
                        val = val / 1;
                        if ( isNaN(val) ) return 'Assigned value must be a number.';
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
                        else
                            return ( prop.hasOwnProperty('is_string') && prop.is_string ) ? '' : 0;
                    }
                }
            });
        });
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

UI.list_recipes();
UI.list_oils();
