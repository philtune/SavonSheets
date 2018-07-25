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
		fields: {
			settings: {
				type: 'category',
				fields: {
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
					return Helper.watch('made_at') + Helper.watch('settings.cure_days');
				}
			},
			oils: {
				type: 'category',
				fields: {
					list: {
						type: 'iterable',
						fields: {
							// todo: make foreign 'oil_key'=>['name','cost_per_unit','naoh_sap','koh_sap']
							oil_id: 'string',
							name: 'string', // todo: make foreign
							cost_per_unit: {}, // todo: make foreign
							naoh_sap: {}, // todo: make foreign
							koh_sap: {}, // todo: make foreign
							percent: {
								calculate: function(Helper){
									return Helper.watch('weight') / Helper.ignore('parent.weight');
								}
							},
							weight: {
								class: 'weight',
								calculate: function(Helper){
									return Helper.watch('parent.weight') * Helper.watch('percent');
								},
								is_tmp: true
							},
							naoh_weight: {
								class: 'weight',
								is_assignable: false,
								calculate: function(Helper){
									return Helper.watch('naoh_sap') * Helper.watch('weight');
								}
							},
							koh_weight: {
								class: 'weight',
								is_assignable: false,
								calculate: function(Helper){
									return Helper.watch('koh_sap') * Helper.watch('weight');
								}
							},
							cost: function(Helper){
								return Helper.watch('cost_per_unit') * Helper.watch('weight');
							}
						},
						save_empty: false
					},
					weight: {
						class: 'weight',
						calculate: function(Helper){
							return Helper.sum('list', 'weight').round(2);
						}
					},
					naoh_weight: {
						class: 'weight',
						is_assignable: false,
						calculate: function(Helper) {
							return Helper.sum('list', 'naoh_weight').round(2);
						}
					},
					koh_weight: {
						class: 'weight',
						is_assignable: false,
						calculate: function(Helper) {
							return Helper.sum('list', 'koh_weight').round(2);
						}
					},
					percent: function(Helper) {
						return Helper.sum('list', 'percent'); // FIXME: .sum is still not adding sum_watchers correctly
					},
					cost: function(Helper){
						return Helper.sum('list', 'cost').round(2);
					}
				}
			},
			lyes: {
				type: 'category',
				fields: {
					naoh: {
						type: 'category',
						fields: {
							percent: {
								calculate: function(Helper) {
									return 1 - Helper.watch('parent.koh.percent');
								}
							},
							cost_per_unit: {}, // todo: make foreign
							weight: {
								class: 'weight',
								is_assignable: false,
								calculate: function(Helper) {
									var percent = [1, 0, Helper.watch('percent')][Helper.watch('root.settings.lye_type')],
										discounted = (1 - Helper.watch('root.settings.lye_discount'));
									return Helper.watch('root.oils.naoh_weight') * percent * discounted;
								}
							},
							cost: function(Helper) {
								return Helper.watch('cost_per_unit') * Helper.watch('weight');
							}
						}
					},
					koh: {
						type: 'category',
						fields: {
							percent: {
								calculate: function(Helper) {
									return 1 - Helper.watch('parent.naoh.percent');
								}
							},
							cost_per_unit: {}, // todo: make foreign
							weight: {
								class: 'weight',
								is_assignable: false,
								calculate: function(Helper) {
									var percent = [1, 0, Helper.watch('percent')][Helper.watch('root.settings.lye_type')],
										discounted = (1 - Helper.watch('root.settings.lye_discount'));
									return Helper.watch('root.oils.koh_weight') * percent * discounted;
								}
							},
							cost: function(Helper) {
								return Helper.watch('cost_per_unit') * Helper.watch('weight');
							}
						}
					},
					weight: {
						class: 'weight',
						is_assignable: false,
						calculate: function(Helper) {
							return Helper.watch('naoh.weight') + Helper.watch('koh.weight');
						}
					},
					cost: function(Helper){
						return Helper.watch('naoh.cost') + Helper.watch('koh.cost');
					}
				}
			},
			liquids: {
				type: 'category',
				fields: {
					weight: {
						class: 'weight',
						is_assignable: false,
						calculate: function(Helper) {
							return Helper.watch('root.lyes.weight') * Helper.watch('root.settings.liquid_lye_ratio');
						}
					},
					list: {
						type: 'iterable',
						fields: {
							// todo: make foreign 'oil_key'=>['name','cost_per_unit','naoh_sap','koh_sap']
							name: 'string', // todo: make foreign
							cost_per_unit: {}, // todo: make foreign
							percent: {},
							weight: {
								class: 'weight',
								is_assignable: false,
								calculate: function(Helper) {
									return Helper.watch('parent.weight') * Helper.watch('percent');
								}
							},
							cost: function(Helper){
								return Helper.watch('cost_per_unit') * Helper.watch('weight');
							}
						},
						save_empty: false
					},
					percent: function(Helper){
						return Helper.sum('list', 'percent').round(2);
					},
					cost: function(Helper){
						return Helper.sum('list', 'cost');
					}
				}
			},
			additives: {
				type: 'category',
				fields: {
					list: {
						type: 'iterable',
						fields: {
							name: 'string',
							cost_per_unit: {}, // todo: make foreign
							output_type: {
								type: 'string',
								default: 'oz_ppo',
								options: ['oz_ppo', 'percent_batch', 'input_weight', 'note']
							},
							oz_ppo: {},
							percent_batch: {},
							input_weight: {
								class: 'weight'
							},
							note: 'string',
							weight: {
								class: 'weight',
								is_assignable: false,
								calculate: function(Helper) {
									// TODO
								}
							},
							cost: function(Helper){
								return Helper.watch('weight') * Helper.watch('cost_per_unit');
							}
						},
						save_empty: false
					},
					weight: {
						class: 'weight',
						is_assignable: false,
						calculate: function(Helper) {
							return Helper.sum('list', 'weight');
						}
					},
					cost: function(Helper){
						return Helper.sum('list', 'cost');
					}
				}
			},
			weight: {
				class: 'weight',
				is_assignable: false,
				calculate: function(Helper) {
					return Helper.watch([
						'oils.weight',
						'lyes.weight',
						'liquids.weight',
						'additives.weight'
					]);
				}
			},
			cost: function(Helper){
				return Helper.watch([
					'oils.cost',
					'lyes.cost',
					'liquids.cost',
					'additives.cost'
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
