'use strict';
var Cursor=(b)=>({// class
    /* Cursor
       Given a Buffer b:
       - keep track of editing "mode" (normal, insert, etc.)
       - modify b's point in response to motion commands
       - provide a "row, column" view of the Buffer (which is really just a String)
    */

    // STATE
    cl:0,// current line
    co:0,// current column
    cx:0,// maximum column
    mode:'normal',// insert, TODO visual, various "minor modes"

    // METHODS

    // where is the cursor?
    curln(){return Math.max(0,b.lines.filter(x=>b.pt>x).length-1);},
    bol(){return b.s[b.pt-1]==='\n';},
    eol(){return b.s[b.pt]==='\n';},
    eob(){return b.pt>=b.s.length;},

    // Search resulting in motion
    to_bol(){this.left(this.co);},
    to_eol(){this.right(b.getline(this.cl).length-this.co-(this.eol()?0:1));this.cx=-1;},
    to_bob(){b.pt=0;this.rowcol();},
    to_eob(){b.pt=b.s.length-1;this.rowcol();},
    forward_dist_to(nth,thing){
        var dist=0,pos=b.pt+1;
        for(var i=0;i<nth;++i){
            var reg=b.s.slice(pos).search(thing);
            if(reg<0){return -1;}// none found
            else{dist+=reg+1;pos+=reg+1;}
        }
        return dist;
    },
    backward_dist_to(nth,thing){
        // find all things, return pt-(index of start of nth thing from end)
        var m,start=0,things=[],end=b.pt-1;
        while((m=b.s.slice(start,end).match(thing))!==null){
            var [t,l]=[m[0],m[0].length];
            things.push([t,l]);
            start+=l+1;
            if(start>=end-1){break;}
        }
        return JSON.stringify(things,null,1);
    },
    forward_paragraph(){
        var reg=b.s.slice(b.pt+1).search(/.(?:\n{2,})/);
        if(reg>=0){b.pt+=reg+3;this.rowcol();}
        else{this.to_eob();}
    },
    forward_word(){
        var reg=b.s.slice(b.pt+1).search(/\w\W/);
        if(reg>=0){this.right(reg+1,true);}
        else{this.to_eol();}
    },
    forward_to_char(c){
        if(this.eol()){this.cx=-1;return;}
        var ca=b.getline(this.cl).slice(this.co+1).indexOf(c);
        if(ca>=0){this.right(ca+1);}
    },
    backward_paragraph(){
        var reg=[...b.s.slice(0,b.pt-(b.pt?1:0))].reverse().join('').search(/.(?:\n{2,})/);
        if(reg>=0){b.pt-=reg+3;this.rowcol();}
        else{this.to_bob();}
    },
    backward_word(){
        var reg=[...b.s.slice(0,b.pt)].reverse().join('').search(/\w\W/);
        if(reg>=0){this.left(reg+1,true);}
        else{this.to_bol();}
    },
    backward_to_char(c){
        if(this.bol()){return;}
        var ca=[...b.getline(this.cl).slice(0,this.co)].reverse().indexOf(c);
        if(ca>=0){this.left(ca+1);}
    },

    // Motion primitives
    left(n=0,freely=false){
        b.pt-=n;if(b.pt<0){b.pt=0;}
        if(!freely&&n===1&&b.s[b.pt]==='\n'){b.pt+=1;}
        this.rowcol();
    },
    right(n=0,freely=false){
        if(this.eob()){return;}
        if(b.pt<b.s.length){
            if(b.s[b.pt+1]==='\n'&&n===1){b.pt+=freely?1:0;}
            else if(b.pt+n>b.s.length){b.pt=b.s.length-1;}
            else{b.pt+=n;}
        }
        this.rowcol();
    },
    rowcol(){
        this.cl=b.pt?this.curln():0;
        this.cx=this.co=b.pt-(!this.cl?0:1)-b.lines[this.cl];
    },
    up(n){this.up_down_helper(Math.max(this.cl-n,0));},
    down(n){this.up_down_helper(Math.min(Math.max(0,b.lines.length-1),this.cl+n));},
    up_down_helper(target_line){
        target_line|=0;// remove floats
        var target_line_length=Math.max(0,b.getline(target_line).length-1);
        if(this.cx<0){this.co=target_line_length;}
        else{this.co=Math.min(Math.max(0,target_line_length),this.cx);}
        this.cl=target_line;
        if(target_line===0){b.pt=this.co;}
        else{b.pt=b.lines[target_line]+1+this.co;}
    },

    // Editing actions
    del_at_point(n=1){if(this.bol()&&this.eol()){return;}b.del(n);if(this.eol()){this.left(n);}},
    del_to_eol(){b.del(b.getline(this.cl).slice(this.co).length);this.left(1);},
    del_backward(n=1){b.del(-n);this.left(n,true);},
    del_forward(n=1){b.del(n);},
    ins(s){b.ins(s);},// pass it on

    // Mode changers
    esc(n=0){
        this.del_backward(n);
        if(!this.bol()){this.left(1);}
        this.normal_mode();
        this.rowcol();
    },
    append_mode(){this.mode='insert';this.right(+!this.eol(),true);},
    insert_mode(){this.mode='insert';},
    normal_mode(){this.mode='normal';},
    visual_mode(){this.mode='visual';},

    // status : () -> String // contains the modeline
    status(){return this.mode+'  '+this.cl+':'+this.co;},
});
