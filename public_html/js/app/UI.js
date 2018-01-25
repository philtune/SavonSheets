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
           $.each(Data.get_table(table), function(uid, data){
               data = $.extend(true, {}, data);

               data = prepare_data(data);

               var $listing = $(UI.renderTemplate(table_info[1], data));
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
        UI.list_data('recipe', Recipe, function(data) {
            data.created_at = new Date(data.created_at).format('mmm dS, yyyy, h:MM:ss tt');
            data.updated_at = new Date(data.updated_at).format('mmm dS, yyyy, h:MM:ss tt');
            if ( !data.hasOwnProperty('name') || !data.name.trim() ) data.name = 'Untitled';
            return data;
        });
    },

    list_oils : function()
    {
        UI.list_data('oil', Oil, function(data){
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
