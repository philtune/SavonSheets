function Recipe()
{
	var data = {};
	if ( typeof arguments[0] === 'string' ) {
		var uid = arguments[0];
		data = {foo:'bar'};
	} else if ( arguments.length ) {
		// fixme: probably don't accept objects as argument but only a uid and pull data within this class
		data = arguments[0];
	} else {
		data = {
			name: ''
		}
	}

	var recipe_calc = new Calculr({
		data: data,
		methods: {
			// TODO: function that rebalances all weights
		},
		properties: {
			settings: {
				type: 'object',
				properties: {
					unit: {
						type: 'string',
						is_assignable: true,
						default: 'oz',
						options: ['oz','g','ml','lb','kg','l'],
						save: true
					},
					lye_type: {
						type: 'number',
						is_assignable: true,
						default: 0,
						options: [0,1,2],
						save: true
					},
					lye_discount:{
						type: 'number',
						is_assignable: true,
						default: 0.05,
						save: true
					},
					liquid_lye_ratio: {
						type: 'number',
						is_assignable: true,
						default: 1.8,
						save: true
					},
					cure_days: {
						type: 'number',
						is_assignable: true,
						default: 42,
						save: true
					}
				}
			},
			name: { // todo: remove from calculator but set elsewhere in Recipe class
				type: 'string',
				is_assignable: true,
				default: '',
				save: true
			},
			note: { // todo: remove from calculator but set elsewhere in Recipe class
				type: 'string',
				is_assignable: true,
				default: '',
				save: true
			},
			made_at: {
				type: 'date',
				is_assignable: true,
				default: 'NOW()', // todo: default will actually be turned into Date object, NOW() will always be default if this is not defined
				save: true
			},
			cured_at: {
				type: 'date',
				is_assignable: false,
				calculate: function(Helper){
					// todo: apply date conversions
					return Helper.watch(Helper.root.made_at) + Helper.watch(Helper.root.settings.cure_days);
				},
				initialize: true,
				save: false
			},
			oils: {
				type: 'object',
				properties: {
					list: {
						type: 'array',
						properties: {
							// todo: make foreign 'oil_key'=>['name','cost_per_unit','naoh_sap','koh_sap']
							name: { // todo: make foreign
								type: 'string',
								is_assignable: true,
								default: '',
								save: true
							},
							cost_per_unit: { // todo: make foreign
								type: 'number',
								is_assignable: true,
								default: 0,
								save: true
							},
							naoh_sap: { // todo: make foreign
								type: 'number',
								is_assignable: true,
								default: 0,
								save: true
							},
							koh_sap: { // todo: make foreign
								type: 'number',
								is_assignable: true,
								default: 0,
								save: true
							},
							percent: {
								type: 'number',
								is_assignable: true,
								default: 0,
								calculate: function(Helper){
									return Helper.watch(Helper.self.weight) / Helper.parent.weight;
								},
								initialize: false,
								save: true
							},
							weight: {
								type: 'number',
								is_assignable: true,
								calculate: function(Helper){
									return Helper.watch(Helper.parent.weight) * Helper.watch(Helper.self.percent);
								},
								initialize: true,
								save: false
							},
							naoh_weight: {
								type: 'number',
								is_assignable: false,
								calculate: function(Helper){
									return Helper.watch(Helper.self.naoh_sap) * Helper.watch(Helper.self.weight);
								},
								initialize: true,
								save: false
							},
							koh_weight: {
								type: 'number',
								is_assignable: false,
								calculate: function(Helper){
									return Helper.watch(Helper.self.koh_sap) * Helper.watch(Helper.self.weight);
								},
								initialize: true,
								save: false
							},
							cost: {
								type: 'number',
								is_assignable: false,
								calculate: function(Helper){
									return Helper.watch(Helper.self.cost_per_unit) * Helper.watch(Helper.self.weight);
								},
								initialize: true,
								save: false
							}
						}
					},
					percent: {
						type: 'number',
						is_assignable: false,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'percent');
						},
						intialize: true,
						save: false
					},
					weight: {
						type: 'number',
						is_assignable: true,
						default: 0,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'weight').round(2);
						},
						initialize: false, // todo: calculate function will not be called on init(); usually for properties that watch() each other
						save: true
					},
					naoh_weight: {
						type: 'number',
						is_assignable: false,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'naoh_weight').round(2);
						},
						initialize: true,
						save: false
					},
					koh_weight: {
						type: 'number',
						is_assignable: false,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'koh_weight').round(2);
						},
						initialize: true,
						save: false
					},
					cost: {
						type: 'number',
						is_assignable: false,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'cost').round(2);
						},
						initialize: true,
						save: false
					}
				}
			},
			lyes: {
				type: 'object',
				properties: {
					naoh: {
						type: 'object',
						properties: {
							percent: {
								type: 'number',
								is_assignable: false,
								default: 0,
								calculate: function(Helper) {
									return 1 - Helper.watch(Helper.parent.koh.percent);
								},
								initialize: false,
								save: true
							},
							cost_per_unit: { // todo: make foreign
								type: 'number',
								is_assignable: true,
								default: 0,
								save: true
							},
							weight: {
								type: 'number',
								is_assignable: true,
								calculate: function(Helper) {
									var percent = [1,0,Helper.watch(Helper.self.percent)][Helper.watch(Helper.root.settings.lye_type)],
										discounted = (1 - Helper.watch(Helper.root.settings.lye_discount));
									return Helper.watch(Helper.root.oils.naoh_weight) * percent * discounted;
								},
								initialize: true,
								save: false
							},
							cost: {
								type: 'number',
								is_assignable: false,
								calculate: function(Helper) {
									return Helper.watch(Helper.self.cost_per_unit) * Helper.watch(Helper.self.weight);
								},
								initialize: true,
								save: false
							}
						}
					},
					koh: {
						type: 'object',
						properties: {
							percent: {
								type: 'number',
								is_assignable: true,
								default: 0,
								calculate: function(Helper) {
									return 1 - Helper.watch(Helper.parent.naoh.percent);
								},
								initialize: false,
								save: true
							},
							cost_per_unit: { // todo: make foreign
								type: 'number',
								is_assignable: true,
								default: 0,
								save: true
							},
							weight: {
								type: 'number',
								is_assignable: true,
								calculate: function(Helper) {
									var percent = [1,0,Helper.watch(Helper.self.percent)][Helper.watch(Helper.root.settings.lye_type)],
										discounted = (1 - Helper.watch(Helper.root.settings.lye_discount));
									return Helper.watch(Helper.root.oils.koh_weight) * percent * discounted;
								},
								initialize: true,
								save: false
							},
							cost: {
								type: 'number',
								is_assignable: false,
								calculate: function(Helper) {
									return Helper.watch(Helper.self.cost_per_unit) * Helper.watch(Helper.self.weight);
								},
								initialize: true,
								save: false
							}
						}
					},
					weight: {
						type: 'number',
						is_assignable: false,
						default: 0,
						calculate: function(Helper){
							return Helper.watch(Helper.self.naoh.weight) + Helper.watch(Helper.self.koh.weight);
						},
						initialize: true,
						save: false
					},
					cost: {
						type: 'number',
						is_assignable: false,
						default: 0,
						calculate: function(Helper){
							return Helper.watch(Helper.self.naoh.cost) + Helper.watch(Helper.self.koh.cost);
						},
						initialize: true,
						save: false
					}
				}
			},
			liquids: {
				type: 'object',
				properties: {
					weight: {
						type: 'number',
						default: 0,
						calculate: function(Helper){
							return Helper.watch(Helper.root.lyes.weight) * Helper.watch(Helper.root.settings.liquid_lye_ratio);
						},
						is_assignable: false
					},
					list: {
						type: 'array',
						properties: {
							// todo: make foreign 'oil_key'=>['name','cost_per_unit','naoh_sap','koh_sap']
							name: { // todo: make foreign
								type: 'string',
								is_assignable: true,
								default: '',
								save: true
							},
							cost_per_unit: { // todo: make foreign
								type: 'number',
								is_assignable: true,
								default: 0,
								save: true
							},
							percent: {
								type: 'number',
								is_assignable: true,
								default: 0,
								save: true
							},
							weight: {
								type: 'number',
								is_assignable: false,
								default: 0,
								calculate: function(Helper){
									return Helper.watch(Helper.parent.weight) * Helper.watch(Helper.self.percent);
								},
								initialize: true,
								save: false
							},
							cost: {
								type: 'number',
								is_assignable: false,
								calculate: function(Helper){
									return Helper.watch(Helper.self.cost_per_unit) * Helper.watch(Helper.self.weight);
								},
								initialize: true,
								save: false
							}
						}
					},
					percent: {
						type: 'number',
						is_assignable: false,
						default: 0,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'percent').round(2);
						},
						initialize: true,
						save: false
					},
					cost: {
						type: 'number',
						is_assignable: false,
						default: 0,
						calculate: function(Helper){
							return Helper.watch(Helper.self.naoh.cost) + Helper.watch(Helper.self.koh.cost);
						},
						initialize: true,
						save: false
					}
				}
			},
			additives: {
				type: 'object',
				properties: {
					list: {
						type: 'array',
						properties: {
							name: {
								type: 'string',
								is_assignable: true,
								default: '',
								save: true
							},
							type: {
								type: 'string',
								is_assignable: true,
								options: ['calculated', 'weight', 'note'],
								default: 'calculated',
								save: true
							},
							cost_per_unit: {
								type: 'number',
								is_assignable: true,
								default: 0,
								save: true
							},
							weight: {
								type: 'number',
								is_assignable: true,
								default: 0,
								save: true
							},
							calculation_type: {
								type: 'string',
								is_assignable: true,
								default: 'oz_ppo',
								options: ['oz_ppo', 'percent_batch'],
								save: true
							},
							multiplier: {
								type: 'number',
								is_assignable: true,
								default: 0,
								save: true
							},
							output_weight: {
								type: 'number',
								is_assignable: false,
								calculation: function(Helper){
									// TODO (if is_calculated...)
								},
								initialize: true,
								save: false
							},
							cost: {
								type: 'number',
								is_assignable: false,
								default: 0,
								calculation: function(Helper){
									return Helper.watch(Helper.self.weight) * Helper.watch(Helper.self.cost_per_unit);
								},
								initialize: true,
								save: false
							},
							note: {
								type: 'string',
								is_assignable: true,
								default: '',
								save: true
							}
						}
					},
					weight: {
						type: 'number',
						is_assignable: false,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'weight');
						},
						initialize: true,
						save: false
					},
					cost: {
						type: 'number',
						is_assignable: false,
						calculate: function(){
							return Helper.sum(Helper.self.list, 'cost');
						},
						initialize: true,
						save: false
					}
				}
			},
			weight: {
				type: 'number',
				is_assignable: false,
				calculate: function(Helper){
					return Helper.watch([
						Helper.self.oils.weight,
						Helper.self.lyes.weight,
						Helper.self.liquids.weight,
						Helper.self.additives.weight
					]);
				},
				initialize: true,
				save: false
			},
			cost: {
				type: 'number',
				is_assignable: false,
				calculate: function(Helper){
					return Helper.watch([
						Helper.self.oils.cost,
						Helper.self.lyes.cost,
						Helper.self.liquids.cost,
						Helper.self.additives.cost
					]);
				},
				initialize: true,
				save: false
			}
		}
	});
	console.log(recipe_calc);
