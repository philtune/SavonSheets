var Data = {

    get_table : function(table)
    {
        var result = {},
            substr = table+'[',
            substr_len = substr.length;
        $.each(Object.keys(localStorage), function(){
            if ( this.substr(0,substr_len) === substr ) {
                var item = JSON.parse(localStorage.getItem(this));
                result[item.uid] = item;
            }
        });
        return result;
    },

    get_table_row : function(table, uid)
    {
        return JSON.parse(localStorage.getItem(table+'['+uid+']'));
    },

    update_table_row : function(table, uid, data)
    {
        localStorage.setItem(table+'['+uid+']',JSON.stringify(data));
    },

    delete_table_row : function(table, uid)
    {
        localStorage.removeItem(table+'['+uid+']');
        //todo: make a soft delete
    }

};