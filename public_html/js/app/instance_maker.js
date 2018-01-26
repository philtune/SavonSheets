var instance_maker = {

	global_dependencies: {},

	global_updaters: {},

	create: function(data, tmp_data, properties, finally_func, list_name, list_id)
	{
		var instance = {},
			dependencies = window.dependencies = instance_maker.global_dependencies,
			updaters = window.updaters = instance_maker.global_updaters,
			instance_prefix =
				( list_name !== undefined && list_id !== undefined ) ?
					list_name + '[' + list_id + '].' : '';

		function countAll(list_name, instance_prop_name) {
			if ( data.hasOwnProperty(list_name) ) {
				var result = 0;
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

		function processRequired(req_key) {
			if ( Array.isArray(req_key) ) {
				var result = 0;
				$.each(req_key, function() { result +=processRequired(this) });
				return result;
			} else {
				var sub_arr = req_key.split('.');
				if ( sub_arr.length > 1 && sub_arr[0] !== 'this' ) {
					// console.log('Sub Array: ',sub_arr);
					return countAll(sub_arr[0], sub_arr[1]);
				} else if ( instance.hasOwnProperty(req_key) ) {
					return instance[req_key];
				} else {
					throw new Error('Cannot find \'' + req_key + '\' in instance');
				}
			}
		}



		function recordDependenciesAndUpdaters(instance_prop_name, updateFunc) {
			var global_prop_name = instance_prefix + instance_prop_name;

			function addDependency(key) {
				dependencies[key] = dependencies[key] || [];
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
		function thisKeyCheck(key) {
			var tmp_arr = key.split('.');
			if ( tmp_arr.length > 1 && tmp_arr[0] === 'this' ) {
				if ( !instance_prefix ) throw new Error('\'list_name\' and \'list_id\' must be defined for '+key);
				tmp_arr[0] = instance_prefix;
				key = tmp_arr.join('');
			}
			return key;
		}

		function updateDependentProps(key) {
			key = instance_prefix+key;
			if ( dependencies.hasOwnProperty(key) ) {
				var new_dependencies = [];
				// console.log(key, dependencies[key]);
				$.each(dependencies[key], function (i, dep_key) {
					dep_key = thisKeyCheck(dep_key);
					if (updaters.hasOwnProperty(dep_key)) {
						// console.log('Updater: ', updaters[dep_key]);
						var result = updaters[dep_key](processRequired);
						// console.log(instance[dep_key], dep_key, result);
						if (data.hasOwnProperty(dep_key))
							data[dep_key] = result;
						else if (tmp_data.hasOwnProperty(dep_key))
							tmp_data[dep_key] = result;
						new_dependencies.push(dep_key);
					} else {
						throw new Error('No updater exists for \''+dep_key+'\'');
					}
				});
				$.each(new_dependencies, function (i, dep_key) {
					updateDependentProps(dep_key);
				});
			}
		}

		$.each(properties, function(instance_prop_name, options)
		{
			// IF options is a function, just return that function (like .add(), .delete()...)
			if ( typeof options === 'function' ) Object.defineProperty(instance, instance_prop_name, { configurable: false, enumerable: false, value: options });
			else { // OTHERWISE process the options
				// IF options has an .update property that is a function
				if ( options.hasOwnProperty('update') ) {
					if ( typeof options.update !== 'function' ) return 'Option \'update\' must be a function.';
					else recordDependenciesAndUpdaters(instance_prop_name, options.update);
				}

				var data_obj =
					( options.hasOwnProperty('is_tmp') && typeof options.is_tmp ) ?
						tmp_data : data;

				if ( list_name !== undefined && list_id !== undefined ) {
					if ( !data_obj.hasOwnProperty(list_name) || !data_obj[list_name].hasOwnProperty(list_id) )
						throw new Error('Cannot find \''+list_name+'['+list_id+']\' in data object');
					data_obj = data_obj[list_name][list_id];
				}

				Object.defineProperty(instance, instance_prop_name, { configurable: false, enumerable: true,
					get: function() {
						if ( data_obj.hasOwnProperty(instance_prop_name) && data_obj[instance_prop_name] !== undefined ) return data_obj[instance_prop_name];
						else if ( options.hasOwnProperty('is_string') && options.is_string ) return '';
						else return 0;
					},
					set: function(val) { // what to do when property is set (ex. instance.name = 'foo')
						if ( options.hasOwnProperty('set') ) {
							if ( options.set === false ) return false;
							else if ( typeof options.set === 'function' ) {
								var result = options.set(val);
								if ( result === false ) return false;
								else data_obj[instance_prop_name] = result;
							} else throw new Error('\'set\' option must be a function or BOOL(false)');
						} else { // IF no .set() property, do this by default
							if ( options.hasOwnProperty('is_string') && options.is_string ) val+=''; // force type to string
							else if ( isNaN(val/=1) ) return 'Assigned value must be a number.'; // force type to number and error is NaN
							data_obj[instance_prop_name] = val; // if above did not error, assign the value to the data object
						}
						updateDependentProps(instance_prop_name);
						// IF caller defined a final function (like a save or output),
						// call the function every time value is successfully set
						if ( finally_func !== undefined && typeof finally_func === 'function' ) finally_func();
					}
				});
			}
		});

		return instance;
	}

};