function Recipe()
{
	var data = {};
	if ( typeof arguments[0] === 'string' ) {
		var uid = arguments[0];
		data = {foo:'bar'};
	} else if ( arguments.length ) {
		// fixme: probably don't accept objects as argument but only a uid and pull data within this class
		data = arguments[0];
	}

	var recipe_Calculr = new Calculr({
		data: data,
		tmp_data: {},
		properties: {
			settings: {
				type: 'category',
				properties: {
					unit: {
						type: 'string',
						default: 'oz',
						options: ['oz','g','ml','lb','kg','l']
					},
					lye_type: {
						options: [0,1,2]
					},
					lye_discount:{
						default: 0.05
					},
					liquid_lye_ratio: {
						default: 1.8
					},
					cure_days: {
						default: 42
					}
				}
			},
			name: 'string', // todo: remove from calculator but set elsewhere in Recipe class
			note: 'string', // todo: remove from calculator but set elsewhere in Recipe class
			created_at: 'date',
			updated_at: 'date',
			deleted_at: 'date',
			made_at: 'date', // todo: default will actually be turned into unix, NOW() will always be default if this is not defined
			cured_at: {
				type: 'date',
				is_assignable: false,
				calculate: function(Helper){
					// todo: apply date conversions
					return Helper.watch(Helper.properties.made_at) + Helper.watch(Helper.properties.settings.cure_days);
				}
			},
			oils: {
				type: 'category',
				properties: {
					list: {
						type: 'list',
						properties: {
							// todo: make foreign 'oil_key'=>['name','cost_per_unit','naoh_sap','koh_sap']
							oil_id: 'string',
							name: 'string', // todo: make foreign
							cost_per_unit: {}, // todo: make foreign
							naoh_sap: {}, // todo: make foreign
							koh_sap: {}, // todo: make foreign
							percent: {
								calculate: function(Helper){
									return Helper.watch(Helper.self.weight) / Helper.parent.weight;
								}
							},
							weight: {
								calculate: function(Helper){
									return Helper.watch(Helper.parent.weight) * Helper.watch(Helper.self.percent);
								},
								is_tmp: true
							},
							naoh_weight: function(Helper){
								return Helper.watch(Helper.self.naoh_sap) * Helper.watch(Helper.self.weight);
							},
							koh_weight: function(Helper){
								return Helper.watch(Helper.self.koh_sap) * Helper.watch(Helper.self.weight);
							},
							cost: function(Helper){
								return Helper.watch(Helper.self.cost_per_unit) * Helper.watch(Helper.self.weight);
							}
						},
						save_empty: false
					},
					weight: {
						calculate: function(Helper){
							return Helper.sum(Helper.self.list, 'weight').round(2);
						}
					},
					percent: function(Helper){
						return Helper.sum(Helper.self.list, 'percent');
					},
					naoh_weight: function(Helper){
						return Helper.sum(Helper.self.list, 'naoh_weight').round(2);
					},
					koh_weight: function(Helper){
						return Helper.sum(Helper.self.list, 'koh_weight').round(2);
					},
					cost: function(Helper){
						return Helper.sum(Helper.self.list, 'cost').round(2);
					}
				}
			},
			lyes: {
				type: 'category',
				properties: {
					naoh: {
						type: 'category',
						properties: {
							percent: {
								calculate: function(Helper) {
									return 1 - Helper.watch(Helper.parent.koh.percent);
								}
							},
							cost_per_unit: {}, // todo: make foreign
							weight: function(Helper) {
								var percent = [1,0,Helper.watch(Helper.self.percent)][Helper.watch(Helper.properties.settings.lye_type)],
									discounted = (1 - Helper.watch(Helper.properties.settings.lye_discount));
								return Helper.watch(Helper.properties.oils.naoh_weight) * percent * discounted;
							},
							cost: function(Helper) {
								return Helper.watch(Helper.self.cost_per_unit) * Helper.watch(Helper.self.weight);
							}
						}
					},
					koh: {
						type: 'category',
						properties: {
							percent: {
								calculate: function(Helper) {
									return 1 - Helper.watch(Helper.parent.naoh.percent);
								}
							},
							cost_per_unit: {}, // todo: make foreign
							weight: function(Helper) {
								var percent = [1,0,Helper.watch(Helper.self.percent)][Helper.watch(Helper.properties.settings.lye_type)],
									discounted = (1 - Helper.watch(Helper.properties.settings.lye_discount));
								return Helper.watch(Helper.properties.oils.koh_weight) * percent * discounted;
							},
							cost: function(Helper) {
								return Helper.watch(Helper.self.cost_per_unit) * Helper.watch(Helper.self.weight);
							}
						}
					},
					weight: function(Helper){
						return Helper.watch(Helper.self.naoh.weight) + Helper.watch(Helper.self.koh.weight);
					},
					cost: function(Helper){
						return Helper.watch(Helper.self.naoh.cost) + Helper.watch(Helper.self.koh.cost);
					}
				}
			},
			liquids: {
				type: 'category',
				properties: {
					weight: function(Helper){
						return Helper.watch(Helper.properties.lyes.weight) * Helper.watch(Helper.properties.settings.liquid_lye_ratio);
					},
					list: {
						type: 'list',
						properties: {
							// todo: make foreign 'oil_key'=>['name','cost_per_unit','naoh_sap','koh_sap']
							name: 'string', // todo: make foreign
							cost_per_unit: {}, // todo: make foreign
							percent: {},
							weight: function(Helper){
								return Helper.watch(Helper.parent.weight) * Helper.watch(Helper.self.percent);
							},
							cost: function(Helper){
								return Helper.watch(Helper.self.cost_per_unit) * Helper.watch(Helper.self.weight);
							}
						},
						save_empty: false
					},
					percent: function(Helper){
						return Helper.sum(Helper.self.list, 'percent').round(2);
					},
					cost: function(Helper){
						return Helper.watch(Helper.self.naoh.cost) + Helper.watch(Helper.self.koh.cost);
					}
				}
			},
			additives: {
				type: 'category',
				properties: {
					list: {
						type: 'list',
						properties: {
							name: 'string',
							cost_per_unit: {}, // todo: make foreign
							output_type: {
								type: 'string',
								default: 'oz_ppo',
								options: ['oz_ppo', 'percent_batch', 'input_weight', 'note']
							},
							oz_ppo: {},
							percent_batch: {},
							input_weight: {},
							note: 'string',
							weight: function(Helper){
								// TODO
							},
							cost: function(Helper){
								return Helper.watch(Helper.self.weight) * Helper.watch(Helper.self.cost_per_unit);
							}
						},
						save_empty: false
					},
					weight: function(Helper){
						return Helper.sum(Helper.self.list, 'weight');
					},
					cost: function(Helper){
						return Helper.sum(Helper.self.list, 'cost');
					}
				}
			},
			weight: function(Helper){
				return Helper.watch([
					Helper.self.oils.weight,
					Helper.self.lyes.weight,
					Helper.self.liquids.weight,
					Helper.self.additives.weight
				]);
			},
			cost: function(Helper){
				return Helper.watch([
					Helper.self.oils.cost,
					Helper.self.lyes.cost,
					Helper.self.liquids.cost,
					Helper.self.additives.cost
				]);
			}
		},
		methods: {
			// todo: method that rebalances all weights?
		},
		onUpdate: function(recipe) {
			$('#recipe_console').text(JSON.stringify(recipe.data, null, '\t'));
			$('#recipe_tmp_console').text(JSON.stringify(recipe.tmp_data, null, '\t'));
		}
	}).init(function(recipe) {
		$('#recipe_console').text(JSON.stringify(recipe.data, null, '\t'));
		$('#recipe_tmp_console').text(JSON.stringify(recipe.tmp_data, null, '\t'));
	});

	window.recipe_Calculr = recipe_Calculr;

	return recipe_Calculr.calculator; //fixme: should return Calculr.calculator
}
