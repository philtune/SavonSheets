/*
F - foreign
C - calculated
D - needs to be stored data
I - input
S - static, does not change any other property
 */

function list_count(group, prop){
	var n = 0;
	for ( var i = 0; i < group.list.length; i++ ) {
		n += group.list[i][prop];
	}
	return n;
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
		"liquid_lye_ratio": 1.8 // I, D
	},
	"oils": {
		"list_reorder": function(){
			return 0;
		},
		"list": [
			{
				"order": 0, // I, D, C (list_reorder())
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
				"order": 1,
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
				"order": 2,
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
		"list_weight": function(){
			return list_count(this, "weight");
		},
		"list_percent": function(){
			return list_count(this, "percent");
		},
		"list_cost_per_batch": function(){
			return list_count(this, "cost_per_batch");
		},
		"weight": 24, // I, C (list_weight())
		"percent": 1, // C (list_percent())
		"cost_per_batch": 3.18 // C (list_cost_per_batch())
	},
	"lye": {
		"type": 0, // I, D
		"discount": 0.08, // I, D
		"naoh": {
			"order": 0, // I, D, C (reorder())
			"name": "Sodium Hydroxide", // S
			"weight": 3.624, // C (lye_naoh_weight())
			"percent": 1, // I, D
			"needed": 3.33408, // C ((weight * (1 - parent.discount)) * percent)
			"cost_per_unit": 0.16, // F
			"cost_per_batch": 0.53345 // C (needed * cost_per_unit)
		},
		"koh": {
			"order": 1,
			"name": "Potassium Hydroxide",
			"weight": 5.144, // C (lye_koh_weight())
			"percent": 0,
			"needed": 0, // C ((weight * (1 - parent.discount)) * percent)
			"cost_per_unit": 0, // F
			"cost_per_batch": 0 // C (needed * cost_per_unit)
		},
		"weight": 3.624, // C (naoh.weight + koh.weight)
		"cost_per_batch": 0.53345 // C (naoh.cost_per_batch + koh.cost_per_batch)
	},
	"liquid_needed":  6.001344, // C ((lye.naoh.needed + lye.koh.needed) * settings.liquid_lye_ratio)
	"liquids": {
		"list": [
			{
				"order": 0, // I, D, C (reorder())
				"name": "Rain Water", // F, S
				"cost_per_unit": 0, // F
				"percent": 1, // I, D
				"weight": 6.001344, // C (parent.liquid_needed * percent)
				"cost_per_batch": 0 // C (cost_per_unit * weight)
			}
		],
		"weight": 6.001344, // C (liquids_weight())
		"cost_per_batch": 0 // C (liquids_cost_per_batch())
	},
	"additives": {
		"list" :[
			{
				"order": 0, // I, D, C (reorder())
				"name": "Rain FO (Aztec)", // I, S
				"calculation": 16 * 0.666, // F?, I, D
				"weight": 1, // C (parent.oils.weight * calculation)
				"cost_per_unit": 1, // F
				"cost_per_batch": 1 // C (weight * cost_per_unit)
			},
			{
				"order": 1,
				"name": "Deep Green Mica (Aztec)", // I, S
				"amount": "1 tsp" // I, S
			}
		],
		"weight": 1, // C (additives_weight())
		"cost_per_batch": 0 // (additives_cost_per_batch())
	},
	"weight": 34.335424, // C (oils.weight + lye.weight + liquids.weight + additives.weight)
	"cost_per_batch": 4.71 // C (oils.cost_per_batch + lye.cost_per_batch + liquids.cost_per_batch + additives.cost_per_batch)
};
console.log(recipe_data);