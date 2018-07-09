function Calculr(settings)
{
	/*
	var settings = {data, methods, properties};
	var Helper = {
		watch:function(){},
		sum:function(){},
		root:{},
		self:{},
		parent:{},
		methods:{custom methods}
	};
	*/

	var data = settings.data || {};
	var methods = settings.methods || {};
	var properties = settings.properties || {};

	var Calculr = {
		data: data,
		settings: {},
		addProp: function(prop_name, settings)
		{
			addProp(prop_name, settings, this.settings);
		},
		addMethod: function(method_name, settings)
		{
//			console.log(method_name, settings);
		}
	};

	/**
	 * @param {string} prop_name
	 * @param {*} settings
	 * @param {object} dest_obj
	 */
	function addProp(prop_name, settings, dest_obj) {
		switch ( typeof settings ) {
			case 'string':
				settings = {type:settings};
				break;
			case 'function':
				settings = {
					is_assignable: false,
					calculate: settings
				};
				break;
			default: break;
		}
		var prop_validators = [];
		var prop_type = settings.type || 'non-negative';
		switch ( prop_type ) { //todo: move this to init()
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
		if ( Array.isArray(settings.options) ) {
			prop_validators.push(function(val){
				return settings.options.indexOf(val) >= 0;
			});
		}
		if ( typeof settings.validate === 'function' ) {
			prop_validators.push(settings.validate);
		}
		var prop_default = settings.default || null;
		if ( prop_default === null ) {
			prop_default = {
				number: 0,
				'non-negative': 0,
				string: '',
				boolean: true,
				object: {},
				date: 'NOW()', //todo
				array: []
			}[prop_type];
		}
		var prop_is_assignable =
			(typeof settings.is_assignable !== 'undefined') ?
				settings.is_assignable :
				true;
		var prop_is_tmp =
			(typeof settings.is_tmp !== 'undefined') ?
				settings.is_tmp :
				!prop_is_assignable;
		if ( ['object','array'].indexOf(prop_type) >= 0 ) {
			prop_is_assignable = false;
			prop_is_tmp = false;
		}
		// Assign "property" properties
		dest_obj[prop_name] = {
			type: prop_type,
			options: settings.options || null,
			default: prop_default,
			validators: prop_validators,
			is_assignable: prop_is_assignable,
			is_tmp: prop_is_tmp, // todo: these will be initialized
			calculate: settings.calculate || null
		};
		// Find children, recursively call addProp()
		if ( ['object','array'].indexOf(prop_type) >= 0 ) {
			dest_obj[prop_name].properties = {};
			for ( var child_prop_name in settings.properties ) {
				if ( settings.properties.hasOwnProperty(child_prop_name) ) {
					addProp(child_prop_name, settings.properties[child_prop_name], dest_obj[prop_name].properties);
				}
			}
		}
	}

	for ( var prop_name in properties ) {
		if ( properties.hasOwnProperty(prop_name) ) {
			Calculr.addProp(prop_name, properties[prop_name]);
		}
	}
	console.log(Calculr.settings);

	for ( var method_name in methods ) {
		if ( methods.hasOwnProperty(method_name) ) {
			Calculr.addMethod(method_name, methods[method_name]);
		}
	}

	return Calculr;
}