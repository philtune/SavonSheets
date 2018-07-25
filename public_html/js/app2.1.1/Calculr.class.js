/**
 *
 * @param {object} config
 * @returns {{initialized: boolean, data: (*|{}), tmp_data: ({}|tmp_data), fields: {}, calculator: {}, classes: {}, onUpdate: onUpdate, addField: (function(*=, *=): Calculr), addFields: (function(*=): Calculr), addMethod: (function(*=, *=): Calculr), addMethods: (function(*=): Calculr), init: (function(*=): Calculr)}}
 * @constructor
 */
function Calculr(config)
{
	// TODO: make sure all calculator fields are not writable or configurable
	var instance_data = config.data || {};
	window.Calculr_data = instance_data;
	var instance_tmp_data = config.tmp_data || {};
	window.Calculr_data = instance_tmp_data;

	var Calculr = {
		initialized: false, //fixme: take out of Calculr object
		data: config.data || {}, //fixme: take out of Calculr object
		tmp_data: config.tmp_data || {}, //fixme: take out of Calculr object
		fields: {}, //fixme: take out of Calculr object
		calculator: {}, //fixme: take out of Calculr object
		classes: {}, //fixme: take out of Calculr object
		onUpdate: function() { //fixme: take out of Calculr object
			if ( typeof config.onUpdate !== 'undefined' ) {
				config.onUpdate.apply(this, arguments);
			}
		},
		addField: function(field_name, field_config){
			if ( Calculr.initialized ) {
				throw new Error('Cannot add fields after Calculr instance is initialized.');
			}
			buildFieldSettings(field_name, field_config, Calculr.fields, null);
			return this;
		},
		addFields: function(fields_obj){
			if ( Calculr.initialized ) {
				throw new Error('Cannot add fields after Calculr instance is initialized.');
			}
			$.each(fields_obj, function(field_name, field_config){
				Calculr.addField(field_name, field_config);
			});
			return this;
		},
		addMethod: function(method_name, method){
			if ( Calculr.initialized ) {
				console.error('Cannot add methods after Calculr instance is initialized.');
			}
			console.log(method_name, method);
			//TODO
			return this;
		},
		addMethods: function(methods){
			if ( Calculr.initialized ) {
				throw new Error('Cannot add methods after Calculr instance is initialized.');
			}
			$.each(methods, function(method_name, method){
				Calculr.addMethod(method_name, method);
			});
			return this;
		},
		init: function(init_func){
			// Can only init() once
			if ( Calculr.initialized ) {
				throw new Error('Calculr instance has already been initialized.');
			}
			// Build the calculator
			$.each(Calculr.fields, function(field_name, field_settings){
				buildFieldCalculator(Calculr.calculator, field_name, field_settings, instance_data, Calculr.tmp_data);
			});
			// Add watch_list to calculator fields AFTER entire calculator has been built
			$.each(Calculr.fields, buildFieldWatchers);
			// TODO: Initialize all temporary calculator fields
			// Run custom initialization code
			if ( typeof init_func === 'function' ) {
				init_func(this);
			}
			this.initialized = true;
			return this;
		}
	};

	/**
	 * @param {string} field_name
	 * @param {*} field_config
	 * @param {object} sibling_fields
	 * @param {object} parent_field
	 */
	function buildFieldSettings(field_name, field_config, sibling_fields, parent_field) {
		switch ( typeof field_config ) {
			case 'string':
				field_config = {type:field_config};
				break;
			case 'function':
				field_config = {
					is_assignable: false,
					calculate: field_config
				};
				break;
			default: break;
		}
		var field_type = field_config.type || 'non-negative';

		var field_is_assignable =
			(typeof field_config.is_assignable !== 'undefined') ?
				field_config.is_assignable :
				true;
		var field_is_tmp =
			(typeof field_config.is_tmp !== 'undefined') ?
				field_config.is_tmp :
				!field_is_assignable;
		if ( ['category','iterable'].indexOf(field_type) >= 0 ) {
			field_is_assignable = false;
			field_is_tmp = false;
		}

		// Start building field settings
		var field_settings = sibling_fields[field_name] = {
			name: field_name,
			type: field_type,
			is_assignable: field_is_assignable,
			is_tmp: field_is_tmp,
			parent: parent_field,
			siblings: sibling_fields
		};

		// Find fields, recursively call buildFieldSettings()
		if ( ['category','iterable'].indexOf(field_type) >= 0 ) {
			field_settings.fields = {};
			$.each(field_config.fields, function(child_field_name, child_field_config){
				buildFieldSettings(child_field_name, child_field_config, field_settings.fields, sibling_fields);
			});
		} else {
			var field_classes = field_config.class || [];
			if ( typeof field_classes === 'string' ) {
				field_classes = field_classes.split(' ');
			}

			var field_default = field_config.default || null;
			if ( field_default === null ) {
				field_default = {
					'number': 0,
					'non-negative': 0,
					'string': '',
					'boolean': true,
					'date': 'NOW()', //todo
					'category': {},
					'iterable': {}
				}[field_type];
			}

			// Set validators
			var field_validators = [];
			switch ( field_type ) {
				case 'non-negative':
					field_validators.push(function(val) {
						return val >= 0;
					});
					field_type = 'number';
					break;
				default: break;
			}
			field_validators.unshift(function(val){
				return typeof val === field_type;
			});
			if ( Array.isArray(field_config.options) ) {
				field_validators.push(function(val){
					return field_config.options.indexOf(val) >= 0;
				});
			}
			if ( typeof field_config.validate === 'function' ) {
				field_validators.push(field_config.validate);
			}

			field_settings.classes = field_classes;
			field_settings.watchers = [];
			field_settings.sum_watchers = [];
			field_settings.calculate = field_config.calculate || null;
			field_settings.default = field_default;
			field_settings.validators = field_validators;
		}
	}

	/**
	 * @param {string} field_name
	 * @param {object} field_settings
	 */
	function buildFieldWatchers(field_name, field_settings){
		if ( ['category', 'iterable'].indexOf(field_settings.type) >= 0 ) {
			$.each(field_settings.fields, buildFieldWatchers);
		} else if ( typeof field_settings.calculate === 'function' ) {
			/**
			 * @param {array} watch_arr
			 * @returns {Object|siblings}
			 */
			function getWatchedField(watch_arr){
				var watched_field = field_settings.siblings;
				if ( watch_arr[0] === 'root' ) {
					watched_field = Calculr.fields;
					watch_arr.shift();
				} else if ( watch_arr[0] === 'parent' ) {
					watched_field = field_settings.parent;
					watch_arr.shift();
				}
				$.each(watch_arr, function(i, key){
					if ( key === 'parent' ) {
						watched_field = watched_field.parent();
					} else if ( watched_field.type === 'category' ) {
						watched_field = watched_field.fields[key];
					} else {
						watched_field = watched_field[key];
					}
				});
				return watched_field;
			}

			/**
			 * @param {string} field_str
			 */
			function watch(field_str){
				var field_arr = field_str.split('.'),
					watched_field = getWatchedField(field_arr);
				watched_field.watchers.push(field_settings);
			}

			field_settings.calculate({
				watch: function(field_str){
					if ( typeof field_str === 'string' ) {
						watch(field_str);
					} else if ( Array.isArray(field_str) ) {
						$.each(field_str,function(i,field_str){
							watch(field_str);
						})
					}
					return this;
				},
				sum: function(iterable_str, field_str){
					var iterable_arr = iterable_str.split('.'),
						watched_field = getWatchedField(iterable_arr);
					if (
						watched_field.hasOwnProperty('children') &&
						watched_field.fields.hasOwnProperty(field_str)
					) {
						watched_field.fields[field_str].sum_watchers.push(field_settings);
					}
					return this;
				},
				ignore:function(){return this}, // not needed for watchers
				round:function(){return this} // not needed for watchers
			});
		}
	}

	/**
	 * @param {object} parent_calculator
	 * @param {string} field_name
	 * @param {object} field_settings
	 * @param {object} data
	 * @param {object} tmp_data
	 */
	function buildFieldCalculator(parent_calculator, field_name, field_settings, data, tmp_data) {
		// Is field data stored or just temporary?
		var field_data = field_settings.is_tmp ? tmp_data : data;
		var field_calculator = parent_calculator[field_name] = {};
		Object.defineProperty(field_calculator, 'parent', {
			writable: false,
			configurable: false,
			value: function(){
				return parent_calculator;
			}
		});

		// IF field type isn't "category" or "iterable"...
		if ( ['category','iterable'].indexOf(field_settings.type) < 0 ) {
			Object.defineProperties(field_calculator, {
				val: {
					writable: false,
					configurable: false,
					value: function () {
						if ( arguments.length ) {
							var val = arguments[0];
							// Check if field can be assigned
							if ( !field_settings.is_assignable ) {
								console.error('Field \''+field_settings.name+'\' cannot be assigned');
								return field_calculator;
							}
							field_calculator.update(val);
							// TODO: update all watchers
							Calculr.onUpdate(Calculr);
							console.log(field_calculator, field_settings);
							return field_calculator;
						}
						return field_data[field_name];
					}
				},
				update: {
					writable: false,
					configurable: false,
					value: function(val) {
						// Check if value passes all validation
						if ( !field_settings.validators.every(function (a) {return a(val)}) ) {
							console.error('invalid value');
							return false;
						}
						field_data[field_name] = val;
					}
				}
			});

			$.each(field_settings.classes, function(i, field_class){
				Calculr.classes[field_class] = Calculr.classes[field_class] || [];
				Calculr.classes[field_class].push(field_calculator);
			});

			if ( typeof field_data[field_name] === 'undefined' ) {
				field_data[field_name] = field_settings.default;
			}
		} else { // IF field type IS "category" or "iterable"
			var child_data = data[field_name] = data[field_name] || {};
			var tmp_child_data = tmp_data[field_name] = tmp_data[field_name] || {};

			switch ( field_settings.type ) {
				case 'category':
					// FOR each child field...
					$.each(field_settings.fields, function(child_field_name, child_field_settings){
						buildFieldCalculator(field_calculator, child_field_name, child_field_settings, child_data, tmp_child_data);
					});
					break;
				case 'iterable':
					Object.defineProperty(field_calculator, 'array', {
						writable: false,
						configurable: false,
						value: {}
					});
					var array_calculator = field_calculator.array;
					Object.defineProperty(array_calculator, 'parent', {
						configurable: false,
						value: function(){
							return field_calculator;
						}
					});

					var array_data = child_data;
					var tmp_array_data = tmp_child_data;

					// FOR each data item that may exist on init...
					$.each(array_data, function(uid){
						addArrayItemCalculator(array_calculator, uid, array_data, tmp_array_data);
					});

					Object.defineProperty(field_calculator, 'add', {
						configurable: false,
						value: function () {
							var item = addArrayItemCalculator(array_calculator, create_uid(3, array_data), array_data, tmp_array_data);
							Calculr.onUpdate(Calculr);
							return item;
						}
					});

					function addArrayItemCalculator(array_calculator, uid, array_data, tmp_array_data){
						var array_item_calculator = array_calculator[uid] = {};
						var data = array_data[uid] = array_data[uid] || {};
						var tmp_data = tmp_array_data[uid] = tmp_array_data[uid] || {};
						$.each(field_settings.fields, function(child_field_name, child_field_settings){
							if ( ['delete','parent'].indexOf(child_field_name) >= 0 ) {
								console.error("'"+child_field_name+"' is a protected method name");
								return true;
							}
							buildFieldCalculator(array_item_calculator, child_field_name, child_field_settings, data, tmp_data);
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

	Calculr.addFields(config.fields || {});
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
