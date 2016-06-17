var Configuration=()=>({
    /* FONT */
    font_size:'20px',
    font_name:'courier new',
    font_color:'hsl(270,100%,5%)',

    status_bg:'hsl(270,100%,20%)',
    cursor_clr:'hsl(270,50%,80%)',
    app_bg:'hsl(270,100%,98%)',

    /* METHODS */
    init(c){c.font=this.font_size+' '+this.font_name;},
});
