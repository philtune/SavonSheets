/*
F - foreign
C - calculated
D - needs to be stored data
I - input
S - static, does not change any other property
 */

function list_count(arr, prop)
{
	var n = 0;
	for ( var i = 0; i < arr.length; i++ ) {
		n += arr[i][prop];
	}
	return n;
}

function list_reorder(from, to)
{
	var len = this.list.length;
	if ( from >= 0 && from < len && to >= 0 && to < len ) {
		this.list.splice(to, 0, this.list.splice(from, 1)[0]);
	}
}

var recipe_data = {
	"uid": "xxx", // D, S
	"created_at": "06/22/2018", // D, S
	"updated_at": "", // D, S
	"deleted_at": "", // D, S
	"name": "Cupcakes", // I, D, S
	"date_made": "06/22/2018", // I, D, S
	"note": "", // I, D, S

	"settings": {
		"unit": "oz", // I, D
		"lye_discount": 0.08, // I, D
		"liquid_lye_ratio": 1.8 // I, D
	},
	"oils": {
		"list": [
			{
				"oil_uid": "xxx",
				"name": "Olive Oil", // F, S
				"cost_per_unit": 0.17, // F
				"naoh_sap": 0.134, // F
				"koh_sap": 0.188, // F

				"weight": 8, // I, C (parent.weight * percent)
				"percent": 0.3333, // I, D, C (weight / parent.weight)
				"naoh_weight": 1.072, // C (weight * naoh_sap)
				"koh_weight": 1.504, // C (weight * koh_sap)
				"cost_per_batch": 1.36 // C (cost_per_unit * weight)
			},
			{
				"oil_uid": "yyy",
				"name": "Lard",
				"cost_per_unit": 0.12,
				"naoh_sap": 0.141,
				"koh_sap": 0.198,
				"weight": 8,
				"percent": 0.3333,
				"naoh_weight": 1.128,
				"koh_weight": 1.584,
				"cost_per_batch": 0.96
			},
			{
				"oil_uid": "zzz",
				"name": "Coconut Oil",
				"cost_per_unit": 0.11,
				"naoh_sap": 0.178,
				"koh_sap": 0.257,
				"weight": 8,
				"percent": 0.3333,
				"naoh_weight": 1.424,
				"koh_weight": 2.056,
				"cost_per_batch": 0.86
			}
		],
		"list_reorder": function(){
			list_reorder.apply(this, arguments);
		},
		"list_weight": function(){
			return list_count(this.list, "weight");
		},
		"list_percent": function(){
			return list_count(this.list, "percent");
		},
		"list_naoh_weight": function(){
			return list_count(this.list, "naoh_weight");
		},
		"list_koh_weight": function(){
			return list_count(this.list, "koh_weight");
		},
		"list_cost_per_batch": function(){
			return list_count(this.list, "cost_per_batch");
		},
		"weight": 24, // I, C (list_weight())
		"percent": 1, // C (list_percent())
		"naoh_weight": 3.624, // C (list_naoh_weight())
		"koh_weight": 5.144, // C (list_koh_weight())
		"cost_per_batch": 3.18 // C (list_cost_per_batch())
	},
	"lyes": {
		"list": [
			{
				"lye_uid": "xxx",
				"name": "Sodium Hydroxide", // S
				"percent": 1, // I, D
				"weight": 3.33408, // C ((parent.parent.oils.naoh_weight * (1 - parent.parent.settings.lye_discount)) * percent)
				"cost_per_unit": 0.16, // F
				"cost_per_batch": 0.53345 // C (weight * cost_per_unit)
			},
			{
				"lye_uid": "yyy",
				"name": 'Potassium Hydroxide',
				"percent": 0,
				"weight": 0, // C ((parent.parent.oils.koh_weight * (1 - parent.parent.settings.lye_discount)) * percent)
				"cost_per_unit": 0, // F
				"cost_per_batch": 0 // C (weight * cost_per_unit)
			}
		],
		"list_reorder": function(){
			list_reorder.apply(this, arguments);
		},
		"list_weight": function(){
			return list_count(this.list, "weight");
		},
		"list_cost_per_batch": function(){
			return list_count(this.list, "cost_per_batch");
		},
		"weight": 3.33408, // C (list_weight())
		"cost_per_batch": 0.53345 // C (naoh.cost_per_batch + koh.cost_per_batch)
	},
	"liquids": {
		"liquids_weight": function(){
			return recipe_data.lyes.weight;
		},
		"weight": 6.001344, // C (parent.lye.weight * liquid_lye_ratio)
		"list": [
			{
				"liquid_uid": "xxx",
				"name": "Rain Water", // F, S
				"cost_per_unit": 0, // F
				"percent": 1, // I, D
				"weight": 6.001344, // C (parent.weight * percent)
				"cost_per_batch": 0 // C (cost_per_unit * weight)
			}
		],
		"list_reorder": function(){
			list_reorder.apply(this, arguments);
		},
		"cost_per_batch": 0 // C (liquids_cost_per_batch())
	},
	"additives": {
		"list" :[
			{
				"additive_uid": "xxx",
				"name": "Rain FO (Aztec)", // I, S
				"calculation": 16 * 0.666, // F?, I, D
				"weight": 1, // C (parent.oils.weight * calculation)
				"cost_per_unit": 1, // F
				"cost_per_batch": 1 // C (weight * cost_per_unit)
			},
			{
				"additive_uid": "yyy",
				"name": "Deep Green Mica (Aztec)", // I, S
				"amount": "1 tsp" // I, S
			}
		],
		"weight": 1, // C (additives_weight())
		"cost_per_batch": 0 // C (additives_cost_per_batch())
	},
	"weight": 34.335424, // C (oils.weight + lyes.weight + liquids.weight + additives.weight)
	"cost_per_batch": 4.71 // C (oils.cost_per_batch + lyes.cost_per_batch + liquids.cost_per_batch + additives.cost_per_batch)
};
$('#recipe_console').text(JSON.stringify(recipe_data, null, '\t'));

var recipe = new Calculr(recipe_data, {});
