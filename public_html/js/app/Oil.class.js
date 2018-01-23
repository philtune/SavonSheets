function Oil(uid)
{
	var data = {};

    function updateDb() {
        Data.update_table_row('oil', uid, data);
        UI.list_oils();
        UI.out_oil(UI.toJSON(data));
    }

    if ( uid !== undefined ) {
        data = Data.get_table_row('oil', uid);
        if ( !data ) {
            console.log('Oil(\''+uid+'\') does not exist');
            return {};
        }
    } else {
        uid = create_uid(3, Data.get_table('recipe'));
        data = {
            uid      : uid,
            name     : '',
            naoh_sap : 0,
            koh_sap  : 0
        };
        updateDb();
    }

    var _instance = {

        save: function() {

        },

        delete : function() {
            if ( confirm('Are you sure you want to delete this oil?') ) {
                Data.delete_table_row('oil', uid);
            }
            UI.list_oils();
            UI.out_oil('');
        }

    };

    app.defineInstanceProps(_instance, {
        uid : { data_obj: data },
        name : { data_obj: data },
        naoh_sap : {
            data_obj: data,
            is_number: true,
            set: function(val) {
                data.naoh_sap = app.round(val, 4);
                data.koh_sap = app.round(val * app.constants.koh_naoh_ratio, 4);
            }
        },
        koh_sap : {
            data_obj: data,
            is_number: true,
            set : function(val) {
                data.koh_sap = app.round(val, 4);
                data.naoh_sap = app.round(val / app.constants.koh_naoh_ratio, 4);
            }
        }
    }, updateDb);

    UI.out_oil(UI.toJSON(data));

    window['oil'] = _instance;

    return _instance;

}