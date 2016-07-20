const Config=()=>{
    let theme=
        {
            base:{hue:270,sat:100,lig:98},
            font:{hue:270,sat:50,lig:5},
            cursor:{hue:270,sat:50,lig:80},
            status:{hue:270,sat:100,lig:20},

        },
        font=
        {
            size:'20px',
            name:'serif',

        },
        set=(x,y,z)=>{theme[x][y]=z;},/* (base|font|cursor|status),(hue|sat|lig),value -> () */
        get=(x)=>`hsl(${theme[x].hue},${theme[x].sat}%,${theme[x].lig}%)`,/* (base|font|cursor|status) -> 'hsl(...)' */
        store=()=>JSON.stringify({theme:theme,font:font},null,0);

    return({
        get:get,
        set:set,
        font:font,
        theme:theme,
        store:store,
        init(ctx){
            ctx.font=this.font.size+' '+this.font.name;
        },
    });
};
