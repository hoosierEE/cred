var Configuration=()=>{
    var color=
        {
            base:{hue:270,sat:100,lig:98},
            font:{hue:270,sat:50,lig:5},
            cursor:{hue:270,sat:50,lig:80},
            status:{hue:270,sat:100,lig:20},
        },
        font=
        {
            size:'20px',
            name:'courier new',
        },
        //set_global=(x,y)=>{for(var i in color){color[i][x]=y;}},
        set=(x,y,z)=>{for(var i in color[z]){color[z][i][x]=y;}},
        get=(x)=>`hsl(${color[x].hue},${color[x].sat}%,${color[x].lig}%)`,
        store=()=>JSON.stringify({color:color,font:font},null,0);

    return ({
        get:get,
        set:set,
        font:font,
        color:color,
        store:store,
        init(ctx){
            ctx.font=this.font.size+' '+this.font.name;
        },
    })
};
