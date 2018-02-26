/*
TODOs:
- finish INDEXES (unique vs. standard)
- make delete()
- use INDEXES to speed up .find()
*/
var DataClass = function(args) {

	/* public properties -> */

	/* private properties -> */
	TABLE = {};
	INDEXES = {};
	FIELDS = [];

	/* instance methods -> */

	/* __constructor() */
	for ( key in args ) { var val = args[key];
		var field_name = val[0],
			field_type = val[1],
			default_val = val[2],
			is_required = val[3] || false,
			is_unique = val[4] || false;
		FIELDS.push({
			name : field_name,
			type : field_type,
			default_val : default_val,
			is_required : is_required
		});
		if ( is_unique ) {
			INDEXES[field_name] = {};
		}
	}

	this.insert = function(data)
	{
		// Check for collisions, return if any are found
		var has_collision = false;
		$.each(INDEXES, function(field_name, the_index){
			var val = data[field_name];
			if ( the_index.hasOwnProperty(val) ) {
				console.log('>> Collision detected: {"'+field_name+'" : "'+val+'"} //key "'+the_index[val]+'"', data);
				has_collision = true;
			}
		});
		if ( !has_collision ) {

			// Build new row to be added to the data
			var missing_field = false,
				row = {},
				indexes = INDEXES,
				new_id = create_uid(3, TABLE);
			$.each(FIELDS, function(i, field) {
				if ( field.is_required && !data.hasOwnProperty(field.name) ) {
					console.log('>> Missing required field "'+field.name+'"', data);
					missing_field = true;
					return;
				}
				var val = data[field.name] || field.default_val;
				if ( typeof val !== field.type ) {
					console.log('>> Type mismatch: "'+field.name+'" expecting "'+field.type+'" type but got "'+(typeof val)+'"', data);
					row[field.name] = field.default_val;
				} else {
					row[field.name] = val;

					// Should this value be indexed?
					if ( indexes.hasOwnProperty(field.name) ) {
						indexes[field.name][val] = new_id;
					}
				}
			});
			if ( !missing_field ) {
				TABLE[new_id] = row;
			}
			
		}

		return this;
	};

	this.update = function(search, update_arr)
	{
		if ( data = this.find(search)[0] ) {
			for ( var key in update_arr ) { var val = update_arr[key];
				data[key] = val;
			}
		} else {
			console.log('>> Cannot find: ', search);
		}
		return this;
	};

	this.find = function(search)
	{
		var search = search || null,
			_return = [];
		if ( typeof search === "string" ) {
			if ( TABLE.hasOwnProperty(search) ) {
				_return.push(TABLE[search]);
			}
		} else {
			for ( data_key in TABLE ) { var data_val = TABLE[data_key];
				if ( search ) {
					for ( search_key in search ) { var filter_val = search[search_key];
						if ( data_val[search_key] === filter_val ) {
							_return.push(data_val);
						}
					}
				} else {
					_return.push(data_val);
				}
			}
		}
		return _return;
	};

	this.delete = function(search)
	{
		return this;
	};

	this.out = function()
	{
		console.log('TABLE:',JSON.stringify(TABLE, null, '\t'));
		console.log('INDEXES:',JSON.stringify(INDEXES, null, '\t'));
		return;
	}

}

var oilsDb = new DataClass([
	["name",     "string", null, true, true],
	["naoh_sap", "number", 0               ],
	["koh_sap",  "number", 0               ],
]);

oilsDb
	.insert({
		name : "Olive Oil",
		naoh_sap : 0.134,
		koh_sap : 0.188
	})
	.insert({
		name : "Olive Oil",
		naoh_sap : 0.134,
		koh_sap : 0.188
	})
	.insert({
		name : "Coconut Oil",
		naoh_sap : 0.183,
		koh_sap : "0.257"
	})
	.insert({
		name : "Palm Oil",
		naoh_sap : 0.142,
		koh_sap : 0.199
	})
	.insert({
		koh_sap : 0.199
	})
	.update({name: "Olive Oil"}, {koh_sap: 0.222})
	.delete({name: "Olive Oil"})
	.out();

// console.log(oilsDb.find({name:"Coconut Oil"}));