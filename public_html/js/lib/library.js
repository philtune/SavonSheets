/**
 * Throw error if type mismatch
 * @param {*} val - The variable to be checked
 * @param {string} type - The type to be compared
 * @param {boolean} [check_defined] - Should val also be defined?
 */
function typeCheck(val, type, check_defined) {
	var is_defined = ( val === undefined );
	if ( ( check_defined && is_defined ) || ( !check_defined && !is_defined && typeof val !== type ) )
		throw new Error('Expecting '+type+', received '+(typeof val));
}

function _dataControls(label, new_arr)
{
	var data_controls = jQuery.extend(getGlobalVar('data_'+label, {}), new_arr);
	
	jQuery(document).ready(function($){

		$('[data-'+label+']').each(function() {
			var func_calls = $(this).data(label).trim().split(','),
				me = this;
			$.each(func_calls, function(i,call_str)
			{
				var arg_arr = call_str.trim().split(' '),
					funcName = arg_arr.shift(),
					fn = data_controls[funcName];

				var args = {};
				$.each(arg_arr, function(i, val) {
					spl = val.split('=');
					args[i] = val;
					args[spl[0]] =
						( spl.length === 1 ) ? true : spl[1];
				});
				var find = function(selector) {
					return $(me).find('[data-'+label+'-class='+selector+']');
				};

				if (typeof fn === 'function') fn(me, args, find);
			});
		});

	});
}

jQuery.fn.onTrigger = function(func)
{
	return this.click(func).attr('role','button').attr('tabindex','0')
		.keydown(function(e){ if(e.which==32||e.which==13){ setTimeout(func(e),0); return false; } });
};

function getGlobalVar(var_name, else_input)
{
	return window[var_name] = window[var_name] || else_input;
}

jQuery(document).ready(function($){

	$('[tabindex]')
		.focus(function(){ $(this).css('outline', 'none'); })
		.keyup(function(e){ if(e.which === 9) $(this).css('outline',''); });

	$('button:not([type=submit])').onTrigger(function(e){
		e.preventDefault();
	});
		
});

function create_uid(size, compare_obj) {
	var compare_obj = compare_obj || {},
		uid = '';
	do {
		uid = (Array(size+1).join("0") + ((Math.random() * Math.pow(36,size)) | 0).toString(36)).slice(-size);
	} while ( compare_obj.hasOwnProperty(uid) );
	return uid;
}


/*
 * Utility Functions
 */

function getUrlVars() {
	var vars = {};
	var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
		vars[key] = value;
	});
	return vars;
}

function validJSON (jsonString){
    try {
        var _return = JSON.parse(jsonString);

        // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object", 
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:
        if (_return && typeof _return === "object") {
            return _return;
        }
    }
    catch (e) { }

    return false;
};

function _each(obj, callback) {
	switch ( Object.prototype.toString.call( obj ) ) {
		case "[object Array]":
			for ( var i = 0; i <= obj.length; i++ ) {
				if ( callback(i, obj[i]) === false ) {
					break;
				}
			}
			break;
		case "[object Object]":
			for ( var i in obj ) {
				if ( callback(i, obj[i]) === false ) {
					break;
				}
			}
			break;
	}
}

function _empty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}


/* 
 * Polyfills
 */
 
if (typeof Object.assign != 'function') {
	// Must be writable: true, enumerable: false, configurable: true
	Object.defineProperty(Object, "assign", {
		value: function assign(target, varArgs) { // .length of function is 2
			'use strict';
			if (target == null) { // TypeError if undefined or null
				throw new TypeError('Cannot convert undefined or null to object');
			}

			var to = Object(target);

			for (var index = 1; index < arguments.length; index++) {
				var nextSource = arguments[index];

				if (nextSource != null) { // Skip over if undefined or null
					for (var nextKey in nextSource) {
						// Avoid bugs when hasOwnProperty is shadowed
						if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
							to[nextKey] = nextSource[nextKey];
						}
					}
				}
			}
			return to;
		},
		writable: true,
		configurable: true
	});
}

if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(searchString, position){
		return this.substr(position || 0, searchString.length) === searchString;
	};
}

if (!String.prototype.endsWith) {
	String.prototype.endsWith = function(searchStr, Position) {
		// This works much better than >= because
		// it compensates for NaN:
		if (!(Position < this.length))
			Position = this.length;
		else
			Position |= 0; // round position
		return this.substr(Position - searchStr.length, searchStr.length) === searchStr;
	};
}
