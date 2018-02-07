// function Calculator(data, tmp_data, properties, after_update, list_name, list_id, dependencies, updaters)
function Calculator(args_obj)
{
	window.tmp_items = window.tmp_items || {};
	var data = args_obj.data || {},
		tmp_data = args_obj.tmp_data || {},
		parent_instance = args_obj.parent_instance || null,
		dependencies = window.dependencies = {},
		updaters = window.updaters = {},
		after_update = args_obj.after_update,
		list_name = args_obj.list_name || '',
		list_id = args_obj.list_id || '';

	if ( parent_instance ) {
		dependencies = parent_instance.dependencies;
		updaters = parent_instance.updaters;
	}

	var instance = {
		dependencies: dependencies,
		updaters: updaters
	};

	$.each(args_obj.methods, function(key, method) {
		if ( typeof method !== 'function' ) return new Error('\'methods.'+key+'\' is not a function.');
		Object.defineProperty(instance, key, { value: function() { method.apply(instance, arguments) }});
	});

	var instance_prefix =
		( list_name && list_id ) ?
			list_name + '[' + list_id + '].' : '';


	function recordDependenciesAndUpdaters(instance_prop_name, updateFunc) {
		var global_prop_name = instance_prefix + instance_prop_name;

		function addDependency(key) {
			dependencies[key] = dependencies[key] || [];
			if ( $.inArray(global_prop_name, dependencies[key]) < 0 )
				dependencies[key].push(global_prop_name);
		}

		// Pull out all dependencies
		updateFunc(function (arg_mixed) {
			// arg_mixed will be an array of keys or a single key
			// IF single, make it a single item array for the loop to work
			if ( !Array.isArray(arg_mixed) ) arg_mixed = [arg_mixed];
			// loop through arg_mixed array and record dependencies
			$.each(arg_mixed, function(i, val_str){
				// val_str syntax options: (ex.) 'lye_type', 'oils.weight', or 'this.oil_id'
				var tmp_arr = val_str.split('.');
				if ( tmp_arr.length > 1 ) { // IF (ex.) 'oils.weight' or 'this.oil_id'
					if ( tmp_arr[0] === 'this' ) {
						if ( instance_prefix ) {
							tmp_arr[0] = instance_prefix;
							addDependency(tmp_arr.join(''));
						} else throw new Error('\'list_name\' and \'list_id\' must be defined for '+val_str+'.');
					} else { // IF tmp_arr[0] is a list_name
						if ( data.hasOwnProperty(tmp_arr[0]) && typeof data[tmp_arr[0]] === 'object' ) {
							$.each(data[tmp_arr[0]], function(key) {
								addDependency(tmp_arr[0]+'['+key+']'+tmp_arr[1]);
							});
						} else throw new Error('\''+tmp_arr[0]+'\' is not found in data or is not an object.')
					}
				} else { // IF (ex.) 'lye_type'
					addDependency(val_str);
				}
			});
		});
		updaters[global_prop_name] = updateFunc;
	}

	function processRequired(required_mixed) {
		// if input is an array of keys
		if ( Array.isArray(required_mixed) ) {
			var result = 0;
			$.each(required_mixed, function(i, key) { result +=processRequired(key) });
			return result;
		} else {
			// check if 'this.property' or 'oils[abc].property'
			var sub_arr = required_mixed.split('.');
			if ( sub_arr.length > 1 ) { // is a list
				if ( sub_arr[0] === 'this' ) {
					if ( instance_prefix ) {
						sub_arr[0] = instance_prefix;
						//FIXME: this should not returning here
						return sub_arr.join('');
					} else throw new Error('\'list_name\' and \'list_id\' must be defined for '+required_mixed+'.');
				} else {
					var list_name = sub_arr[0],
						instance_prop_name = sub_arr[1];
					if ( data.hasOwnProperty(list_name) ) {
						result = 0;
						$.each(data[list_name], function(uid) {
							if ( data[list_name][uid].hasOwnProperty(instance_prop_name) ) {
								result += data[list_name][uid][instance_prop_name];
							} else if ( tmp_data[list_name][uid].hasOwnProperty(instance_prop_name) ) {
								result += tmp_data[list_name][uid][instance_prop_name];
							} else {
								throw new Error('Can\'t find property \''+instance_prop_name+'\' in '+list_name+' list.')
							}
						});
						return result;
					} else {
						throw new Error('Instance does not have a \''+list_name+'\' list.');
					}
				}
			} else if ( instance.hasOwnProperty(required_mixed) ) {
				return instance[required_mixed];
			} else {
				throw new Error('Cannot find \'' + required_mixed + '\' in instance');
			}
		}
	}

	function fireUpdater(key) {
		if (updaters.hasOwnProperty(key)) {
			var data_obj = data,
				tmp_data_obj = tmp_data,
				data_key = key;
			// check for lists
			var test = data_key.split('].');
			if ( test.length > 1 ) {
				var list_arr = test[0].split('[');
				var list = list_arr[0];
				var list_key = list_arr[1];
				data_obj = data_obj[list][list_key];
				tmp_data_obj = tmp_data_obj[list][list_key];
				data_key = test[1];
			}
			var result = updaters[key](processRequired);
			console.log(key, updaters[key]);
			if (data_obj.hasOwnProperty(data_key)) {
				data_obj[data_key] = result;
			} else if (tmp_data_obj.hasOwnProperty(data_key)) {
				tmp_data_obj[data_key] = result;
			}
		} else {
			throw new Error('No updater exists for \''+key+'\'');
		}
	}

	function updateDependentPropsOf(key) {
		key = instance_prefix+key;
		if ( dependencies.hasOwnProperty(key) ) {
			var new_dependencies = [];
			$.each(dependencies[key], function (i, dep_key) {
				var tmp_arr = dep_key.split('.');
				if ( tmp_arr.length > 1 && tmp_arr[0] === 'this' ) {
					if ( !instance_prefix ) throw new Error('\'list_name\' and \'list_id\' must be defined for '+dep_key);
					tmp_arr[0] = instance_prefix;
					dep_key = tmp_arr.join('');
				}
				fireUpdater(dep_key);
				new_dependencies.push(dep_key);
			});
			$.each(new_dependencies, function (i, dep_key) {
				updateDependentPropsOf(dep_key);
			});
		}
	}

	Object.defineProperties(instance, {
		updateDependentPropsOf: { value: updateDependentPropsOf }
	});

	$.each(args_obj.props, function(instance_prop_name, prop_options)
	{
		if ( typeof prop_options !== 'object' ) throw new Error('Options must be an object.');

		// IF prop_options has an .update property that is a function
		if ( prop_options.update !== undefined ) {
			if ( typeof prop_options.update !== 'function' ) return 'Option \'update\' must be a function.';
			else recordDependenciesAndUpdaters(instance_prop_name, prop_options.update);
		}

		var data_obj = ( prop_options.hasOwnProperty('is_tmp') && prop_options.is_tmp ) ? tmp_data : data;

		if ( instance_prefix ) {
			if ( !data_obj.hasOwnProperty(list_name) || !data_obj[list_name].hasOwnProperty(list_id) )
				throw new Error('Cannot find \''+list_name+'['+list_id+']\' in data object');
			data_obj = data_obj[list_name][list_id];
		}

		Object.defineProperty(instance, instance_prop_name, { configurable: false, enumerable: true,
			get: function() {
				if ( data_obj.hasOwnProperty(instance_prop_name) && data_obj[instance_prop_name] !== undefined ) return data_obj[instance_prop_name];
				else if ( prop_options.hasOwnProperty('is_string') && prop_options.is_string ) return '';
				else return 0;
			},
			set: function(val) { // what to do when property is set (ex. instance.name = 'foo')
				if ( prop_options.hasOwnProperty('set') ) {
					if ( prop_options.set === false ) return false;
					else if ( typeof prop_options.set === 'function' ) {
						var result = prop_options.set(val);
						if ( result === false ) return false;
						else data_obj[instance_prop_name] = result;
					} else throw new Error('\'set\' option must be a function or BOOL(false)');
				} else { // IF no .set() property, do this by default
					if ( prop_options.hasOwnProperty('is_string') && prop_options.is_string ) val+=''; // force type to string
					else if ( isNaN(val/=1) ) return 'Assigned value must be a number.'; // force type to number and error is NaN
					data_obj[instance_prop_name] = val; // if above did not error, assign the value to the data object
				}
				updateDependentPropsOf(instance_prop_name);
				// IF caller defined a final function (like a save or output),
				// call the function every time value is successfully set
				if ( after_update !== undefined && typeof after_update === 'function' )
					after_update.apply(this, []);
			}
		});

		// set default value
		if ( data_obj[instance_prop_name] === undefined ) {
			if ( prop_options.default !== undefined ) {
				data_obj[instance_prop_name] = prop_options.default;
			} else {
				data_obj[instance_prop_name] =
					(prop_options.is_string) ?
						'' : 0;
			}
		}
	});

	if ( args_obj.hasOwnProperty('init') ) {
		if ( typeof args_obj.init !== 'function' ) throw new Error('init must be a function');
		args_obj.init.apply(instance, []);
	}

	return instance;
}
