const Configuration=()=>{
    const color=
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
          set=(x,y,z)=>{color[x][y]=z;},/* (base|font|cursor|status),(hue|sat|lig),value -> () */
          get=(x)=>`hsl(${color[x].hue},${color[x].sat}%,${color[x].lig}%)`,/* (base|font|cursor|status) -> 'hsl(...)' */
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
