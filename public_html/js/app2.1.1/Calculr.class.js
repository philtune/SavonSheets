/**
 * @param {object} config
 * @returns {{initialized: boolean, data: (*|{}), tmp_data: ({}|tmp_data), properties: {}, calculator: {}, classes: {}, onUpdate: onUpdate, addProps: addProps, addMethods: addMethods, init: init}}
 * @constructor
 */
function Calculr(config)
{
	var Calculr = {
		initialized: false, //fixme: take out of Calculr object
		data: config.data || {}, //fixme: take out of Calculr object
		tmp_data: config.tmp_data || {}, //fixme: take out of Calculr object
		properties: {}, //fixme: take out of Calculr object
		calculator: {}, //fixme: take out of Calculr object
		classes: {}, //fixme: take out of Calculr object
		onUpdate: function() { //fixme: take out of Calculr object
			if ( typeof config.onUpdate !== 'undefined' ) {
				config.onUpdate.apply(this, arguments);
			}
		},
		addProps: function(props_obj){
			$.each(props_obj, function(prop_name, prop_config){
				buildCalculrProperty(prop_name, prop_config, Calculr.properties, null);
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
			// Add watch_list to calculator properties AFTER entire calculator has been built
			$.each(Calculr.properties, buildCalculrPropertyWatchers);
			// TODO: Initialize all temporary calculator properties
			// Run custom initialization code
			if ( typeof init_func === 'function' ) {
				init_func(this);
			}
			this.initialized = true;
			return this;
		}
	};

	function buildCalculrPropertyWatchers(prop_name, property){
		switch ( property.type ) {
			case 'category':
				$.each(property.children, buildCalculrPropertyWatchers);
				break;
			case 'list':
				break;
			default:
				if ( typeof property.calculate === 'function' ) {
					property.calculate({
						watch: function(val){
							watch(val);
							function watch(val){
								if ( typeof val === 'string' ) {
									var watch_arr = val.split('.');
									var watched_obj = property.siblings;
									if ( watch_arr[0] === 'root' ) {
										watched_obj = Calculr.properties;
										watch_arr.shift();
									} else if ( watch_arr[0] === 'parent' ) {
										watched_obj = property.parent;
										watch_arr.shift();
									}
									$.each(watch_arr, function(i, key){
										if ( key === 'parent' ) {
											watched_obj = watched_obj.parent();
										} else if ( watched_obj.type === 'category' ) {
											watched_obj = watched_obj.children[key];
										} else {
											watched_obj = watched_obj[key];
										}
									});
									watched_obj.watchers.push(property);
								} else if ( Array.isArray(val) ) {
									$.each(val, function(i,val){
										watch(val);
									})
								}
							}
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
				break;
		}
	}

	/**
	 * @param {string} prop_name
	 * @param {*} prop_config
	 * @param {object} sibling_properties
	 * @param {object} parent_property
	 */
	function buildCalculrProperty(prop_name, prop_config, sibling_properties, parent_property) {
		switch ( typeof prop_config ) {
			case 'string':
				prop_config = {type:prop_config};
				break;
			case 'function':
				prop_config = {
					is_assignable: false,
					calculate: prop_config
				};
				break;
			default: break;
		}
		var prop_validators = [];
		var prop_type = prop_config.type || 'non-negative';

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
		if ( Array.isArray(prop_config.options) ) {
			prop_validators.push(function(val){
				return prop_config.options.indexOf(val) >= 0;
			});
		}
		if ( typeof prop_config.validate === 'function' ) {
			prop_validators.push(prop_config.validate);
		}

		var prop_default = prop_config.default || null;
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
			(typeof prop_config.is_assignable !== 'undefined') ?
				prop_config.is_assignable :
				true;
		var prop_is_tmp =
			(typeof prop_config.is_tmp !== 'undefined') ?
				prop_config.is_tmp :
				!prop_is_assignable;
		if ( ['category','list'].indexOf(prop_type) >= 0 ) {
			prop_is_assignable = false;
			prop_is_tmp = false;
		}

		var prop_classes = prop_config.class || [];
		if ( typeof prop_classes === 'string' ) {
			prop_classes = prop_classes.split(' ');
		}

		// Assign property settings
		var self_property = sibling_properties[prop_name] = {
			name: prop_name,
			type: prop_type,
//			options: prop_settings.options || null, // not needed later
			default: prop_default,
			validators: prop_validators,
			is_assignable: prop_is_assignable,
			is_tmp: prop_is_tmp, // todo: these will be initialized
			calculate: prop_config.calculate || null,
			classes: prop_classes,
			parent: parent_property,
			siblings: sibling_properties,
//			methods:{/*custom methods*/},
			watchers: [],
			children: {}
		};
		// Find children, recursively call buildCalculrProperty()
		if ( ['category','list'].indexOf(prop_type) >= 0 ) {
			$.each(prop_config.children, function(child_prop_name, child_prop_config){
				buildCalculrProperty(child_prop_name, child_prop_config, self_property.children, sibling_properties);
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
					$.each(prop_settings.children, function(prop_name, prop_settings){
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
						$.each(prop_settings.children, function(prop_name, prop_settings){
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

	Calculr.addProps(config.properties || {});
	Calculr.addMethods(config.methods || {});

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
