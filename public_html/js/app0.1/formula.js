var formula = (function(data){
	return {
		init : function()
		{
			// if ( stored_data = database.get('formula['+id+']') ) {
			// 	Object.assign(data.formula, JSON.parse(stored_data));
			// }
			this.output();
		},
		row : function(row_key)
		{
			if ( row_key === undefined ) throw 'Missing row key';
			if ( !data.rows.hasOwnProperty(row_key) )
				throw 'Row key "'+row_key+'" does not exist';

			var this_row = data.rows[row_key];
			return {
				oil_id : function(oil_id)
				{
					if ( oil_id === undefined ) return this_row.oil_id;
					else {
						if ( typeof oil_id !== "string" )
							throw 'Argument must be a string';
						this_row.oil_id = oil_id;
						formula.save();
						return this;
					}
				},
				percent : function(percent)
				{
					if ( percent === undefined ) return this_row.percent;
					else {
						if ( typeof percent !== "number" || percent < 0 )
							throw 'Argument must be an number >= 0';

						// Update row data
						this_row.percent = percent;

						formula.save();
						return this;
					}
				},
				position : function(position)
				{
					if ( position === undefined ) return this_row.position;
					else {
						if ( typeof position !== "number" || position < 0 || position >= formula._countRows() )
							throw 'Argument must be an number >= 0 and <= row count';

						formula._foreachRow(function(i,row){
							if ( row.position >= position && row.position < this_row.position ) {
								// Increment other rows if they are BELOW or equal to the target position
								// but also ABOVE this row's current position
								row.position++;
							} else if ( row.position <= position && row.position > this_row.position ) {
								// Decrement other rows if they are ABOVE or equal to the target position
								// but also BELOW this row's current position
								row.position--;
							}
						});

						// Update row data
						this_row.position = position;

						formula.save();
						return this;
					}
				},
				end : function()
				{
					return formula;
				}
			};
		},
		addRow : function(oil_id, percent, position)
		{
			var oil_id = oil_id || null,
				percent = percent || 0,
				position = ( position !== undefined ) ? position : formula._countRows();

			// Generate unique row_key
			var row_key = create_uid(3, data.rows);

			// Add row to data object
			data.rows[row_key] = {
				oil_id: oil_id, percent: percent, position: position
			};

			this.save();
			return this.row(row_key);
		},
		_countRows : function()
		{
			return Object.keys(data.rows).length;
		},
		_orderRows : function()
		{
			var ordered = [];
			formula._foreachRow(function(i,row){
				ordered[row.position] = i;
			});
			return ordered;
		},
		_foreachRow : function(func) {
			for(i in data.rows) {
				func(i,data.rows[i]);
			}
		},
		_getJSON : function()
		{
			return JSON.stringify(data, null, '\t')
		},
		save : function()
		{
			data.updated = (new Date).toJSON();
			// database.set('formula['+id+']', JSON.stringify(data));
			this.output();
			return this;
		}
	};
})({ // 1oz = 28.3495g
	"rows" : {
		"yjk" : {
			"oil_id" : "frb",
			"percent" : 0.2,
			"position" : 1
		},
		"hmz" : {
			"oil_id" : "rgq",
			"percent" : 0.8,
			"position" : 0
		}
	},
	"lye_discount" : 0.05,
	"liquids" : {
		"mbo" : {
			"name" : "Rain Water", // either "name" or "liquid_id", not both
			"multiply_by" : "lye", // ["lye"|"oils"]
			"multiplier" : 2.1/2
		},
		"h39" : {
			"liquid_id" : "h2h", // either "name" or "liquid_id", not both
			"multiply_by" : "lye", // ["lye"|"oils"]
			"multiplier" : 1.1/2
		}
	},
	"additives" : { // additive reference: https://www.lovinsoap.com/soapmaking-additive-chart/
		"5r2" : {
			"additive_id" : "hny",
			// 'ounce-per-pound' - UI will offer volumetric and gravimetric options that will be converted to ounces (or maybe grams if that is what the whole app will be using); data for honey (1tsp = 0.25oz) from http://www.traditionaloven.com/conversions_of_measures/honey_measurements.html
			"opp" : 0.25, // or.. "gpp" : 7.087375
		},
		"bb8" : {
			"additive_id" : "slt",
			"opp" : 0.2
		}
	},
	"created" : (new Date).toJSON()
});

$('#formula_data').text(formula._getJSON());