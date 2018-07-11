function Calculr(settings)
{
	var Calculr = {
		initialized: false,
		data: settings.data || {},
		tmp_data: settings.tmp_data || {},
		onUpdate: settings.onUpdate || null,
		addProps: function(props_obj){
			for ( var prop_name in props_obj ) {
				if ( props_obj.hasOwnProperty(prop_name) ) {
					addProp(prop_name, props_obj[prop_name], this.properties, null);
				}
			}
		},
		addMethods: function(methods){
			for ( var method_name in methods ) {
				if ( methods.hasOwnProperty(method_name) ) {
					console.log(method_name, methods[method_name]);
				}
			}
		},
		init: function(init_func){
			if ( this.initialized ) { return false; }
			for ( var prop_name in this.properties ) {
				if ( this.properties.hasOwnProperty(prop_name) ) {
					addCalculatorProperty(this.calculator, prop_name, this.properties[prop_name], this.data, this.tmp_data);
				}
			}
			this.initialized = true;
			if ( typeof init_func === 'function' ) {
				init_func(this);
			}
			return this;
		},
		properties: {},
		calculator: {}
	};

	/**
	 * @param {string} prop_name
	 * @param {*} prop_settings
	 * @param {object} self_obj
	 * @param {object} parent_obj
	 */
	function addProp(prop_name, prop_settings, self_obj, parent_obj) {
		switch ( typeof prop_settings ) {
			case 'string':
				prop_settings = {type:prop_settings};
				break;
			case 'function':
				prop_settings = {
					is_assignable: false,
					calculate: prop_settings
				};
				break;
			default: break;
		}
		var prop_validators = [];
		var prop_type = prop_settings.type || 'non-negative';

		// Set validators
		switch ( prop_type ) {
			case 'non-negative':
				prop_validators.push(function(val) {
					return val >= 0;
				});
				prop_type = 'number';
				break;
			default: break;
		}
		prop_validators.unshift(function(val){
			return typeof val === prop_type;
		});
		if ( Array.isArray(prop_settings.options) ) {
			prop_validators.push(function(val){
				return prop_settings.options.indexOf(val) >= 0;
			});
		}
		if ( typeof prop_settings.validate === 'function' ) {
			prop_validators.push(prop_settings.validate);
		}

		var prop_default = prop_settings.default || null;
		if ( prop_default === null ) {
			prop_default = {
				number: 0,
				'non-negative': 0,
				string: '',
				boolean: true,
				date: 'NOW()', //todo
				category: {},
				list: {}
			}[prop_type];
		}
		var prop_is_assignable =
			(typeof prop_settings.is_assignable !== 'undefined') ?
				prop_settings.is_assignable :
				true;
		var prop_is_tmp =
			(typeof prop_settings.is_tmp !== 'undefined') ?
				prop_settings.is_tmp :
				!prop_is_assignable;
		if ( ['category','list'].indexOf(prop_type) >= 0 ) {
			prop_is_assignable = false;
			prop_is_tmp = false;
		}
		// Assign "property" properties
		self_obj[prop_name] = {
			name: prop_name,
			type: prop_type,
//			options: prop_settings.options || null, // not needed later
			default: prop_default,
			validators: prop_validators,
			is_assignable: prop_is_assignable,
			is_tmp: prop_is_tmp, // todo: these will be initialized
			calculate: prop_settings.calculate || null,
			helper: {
				watch: function(watched){
					watchProp(this, watched);
				},
				sum:function(){},
				properties: Calculr.properties,
				self: self_obj,
				parent: parent_obj,
				methods:{/*custom methods*/}
			}
		};
		// Find children, recursively call addProp()
		if ( ['category','list'].indexOf(prop_type) >= 0 ) {
			self_obj[prop_name].properties = {};
			for ( var child_prop_name in prop_settings.properties ) {
				if ( prop_settings.properties.hasOwnProperty(child_prop_name) ) {
					addProp(child_prop_name, prop_settings.properties[child_prop_name], self_obj[prop_name].properties, self_obj);
				}
			}
		}
	}

	function watchProp(watcher, watched) {
		console.log(watcher, watched);
	}

	/**
	 * @param {object} calculator
	 * @param {string} prop_name
	 * @param {object} prop_settings
	 * @param {object} data
	 * @param {object} tmp_data
	 */
	function addCalculatorProperty(calculator, prop_name, prop_settings, data, tmp_data) {
		var prop_data = prop_settings.is_tmp ? tmp_data : data;

		if ( ['category','list'].indexOf(prop_settings.type) < 0 ) {
			Object.defineProperty(calculator, prop_name, {
				enumerable: true,
				configurable: true,
				get: function () {
					return prop_data[prop_name];
				},
				set: function (val) {
					// Check if property can be assigned
					if ( !prop_settings.is_assignable ) {
						console.log('This property cannot be assigned');
						return false;
					}
					// Check if value passes all validation
					if ( !prop_settings.validators.every(function (a) {return a(val)}) ) {
						console.log('invalid value');
						return false;
					}
					prop_data[prop_name] = val;
					// TODO: update all watchers
					Calculr.onUpdate(Calculr);
				}
			});

			if ( typeof prop_data[prop_name] === 'undefined' ) {
				prop_data[prop_name] = prop_settings.default;
			}
		} else {
			var child_calculator = calculator[prop_name] = {};
			var child_data = data[prop_name] = data[prop_name] || {};
			var child_tmp_data = tmp_data[prop_name] = tmp_data[prop_name] || {};

			switch ( prop_settings.type ) {
				case 'category':
					for ( var category_prop_name in prop_settings.properties ) {
						if ( prop_settings.properties.hasOwnProperty(category_prop_name) ) {
							var category_prop_settings = prop_settings.properties[category_prop_name];
							addCalculatorProperty(child_calculator, category_prop_name, category_prop_settings, child_data, child_tmp_data);
						}
					}
					break;
				case 'list':
					if ( Object.keys(child_data).length ) {
						for ( var list_item_key in child_data ) {
							if ( child_data.hasOwnProperty(list_item_key) ) {

								var item_data = child_data[list_item_key] = child_data[list_item_key] || {};
								var tmp_item_data = child_tmp_data[list_item_key] = child_tmp_data[list_item_key] || {};
								var item_calculator = child_calculator[list_item_key] = {};

								for ( var list_prop_name in prop_settings.properties ) {
									if ( prop_settings.properties.hasOwnProperty(list_prop_name) ) {
										//								console.log(list_prop_name, prop_name, list_item_key, prop_settings.properties[list_prop_name], item_data);
										addCalculatorProperty(item_calculator, list_prop_name, prop_settings.properties[list_prop_name], item_data, tmp_item_data);
									}
								}

							}
						}
					}
					break;
			}
		}
	}

	Calculr.addProps(settings.properties || {});
	Calculr.addMethods(settings.methods || {});

	return Calculr;
}