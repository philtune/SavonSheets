function Recipe()
{
	var data = {};
	if ( typeof arguments[0] === 'string' ) {
		var uid = arguments[0];
		data = {foo:'bar'};
	} else {
		data = arguments[0];
	}

	var recipe_calc = new Calculr({
		data: data,
		properties: {
			settings: {
				type: 'object',
				properties: {
					unit: {
						type: 'string',
						default: 'oz',
						options: ['oz','g','ml','lb','kg','l'],
						is_assignable: true
					},
					lye_discount: {
						type: 'number',
						default: 0.08,
						is_assignable: true
					},
					liquid_lye_ratio: {
						type: 'number',
						default: 1.8,
						is_assignable: true
					},
					cure_days: {
						type: 'number',
						default: 42,
						is_assignable: true
					}
				}
			},
			name: { // todo: remove from calculator but set elsewhere in Recipe class
				type: 'string',
				default: '',
				is_assignable: true
			},
			made_at: {
				type: 'date',
				default: 'NOW()',
				is_assignable: true
			},
			cured_at: {
				type: 'date',
				calculate: function(Helper){
					return Helper.require(Helper.root.made_at) + Helper.require(Helper.root.settings.cure_days);
				},
				is_assignable: false
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
								default: '',
								is_assignable: true
							},
							cost_per_unit: { // todo: make foreign
								type: 'number',
								default: 0,
								is_assignable: true
							},
							naoh_sap: { // todo: make foreign
								type: 'number',
								default: 0,
								is_assignable: true
							},
							koh_sap: { // todo: make foreign
								type: 'number',
								default: 0,
								is_assignable: true
							},
							percent: {
								type: 'number',
								default: 0,
								calculate: function(Helper){
									return Helper.require(Helper.self.weight) / Helper.parent.weight;
								},
								is_assignable: true
							},
							weight: {
								type: 'number',
								default: 0,
								is_assignable: true,
								calculate: function(Helper){
									return Helper.require(Helper.parent.weight) * Helper.require(Helper.self.percent);
								}
							},
							naoh_weight: {
								type: 'number',
								calculate: function(Helper){
									return Helper.require(Helper.self.naoh_sap) * Helper.require(Helper.self.weight);
								},
								is_assignable: false
							},
							koh_weight: {
								type: 'number',
								calculate: function(Helper){
									return Helper.require(Helper.self.koh_sap) * Helper.require(Helper.self.weight);
								},
								is_assignable: false
							},
							cost_per_batch: {
								type: 'number',
								calculate: function(Helper){
									return Helper.require(Helper.self.cost_per_unit) * Helper.require(Helper.self.weight);
								},
								is_assignable: false
							}
						}
					},
					percent: {
						type: 'number',
						default: 0,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'percent').round(2);
						},
						is_assignable: false
					},
					weight: {
						type: 'number',
						default: 0,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'weight').round(2);
						},
						is_assignable: true
					},
					naoh_weight: {
						type: 'number',
						default: 0,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'naoh_weight').round(2);
						},
						is_assignable: false
					},
					koh_weight: {
						type: 'number',
						default: 0,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'koh_weight').round(2);
						},
						is_assignable: false
					},
					cost_per_batch: {
						type: 'number',
						default: 0,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'cost_per_batch').round(2);
						},
						is_assignable: false
					}
				}
			},
			lyes: {
				type: 'object',
				properties: {
					type: {
						type: 'number',
						default: 0,
						options: [0,1,2],
						is_assignable: true
					},
					naoh: {
						type: 'object',
						properties: {
							parts: { // TODO: get rid of parts
								type: 'number',
								default: 1,
								is_assignable: true
							},
							percent: {
								type: 'number',
								default: 1,
								calculate: function (Helper) {
									return [
										1,
										0,
										Helper.require(Helper.self.parts) / (Helper.self.parts + Helper.require(Helper.parent.koh.parts))
									][Helper.require(Helper.parent.type)];
								},
								is_assignable: false
							},
							cost_per_unit: { // todo: make foreign
								type: 'number',
								default: 0,
								is_assignable: true
							},
							weight: {
								type: 'number',
								default: 0,
								is_assignable: false,
								calculate: function (Helper) {
									return Helper.require(Helper.root.oils.naoh_weight) * Helper.require(Helper.self.percent);
								}
							},
							cost_per_batch: {
								type: 'number',
								calculate: function (Helper) {
									return Helper.require(Helper.self.cost_per_unit) * Helper.require(Helper.self.weight);
								},
								is_assignable: false
							}
						}
					},
					koh: {
						type: 'object',
						properties: {
							parts: { // TODO: get rid of parts
								type: 'number',
								default: 0,
								is_assignable: true
							},
							percent: {
								type: 'number',
								default: 1,
								calculate: function (Helper) {
									return [
										0,
										1,
										Helper.require(Helper.self.parts) / (Helper.self.parts + Helper.require(Helper.parent.naoh.parts))
									][Helper.require(Helper.parent.type)];
								},
								is_assignable: false
							},
							cost_per_unit: { // todo: make foreign
								type: 'number',
								default: 0,
								is_assignable: true
							},
							weight: {
								type: 'number',
								default: 0,
								is_assignable: true,
								calculate: function (Helper) {
									return Helper.require(Helper.root.oils.koh_weight) * Helper.require(Helper.self.percent);
								}
							},
							cost_per_batch: {
								type: 'number',
								calculate: function (Helper) {
									return Helper.require(Helper.self.cost_per_unit) * Helper.require(Helper.self.weight);
								},
								is_assignable: false
							}
						}
					},
					weight: {
						type: 'number',
						default: 0,
						calculate: function(Helper){
							return Helper.require(Helper.self.naoh.weight) + Helper.require(Helper.self.koh.weight);
						},
						is_assignable: false
					},
					cost_per_batch: {
						type: 'number',
						default: 0,
						calculate: function(Helper){
							return Helper.require(Helper.self.naoh.cost_per_batch) + Helper.require(Helper.self.koh.cost_per_batch);
						},
						is_assignable: false
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
							return Helper.require(Helper.root.lyes.weight) * Helper.require(Helper.root.settings.liquid_lye_ratio);
						},
						is_assignable: false
					},
					list: {
						type: 'array',
						properties: {
							// todo: make foreign 'oil_key'=>['name','cost_per_unit','naoh_sap','koh_sap']
							name: { // todo: make foreign
								type: 'string',
								default: '',
								is_assignable: true
							},
							cost_per_unit: { // todo: make foreign
								type: 'number',
								default: 0,
								is_assignable: true
							},
							percent: {
								type: 'number',
								default: 0,
								is_assignable: true
							},
							weight: {
								type: 'number',
								default: 0,
								is_assignable: false,
								calculate: function(Helper){
									return Helper.require(Helper.parent.weight) * Helper.require(Helper.self.percent);
								}
							},
							cost_per_batch: {
								type: 'number',
								calculate: function(Helper){
									return Helper.require(Helper.self.cost_per_unit) * Helper.require(Helper.self.weight);
								},
								is_assignable: false
							}
						}
					},
					percent: {
						type: 'number',
						default: 0,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'percent').round(2);
						},
						is_assignable: false
					},
					cost_per_batch: {
						type: 'number',
						default: 0,
						calculate: function(Helper){
							return Helper.require(Helper.self.naoh.cost_per_batch) + Helper.require(Helper.self.koh.cost_per_batch);
						},
						is_assignable: false
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
								default: '',
								is_assignable: true
							},
							cost_per_unit: {
								type: 'number',
								default: 0,
								is_assignable: true
							},
							calculation_type: {
								type: 'string',
								default: 'oz_ppo',
								options: ['oz_ppo', 'percent_batch', 'none'],
								is_assignable: true
							},
							multiplier: {
								type: 'number',
								default: 0,
								is_assignable: true
							},
							weight: {
								type: 'number',
								default: 0,
								calculation: function(Helper){
									//todo
								},
								is_assignable: true
							},
							cost_per_batch: {
								type: 'number',
								default: 0,
								calculation: function(Helper){
									return Helper.require(Helper.self.weight) * Helper.require(Helper.self.cost_per_unit);
								},
								is_assignable: false
							},
							note: {
								type: 'string',
								default: '',
								is_assignable: true
							}
						}
					},
					weight: {
						type: 'number',
						default: 0,
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'weight');
						},
						is_assignable: false
					},
					cost_per_batch: {
						type: 'number',
						default: 0,
						calculate: function(){
							return Helper.sum(Helper.self.list, 'cost_per_batch');
						},
						is_assignable: false
					}
					//todo
				}
			},
			weight: {
				type: 'number',
				default: 0,
				calculate: function(Helper){
					return Helper.require([
						Helper.self.oils.weight,
						Helper.self.lyes.weight,
						Helper.self.liquids.weight,
						Helper.self.additives.weight
					]);
				},
				is_assignable: false //todo: eventually this could be true
			},
			cost_per_batch: {
				type: 'number',
				default: 0,
				calculate: function(Helper){
					return Helper.require([
						Helper.self.oils.cost_per_batch,
						Helper.self.lyes.cost_per_batch,
						Helper.self.liquids.cost_per_batch,
						Helper.self.additives.cost_per_batch
					]);
				},
				is_assignable: false //todo: eventually this could be true
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
				"cost_per_batch": 1.36, // C (cost_per_unit * weight)
				weight: 8
			},
			{
				"naoh_weight": 1.128,
				"koh_weight": 1.584,
				"cost_per_batch": 0.96,
				weight: 8
			},
			{
				"naoh_weight": 1.424,
				"koh_weight": 2.056,
				"cost_per_batch": 0.86,
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
		"list_cost_per_batch": function(){
			return list_count(this, "cost_per_batch");
		},
		"percent": 1, // C (list_percent())
		"naoh_weight": 3.624, // C (list_naoh_weight())
		"koh_weight": 5.144, // C (list_koh_weight())
		"cost_per_batch": 3.18 // C (list_cost_per_batch())
	},
	lyes: {
		"list": [
			{
				"weight": 3.33408, // C ((parent.parent.oils.naoh_weight * (1 - parent.discount)) * ([1,0,percent][parent.type])
				"cost_per_batch": 0.53345 // C (weight * cost_per_unit)
			},
			{
				"weight": 0, // C ((parent.parent.oils.koh_weight * (1 - parent.discount)) * [0,1,percent][parent.percent])
				"cost_per_batch": 0 // C (weight * cost_per_unit)
			}
		],
		"list_reorder": function(){
			list_reorder.apply(this, arguments);
		},
		"lye_weight": function(){
			return list_count(this.list, "weight");
		},
		"list_cost_per_batch": function(){
			return list_count(this, "cost_per_batch");
		},
		"weight": 3.33408, // C (lye_weight())
		"cost_per_batch": 0.53345 // C (naoh.cost_per_batch + koh.cost_per_batch)
	},
	liquids: {
		"list": [
			{
				"weight": 6.001344, // C (parent.weight * percent)
				"cost_per_batch": 0 // C (cost_per_unit * weight)
			}
		],
		"list_reorder": function(){
			list_reorder.apply(this, arguments);
		},
		"liquids_weight": function(){
			return recipe_data.lye.weight;
		},
		"list_cost_per_batch": function(){
			return list_count(this, "cost_per_batch");
		},
		"weight": 6.001344, // C (parent.lye.weight * liquid_lye_ratio)
		"cost_per_batch": 0 // C (liquids_cost_per_batch())
	},
	additives: {
		"list" :[
			{
				"weight": 1, // C (parent.oils.weight * calculation)
				"cost_per_batch": 1 // C (weight * cost_per_unit)
			},
			{
			}
		],
		"weight": 1, // C (additives_weight())
		"cost_per_batch": 0 // C (additives_cost_per_batch())
	},
	weight: 34.335424, // C (oils.weight + lye.weight + liquids.weight + additives.weight)
	cost_per_batch: 4.71 // C (oils.cost_per_batch + lye.cost_per_batch + liquids.cost_per_batch + additives.cost_per_batch)
};