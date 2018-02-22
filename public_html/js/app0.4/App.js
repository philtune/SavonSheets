var App = {

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