//	$('#recipe_console').text(JSON.stringify(recipe_calc, null, '\t'));
}

var recipe = new Recipe({
	settings: {
		unit: "oz",
		lye_discount: 0.08,
		liquid_lye_ratio: 1.8,
		cure_days: 42
	},
	made_at: "06/22/2018",
	oils: {
		weight: 24,
		list: [
			{
				oil_id: "xxx",
				name: "Olive Oil",
				cost_per_unit: 0.17,
				naoh_sap: 0.134,
				koh_sap: 0.188,
				percent: 0.3333
			},
			{
				oil_id: "yyy",
				name: "Lard",
				cost_per_unit: 0.12,
				naoh_sap: 0.141,
				koh_sap: 0.198,
				percent: 0.3333
			},
			{
				oil_id: "zzz",
				name: "Coconut Oil",
				cost_per_unit: 0.11,
				naoh_sap: 0.178,
				koh_sap: 0.257,
				percent: 0.3333
			}
		]
	},
	lyes: {
		list: [
			{
				lye_uid: "xxx",
				name: "Sodium Hydroxide",
				cost_per_unit: 0.16,
				percent: 1
			},
			{
				lye_uid: "yyy",
				name: "Potassium Hydroxide",
				cost_per_unit: 0.19,
				percent: 0
			}
		]
	},
	liquids: {
		list: [
			{
				liquid_uid: "xxx",
				name: "Rain Water",
				cost_per_unit: 0,
				percent: 1
			}
		]
	},
	additives: {
		list: [
			{
				additive_uid: "xxx",
				name: "Rain FO (Aztec)",
				cost_per_unit: 1,
				calculation_type: "oz_ppo", // "percent_batch", "none"
				multiplier: 0.666,
				note: ""
			},
			{
				additive_uid: "yyy",
				name: "Deep Green Mica (Aztec)",
				calculation_type: "none",
				multiplier: 0,
				note: "1 tsp"
			}
		]
	}
});

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