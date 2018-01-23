/*
TODOs:
- required fields
- type checking
- indexes
*/
var DataClass = function(name, args)
{

	/* private properties */

	var _TABLE = {},
		table_columns = {};


	/* private methods */

	function _load(name)
	{
		console.log(localStorage.getItem(name));
	}

	function _save()
	{
		
	}
	
	function _updateRow(inputs, row={})
	{
		_each(inputs, function(key, val) {
			if ( table_columns.hasOwnProperty(key) ) {
				row[key] = val;
			}
		});
		return row;
	}


	/* public methods */

	// public __construct()
	_load(name);
	if (args) {
		_each(args, function(i, colname) {
			table_columns[colname] = {};
		});
	}

	this.create = function(inputs)
	{
		var uid = create_uid(3,_TABLE);
		var row = _TABLE[uid] = _updateRow(inputs);
		return this;
	}

	this.update = function(where_obj, inputs)
	{
		_each(this.find(where_obj), function(uid, row) {
			row = _updateRow(inputs, row);
		});
		return this;
	}

	this.delete = function(where_obj)
	{
		if ( !_empty(where_obj) ) {
			_each(this.find(where_obj), function(uid, row) {
				if ( confirm("You are about to to delete "+JSON.stringify(row)) ) {
					delete _TABLE[uid];
				}
			});
		}
		return this;
	}

	this.find = function(where_obj=null)
	{
		var rows = {};
		if ( where_obj && !_empty(where_obj) ) {
			_each(_TABLE, function(uid, row) {
				var does_match = true;
				_each(where_obj, function(key, val) {
					if ( val != row[key] ) {
						does_match = false;
						return false;
					}
				});
				if ( does_match ) {
					rows[uid] = row;
				}
			});
		}
		return rows;
	}

	this.index = function(where_obj)
	{
		var indexes = [];
		_each(this.find(where_obj), function(uid, row) {
			indexes.push(uid);
		});
		return indexes;
	}

	this.out = function()
	{
		console.log( JSON.stringify(_TABLE, null, '\t') );
	}

};