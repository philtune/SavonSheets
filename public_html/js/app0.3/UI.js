var UI = {

    template_loaders : {},

    renderTemplate : function(key, data)
    {
        if ( key in templates ) {
            var template = templates[key];
            for ( var i in data ) {
                if (data.hasOwnProperty(i)) {
                    var val = data[i];
                    var regex = new RegExp('{{\\s*' + i + '\\s*}}', 'g');
                    template = template.replace(regex, val);
                }
            }
            return template;
        } else return false;
    },

    list_data : function(table, data_class, prepare_data)
    {
        var table_info = {
            recipe : ['#recipe_list', 'recipe_row'],
            oil    : ['#oil_list', 'oil_row']
        }[table];

        $(function(){
           var $container = $(table_info[0]).html('');
           $.each(Data.get_table(table), function(uid, row_obj){
               row_obj = $.extend(true, {}, row_obj);

               row_obj = prepare_data(row_obj);

               var $listing = $(UI.renderTemplate(table_info[1], row_obj));
               $listing.find('button')
                   .onTrigger(function(){
                       window[table] = data_class(uid);
                   });
               $container.append($listing);
           });
        });
    },

    list_recipes : function()
    {
        UI.list_data('recipe', Recipe, function(row_obj) {
            row_obj.created_at = new Date(row_obj.created_at).format('mmm dS, yyyy, h:MM:ss tt');
            row_obj.updated_at = new Date(row_obj.updated_at).format('mmm dS, yyyy, h:MM:ss tt');
            if ( !row_obj.hasOwnProperty('name') || !row_obj.name.trim() ) row_obj.name = 'Untitled';
            return row_obj;
        });
    },

    list_oils : function()
    {
        UI.list_data('oil', Oil, function(data) {
            if ( !data.name.trim() ) data.name = 'Untitled';
            return data;
        });
    },

    out_recipe_tmp : function(msg)
    {
        $(function(){
            $('#recipe_tmp_console').text(msg);
        })
    },

    out_recipe : function(msg)
    {
        $(function(){
            $('#recipe_console').text(msg);
        });
    },

    out_oil : function(msg)
    {
        $(function(){
            $('#oil_console').text(msg);
        });
    },

    toJSON : function(input)
    {
        var _result = '';
        $.each(arguments, function(key,val){_result+=JSON.stringify(val, null, '\t')+'\n'});
        return _result;
    }

};
