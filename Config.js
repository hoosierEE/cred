'use strict';
var Configuration=()=>({// class
    // STATE
    font_size:'20px',
    //font_name:'Sans-Serif',
    font_name:'courier new',
    // METHODS
    init(c){c.font=this.font_size+' '+this.font_name; c.fillStyle='#dacaba';},
});
