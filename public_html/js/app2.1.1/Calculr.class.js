function Calculr(settings)
{
	var Calculr = {
		initialized: false,
		data: settings.data || {},
		tmp_data: settings.tmp_data || {},
		onUpdate: settings.onUpdate || null,
		properties: {},
		calculator: {},
		addProps: function(props_obj){
			$.each(props_obj, function(prop_name, prop_settings){
				addProp(prop_name, prop_settings, Calculr.properties, null);
			});
		},
		addMethods: function(methods){
			$.each(methods, function(method_name, method){
				console.log(method_name, methods[method_name]);
			});
		},
		init: function(init_func){
			if ( this.initialized ) { return false; }
			$.each(Calculr.properties, function(prop_name, prop_settings){
				addCalculatorProperty(Calculr.calculator, prop_name, prop_settings, Calculr.data, Calculr.tmp_data);
			});
			this.initialized = true;
			if ( typeof init_func === 'function' ) {
				init_func(this);
			}
			return this;
		}
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
		// Assign property settings
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
			var child_self_obj = self_obj[prop_name].properties = {};
			$.each(prop_settings.properties, function(child_prop_name, child_prop_settings){
				addProp(child_prop_name, child_prop_settings, child_self_obj, self_obj);
			});
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

		// IF property type isn't "category" or "list"...
		if ( ['category','list'].indexOf(prop_settings.type) < 0 ) {
			// Define getter and setter for property in the calculator
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
		} else { // IF property type is "category" or "list"
			var child_calculator = calculator[prop_name] = {};
			var child_data = data[prop_name] = data[prop_name] || {};
			var tmp_child_data = tmp_data[prop_name] = tmp_data[prop_name] || {};

			switch ( prop_settings.type ) {
				case 'category':
					// FOR each child property...
					$.each(prop_settings.properties, function(prop_name, prop_settings){
						addCalculatorProperty(child_calculator, prop_name, prop_settings, child_data, tmp_child_data);
					});
					break;
				case 'list':
					var array_calculator = child_calculator.array = {};
					var array_data = child_data;
					var tmp_array_data = tmp_child_data;

					// FOR each data item that may exist on init...
					$.each(array_data, function(uid, array_item_data){
						addArrayItem(array_calculator, uid, array_data, tmp_array_data);
					});

					child_calculator.add = function(uid){
						// FIXME: uid should be generated, not passed
						addArrayItem(array_calculator, uid, array_data, tmp_array_data);
						Calculr.onUpdate(Calculr);
					};

					child_calculator.delete = function(uid){
						//todo
					};

					function addArrayItem(array_calculator, uid, array_data, tmp_array_data){
						var array_item_calculator = array_calculator[uid] = {};
						var data = array_data[uid] = {};
						var tmp_data = tmp_array_data[uid] = tmp_array_data[uid] || {};
						$.each(prop_settings.properties, function(prop_name, prop_settings){
							addCalculatorProperty(array_item_calculator, prop_name, prop_settings, data, tmp_data);
						});
					}
					break;
			}
		}
	}

	Calculr.addProps(settings.properties || {});
	Calculr.addMethods(settings.methods || {});

	return Calculr;
}