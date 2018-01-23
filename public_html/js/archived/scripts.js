/*

TODOs:
x Save to localstorage
x Load from localstorage
_ API to save/load specific data
_ Handle corrupt data

*/
(function() {

	var data,
		url_vars = getUrlVars(),
		view = url_vars.view || '',
		id = url_vars.id || create_uid(3),
		database = {
			set : function(name, value)
			{
				return localStorage.setItem(name, value);
			},
			get : function(name)
			{
				return localStorage.getItem(name);
			},
			getTable : function(table_name)
			{
				var stored_obj = localStorage,
					return_arr = [];

				for ( i in stored_obj ) {
					var row_str = stored_obj[i];
					if ( i.startsWith(table_name+'[') && i.endsWith(']') ) {
						var id = i.substring(table_name.length+1, i.length-1);
						return_arr[id] = row_str;
					}
				}
				return return_arr;
			}
		};

	var tmp_data = {
		formula: {
			total_weight: 100,
			total_percent: 1,
			rows: {
				"78c": {
					oil_id: "ihw",
					weight: 75,
					percent: 0.75,
					position: 1
				},
				"92b": {
					oil_id: "p5e",
					weight: 25,
					percent: 0.25,
					position: 0
				},
				"b18": {
					oil_id: "p99",
					weight: 25,
					percent: 0.25,
					position: 3
				},
				"emw": {
					oil_id: "ab2",
					weight: 25,
					percent: 0.25,
					position: 2
				}
			}
		}
	};

	window.app = app = {
		init : function()
		{
			data = {};
			switch ( view.toLowerCase() ) {
				case "formula":
					app.formula.init();
					break;
			}

			// this.output();
		},

		output : function()
		{
			$('#output').text(JSON.stringify(data, null, '\t'));
		},

		save : function()
		{
			// this.output();
			// database.set(storage_var, JSON.stringify(data));
			return data;
		},

		formula : {
			init : function()
			{
				data.formula = {
					total_weight : 0,
					total_percent : 1,
					rows : {},
					created : (new Date).toJSON()
				};
				if ( stored_data = database.get('formula['+id+']') ) {
					Object.assign(data.formula, JSON.parse(stored_data));
				}
				this.output();
			},
			save : function()
			{
				if ( view === "formula" ) {
					data.formula.updated = (new Date).toJSON();
					database.set('formula['+id+']', JSON.stringify(data.formula));
				}
				this.output();
				return data.formula;
			},
			output :function()
			{
				$('#output').text(JSON.stringify(data.formula, null, '\t'));
			},
			row : function(row_key)
			{
				if ( row_key === undefined ) throw 'Missing row key';
				if ( !data.formula.rows.hasOwnProperty(row_key) )
					throw 'Row key "'+row_key+'" does not exist';

				var this_row = data.formula.rows[row_key];
				return {
					oil_id : function(oil_id)
					{
						if ( oil_id === undefined ) return this_row.oil_id;
						else {
							if ( typeof oil_id !== "string" )
								throw 'Argument must be a string';
							this_row.oil_id = oil_id;
							app.formula.save();
							return this;
						}
					},
					weight : function(weight)
					{
						if ( weight === undefined ) return this_row.weight;
						else {
							if ( typeof weight !== "number" || weight < 0 )
								throw 'Argument must be an number >= 0';

							// Update row data
							this_row.weight = weight;

							// Calculate total_weight
							var total_weight = 0;
							app.formula._foreachRow(function(i,row){
								total_weight += row.weight;
							});

							// Update data.formula.total_weight
							data.formula.total_weight = total_weight;

							// Update all rows' percent
							app.formula._foreachRow(function(i,row){
								row.percent = row.weight/total_weight;
							});

							app.formula.save();
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
							this_row.weight = data.formula.total_weight * percent;

							// Update data.formula.total_percent
							var total_percent = 0;
							app.formula._foreachRow(function(i,row){
								total_percent += row.percent;
							});
							data.formula.total_percent = total_percent;

							app.formula.save();
							return this;
						}
					},
					position : function(position)
					{
						if ( position === undefined ) return this_row.position;
						else {
							if ( typeof position !== "number" || position < 0 || position >= app.formula._countRows() )
								throw 'Argument must be an number >= 0 and <= row count';

							app.formula._foreachRow(function(i,row){
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

							app.formula.save();
							return this;
						}
					},
					end : function()
					{
						return app.formula;
					}
				}
			},
			addRow : function(oil_id, weight, percent, position)
			{
				var oil_id = oil_id || null,
					weight = weight || 0,
					percent = percent || 0,
					position = ( position !== undefined ) ? position : app.formula._countRows();

				// Add row to data object
				var row_key = create_uid(3, data.formula);
				data.formula.rows[row_key] = {
					oil_id: oil_id,
					weight: weight,
					percent: percent,
					position: position
				};

				this.save();
				return this.row(row_key);
			},
			total_weight : function(total_weight)
			{
				if ( total_weight === undefined ) return data.formula.total_weight;
				else {
					if ( typeof total_weight !== "number" || total_weight < 0 )
						throw 'Argument must be an number >= 0';

					// Update data.formula.total_weight
					data.formula.total_weight = total_weight;

					// Update all rows' weight
					app.formula._foreachRow(function(i,row){
						row.weight = total_weight * row.percent;
					});

					this.save();
					return this;
				}
			},
			_countRows : function()
			{
				return Object.keys(data.formula.rows).length;
			},
			_orderRows : function()
			{
				var ordered = [];
				app.formula._foreachRow(function(i,row){
					ordered[row.position] = i;
				});
				return ordered;
			},
			_foreachRow : function(func) {
				for(i in data.formula.rows) {
					func(i,data.formula.rows[i]);
				}
			},
		},

		getAll : function(table_name)
		{
			return database.getTable(table_name);
		}
	};
})();

app.init();
formula = app.formula;