function Calculr(settings)
{
	var Calculr = {
		initialized: false,
		data: settings.data || {}, //fixme: take out of Calculr object
		tmp_data: settings.tmp_data || {}, //fixme: take out of Calculr object
		properties: {}, //fixme: take out of Calculr object
		calculator: {}, //fixme: take out of Calculr object
		classes: {}, //fixme: take out of Calculr object
		onUpdate: function() {
			if ( typeof settings.onUpdate !== 'undefined' ) {
				settings.onUpdate.apply(this, arguments);
			}
		},
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
			// Can only init() once
			if ( this.initialized ) { return false; }
			// Build the calculator
			$.each(Calculr.properties, function(prop_name, prop_settings){
				addCalculatorProperty(Calculr.calculator, prop_name, prop_settings, Calculr.data, Calculr.tmp_data);
			});
			// TODO: Add watch_list to calculator properties AFTER entire calculator has been built
			$.each(Calculr.properties, addWatchList);
			// TODO: Initialize all temporary calculator properties
			// Run custom initialization code
			if ( typeof init_func === 'function' ) {
				init_func(this);
			}
			this.initialized = true;
			return this;
		}
	};

	function watchProp(watcher, watched) {
		console.log(watcher, watched);
	}

	function addWatchList(prop_name, prop_settings){
		console.log('"'+prop_name+'"', prop_settings);
		if ( typeof prop_settings.calculate === 'function' ) {
			prop_settings.calculate({
				watch: function(val){
					function watch(val){
						if ( typeof val === 'string' ) {
							var arr = val.split('.');
							var result = prop_settings.self;
							if ( arr[0] === 'root' ) {
								result = Calculr.properties;
								arr.shift();
							}
							$.each(arr, function(i, key){
								console.log(prop_settings.self); //FIXME!!!!!!!!!!!!!!
								result = key === 'parent' ? result.parent() : result[key];
							});
							console.log(arr, result);
						} else if ( Array.isArray(val) ) {
							$.each(val, function(i,val){
								watch(val);
							})
						}
					}
					console.log('watch-->');
					watch(val);
					return this;
				},
				ignore: function(val){
					console.log('ignore-->', val);
					return this;
				},
				sum:function(){return this},
				round:function(){return this}
			});
		}
		if ( ['category', 'list'].indexOf(prop_settings.type) >= 0 ) {
			$.each(prop_settings.properties, addWatchList);
		}
	}

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

		var prop_classes = prop_settings.class || [];
		if ( typeof prop_classes === 'string' ) {
			prop_classes = prop_classes.split(' ');
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
			classes: prop_classes,
			parent: parent_obj,
			self: self_obj,
			methods:{/*custom methods*/}
		};
		// Find children, recursively call addProp()
		if ( ['category','list'].indexOf(prop_type) >= 0 ) {
			var child_self_obj = self_obj[prop_name].properties = {};
			$.each(prop_settings.properties, function(child_prop_name, child_prop_settings){
				addProp(child_prop_name, child_prop_settings, child_self_obj, self_obj);
			});
		}
	}

	/**
	 * @param {object} calculator
	 * @param {string} prop_name
	 * @param {object} prop_settings
	 * @param {object} data
	 * @param {object} tmp_data
	 */
	function addCalculatorProperty(calculator, prop_name, prop_settings, data, tmp_data) {
		// Is property data stored or just temporary?
		var prop_data = prop_settings.is_tmp ? tmp_data : data;
		var child_calculator = calculator[prop_name] = {};
		Object.defineProperty(child_calculator, 'parent', {
			configurable: false,
			value: function(){
				return calculator;
			}
		});

		// IF property type isn't "category" or "list"...
		if ( ['category','list'].indexOf(prop_settings.type) < 0 ) {
			Object.defineProperties(child_calculator, {
				val: {
					configurable: false,
					value: function () {
						if ( arguments.length ) {
							var val = arguments[0];
							// Check if property can be assigned
							if ( !prop_settings.is_assignable ) {
								console.log('This property cannot be assigned');
								return false;
							}
							this.update(val);
							// TODO: update all watchers
							Calculr.onUpdate(Calculr);
							return this;
						}
						return prop_data[prop_name];
					}
				},
				update: {
					configurable: false,
					value: function(val) {
						// Check if value passes all validation
						if ( !prop_settings.validators.every(function (a) {return a(val)}) ) {
							console.log('invalid value');
							return false;
						}
						prop_data[prop_name] = val;
					}
				}
			});

			$.each(prop_settings.classes, function(i, prop_class){
				Calculr.classes[prop_class] = Calculr.classes[prop_class] || [];
				Calculr.classes[prop_class].push(child_calculator);
			});

			if ( typeof prop_data[prop_name] === 'undefined' ) {
				prop_data[prop_name] = prop_settings.default;
			}
		} else { // IF property type is "category" or "list"
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

					Object.defineProperty(array_calculator, 'parent', {
						configurable: false,
						value: function(){
							return child_calculator;
						}
					});

					// FOR each data item that may exist on init...
					$.each(array_data, function(uid){
						addArrayItem(array_calculator, uid, array_data, tmp_array_data);
					});

					Object.defineProperty(child_calculator, 'add', {
						configurable: false,
						value: function () {
							var item = addArrayItem(array_calculator, create_uid(3, array_data), array_data, tmp_array_data);
							Calculr.onUpdate(Calculr);
							return item;
						}
					});

					function addArrayItem(array_calculator, uid, array_data, tmp_array_data){
						var array_item_calculator = array_calculator[uid] = {};
						var data = array_data[uid] = array_data[uid] || {};
						var tmp_data = tmp_array_data[uid] = tmp_array_data[uid] || {};
						$.each(prop_settings.properties, function(prop_name, prop_settings){
							if ( ['delete','parent'].indexOf(prop_name) >= 0 ) {
								console.log("'"+prop_name+"' is a protected method name");
								return true;
							}
							addCalculatorProperty(array_item_calculator, prop_name, prop_settings, data, tmp_data);
						});
						Object.defineProperties(array_item_calculator, {
							delete: {
								configurable: false,
								value: function(){
									delete array_data[uid];
									delete tmp_array_data[uid];
									delete array_calculator[uid];
									Calculr.onUpdate(Calculr);
									return array_calculator;
								}
							},
							parent: {
								configurable: false,
								value: function(){
									return array_calculator;
								}
							}
						});
						return array_item_calculator;
					}
					break;
			}
		}
	}

	Calculr.addProps(settings.properties || {});
	Calculr.addMethods(settings.methods || {});

	return Calculr;

	function create_uid(size, compare_obj) {
		compare_obj = compare_obj || {};
		var uid = '';
		do {
			uid = (Array(size+1).join("0") + ((Math.random() * Math.pow(36,size)) | 0).toString(36)).slice(-size);
		} while ( compare_obj.hasOwnProperty(uid) );
		return uid;
	}
}
