var Configuration=()=>({
    // STATE
    font_size:'20px',
    font_name:'courier new',//'Sans-Serif',
    status_bg:'hsl(270,100%,20%)',
    cursor_clr:'hsl(270,100%,60%)',
    app_bg:'hsl(270,100%,98%)',

    // METHODS
    init(c){c.font=this.font_size+' '+this.font_name; c.fillStyle='hsl(270,100%,10%)';},
});
