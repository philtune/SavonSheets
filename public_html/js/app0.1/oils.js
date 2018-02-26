/*

# Oils Module

Simple CRUD module that does not calculate anything.

*/
var oils = (function(data){
	return {
		addRow : function(name, naoh_sap, koh_sap)
		{
			var name = name || null,
				naoh_sap = naoh_sap || 0,
				koh_sap = koh_sap || 0;

			// Generate unique row_key
			var row_key = create_uid(3, data.rows);

			// Add row to data object
			data.rows[row_key] = {
				name: name, naoh_sap: naoh_sap, koh_sap: koh_sap
			};

			this.save();
			return this.row(row_key);
		},
		row : function(row_key)
		{
			if ( row_key === undefined ) throw 'Missing row key';
			if ( !data.rows.hasOwnProperty(row_key) )
				throw 'Row key "'+row_key+'" does not exist';

			var this_row = data.rows[row_key];
			return {
				percent : function(percent)
				{
					if ( percent === undefined ) return this_row.percent;
					else {
						if ( typeof percent !== "number" || percent < 0 )
							throw 'Argument must be an number >= 0';
					}
				}
			}
		},
		_getJSON : function()
		{
			return JSON.stringify(data, null, '\t');
		},
		_getOrdered : function()
		{

		},
		save : function()
		{

		}
	}
})({
	"rows" : {
		"frb" : {
			"name" : "Olive Oil",
			"naoh_sap" : 0.134,
			"koh_sap" : 0.188
		},
		"rgq" : {
			"name" : "Coconut Oil",
			"naoh_sap" : 0.183,
			"koh_sap" : 0.257
		},
		"mbq" : {
			"name" : "Palm Oil",
			"naoh_sap" : 0.142,
			"koh_sap" : 0.199
		}
	}
});

// KOH to NaOH multiplier: 0.714
// NaOH to KOH multiplier: 1.4

$('#oils_data').text(oils._getJSON());
