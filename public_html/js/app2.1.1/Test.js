var test_data = {
	uid: "aaa",
	created_at: "06/22/2018",
	updated_at: "07/11/2018",
	deleted_at: null,
	name: "Test",
	made_at: "06/22/2018",
	note: "",
	settings: {
		unit: "oz",
		lye_discount: 0.08,
		liquid_lye_ratio: 1.8,
		cure_days: 42
	},
	oils: {
		weight: 24,
		list: {
			xxx: {
				oil_id: "xxx",
				name: "Olive Oil",
				cost_per_unit: 0.17,
				naoh_sap: 0.134,
				koh_sap: 0.188,
				percent: 0.3333
			},
			yyy: {
				oil_id: "yyy",
				name: "Lard",
				cost_per_unit: 0.12,
				naoh_sap: 0.141,
				koh_sap: 0.198,
				percent: 0.3333
			},
			zzz: {
				oil_id: "zzz",
				name: "Coconut Oil",
				cost_per_unit: 0.11,
				naoh_sap: 0.178,
				koh_sap: 0.257,
				percent: 0.3333
			}
		}
	},
	lyes: {
		naoh: {
			lye_uid: "xxx",
			name: "Sodium Hydroxide",
			cost_per_unit: 0.16,
			percent: 1
		},
		koh: {
			lye_uid: "yyy",
			name: "Potassium Hydroxide",
			cost_per_unit: 0.19,
			percent: 0
		}
	},
	liquids: {
		list: {
			xxx: {
				liquid_uid: "xxx",
				name: "Rain Water",
				cost_per_unit: 0,
				percent: 1
			}
		}
	},
	additives: {
		list: {
			xxx: {
				additive_uid: "xxx",
				name: "Rain FO (Aztec)",
				cost_per_unit: 1,
				calculation_type: "oz_ppo", // "percent_batch", "none"
				multiplier: 0.666,
				note: ""
			},
			yyy: {
				additive_uid: "yyy",
				name: "Deep Green Mica (Aztec)",
				calculation_type: "none",
				multiplier: 0,
				note: "1 tsp"
			}
		}
	}
};

var recipe_calc = new Recipe(test_data);
recipe_calc.name = 'Hello There';
var recipe_oil = recipe_calc.oils.list.array['xxx'];
recipe_oil.oil_id = "qqq";
recipe_calc.settings.unit = "lb";
recipe_oil.name = "Castor Oil";
var new_recipe_oil = recipe_calc.oils.list.add('foo');
//new_recipe_oil.delete();

var recipe_data = {
	id: "xxx",
	created_at: "06/22/2018",
	updated_at: "",
	deleted_at: "",
	name: "Cupcakes",
	note: "",
	cured_at: "08/23/2018",
	oils: {
		"list": [
			{
				"naoh_weight": 1.072, // C (weight * naoh_sap)
				"koh_weight": 1.504, // C (weight * koh_sap)
				"cost": 1.36, // C (cost_per_unit * weight)
				weight: 8
			},
			{
				"naoh_weight": 1.128,
				"koh_weight": 1.584,
				"cost": 0.96,
				weight: 8
			},
			{
				"naoh_weight": 1.424,
				"koh_weight": 2.056,
				"cost": 0.86,
				weight: 8
			}
		],
		"list_reorder": function(){
			list_reorder.apply(this, arguments);
		},
		"list_weight": function(){
			return list_count(this, "weight");
		},
		"list_percent": function(){
			return list_count(this, "percent");
		},
		"list_naoh_weight": function(){
			return list_count(this, "naoh_weight");
		},
		"list_koh_weight": function(){
			return list_count(this, "koh_weight");
		},
		"list_cost": function(){
			return list_count(this, "cost");
		},
		"percent": 1, // C (list_percent())
		"naoh_weight": 3.624, // C (list_naoh_weight())
		"koh_weight": 5.144, // C (list_koh_weight())
		"cost": 3.18 // C (list_cost())
	},
	lyes: {
		"list": [
			{
				"weight": 3.33408, // C ((parent.parent.oils.naoh_weight * (1 - parent.discount)) * ([1,0,percent][parent.type])
				"cost": 0.53345 // C (weight * cost_per_unit)
			},
			{
				"weight": 0, // C ((parent.parent.oils.koh_weight * (1 - parent.discount)) * [0,1,percent][parent.percent])
				"cost": 0 // C (weight * cost_per_unit)
			}
		],
		"list_reorder": function(){
			list_reorder.apply(this, arguments);
		},
		"lye_weight": function(){
			return list_count(this.list, "weight");
		},
		"list_cost": function(){
			return list_count(this, "cost");
		},
		"weight": 3.33408, // C (lye_weight())
		"cost": 0.53345 // C (naoh.cost + koh.cost)
	},
	liquids: {
		"list": [
			{
				"weight": 6.001344, // C (parent.weight * percent)
				"cost": 0 // C (cost_per_unit * weight)
			}
		],
		"list_reorder": function(){
			list_reorder.apply(this, arguments);
		},
		"liquids_weight": function(){
			return recipe_data.lye.weight;
		},
		"list_cost": function(){
			return list_count(this, "cost");
		},
		"weight": 6.001344, // C (parent.lye.weight * liquid_lye_ratio)
		"cost": 0 // C (liquids_cost())
	},
	additives: {
		"list" :[
			{
				"weight": 1, // C (parent.oils.weight * calculation)
				"cost": 1 // C (weight * cost_per_unit)
			},
			{
			}
		],
		"weight": 1, // C (additives_weight())
		"cost": 0 // C (additives_cost())
	},
	weight: 34.335424, // C (oils.weight + lye.weight + liquids.weight + additives.weight)
	cost: 4.71 // C (oils.cost + lye.cost + liquids.cost + additives.cost)
};