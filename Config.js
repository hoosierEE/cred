var Configuration=()=>({
    // STATE
    font_size:'20px',
    font_name:'courier new',//'Sans-Serif',
    status_bg:'hsl(300,100%,20%)',
    cursor_clr:'hsl(300,100%,60%)',

    // METHODS
    init(c){c.font=this.font_size+' '+this.font_name; c.fillStyle='hsl(300,100%,10%)';},
});
