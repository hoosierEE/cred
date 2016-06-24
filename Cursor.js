/* Cursor
   Given a Buffer b:
   - keep track of editing "mode" (normal, insert, etc.)
   - modify b's point in response to motion commands
   - provide a "row, column" view of the Buffer (which is really just a String)
*/
const Cursor=(b)=>({

    /* STATE */

    cl:0,/* current line */
    co:0,/* current column */
    cx:0,/* maximum column */
    mode:'normal',/* insert, TODO visual, various "minor modes" */

    /* METHODS */

    curln(){return Math.max(0,b.lines.filter(x=>b.pt>x).length-1);},

    //bol(){return b.s[b.pt-1]==='\n';},
    //eol(){return b.s[b.pt]==='\n';},
    //eob(){return b.pt>=b.s.length;},

    move(fn,mult,arg=1){
        console.log([fn.name,mult,arg]);
        while(mult-->0){fn.call(this,arg);}
    },

    /* reversed substring */
    rs(x,y){return([...b.s.slice(x,y)].reverse().join(''));},

    /* Terminal searches always succeed. */

    /* beginning of buffer */
    bob(){return b.pt;},

    /* end of buffer */
    eob(){
        const dist=b.s.length-1-b.pt;
        return Math.max(0,dist);
    },

    /* beginning of line */
    bol(){
        const reg=rs(0,b.pt-(b.pt?1:0)).search(/.(?:\n)/);
        return(reg>=0)?(b.pt-reg+1):(this.bob());
    },

    /* distance from cursor to (eol|eob) */
    eol(){
        const reg=b.s.slice(b.pt+1).search(/.(?:\n)/);
        return(reg>=0)?(b.pt+reg):(this.eob());
    },

    /* distance from cursor to ((\n{2,})|eob) */
    forward_paragraph(){
        const reg=b.s.slice(b.pt+1).search(/.(?:\n{2,})/);
        return(reg>=0)?(b.pt+reg+3):(this.eob());
    },

    forward_word(){
        const reg=b.s.slice(b.pt+1).search(/\w\W/);
        return(reg>=0)?(reg+1):(this.eol());
    },

    backward_paragraph(){
        const reg=this.rs(0,b.pt-(b.pt?1:0)).search(/.(?:\n{2,})/);
        return(reg>=0)?(b.pt-(reg+3)):(this.bob());
        //if(reg>=0){b.pt-=reg+3;this.rowcol();}
        //else{this.to_bob();}
    },

    backward_word(){
        const reg=rs(0,b.pt).search(/\w\W/);
        return(reg>=0)?(reg+1):(this.bol());
        //if(reg>=0){this.left(reg+1,true);}
        //else{this.to_bol();}
    },

    /* Motion primitives */
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

    /* update cl,co,cx in response to a left or right motion */
    rowcol(){
        let cl=this.curln(), co=b.pt-(!cl?0:1)-b.lines[cl];
        //return [cl,co,cx]
        this.cl=cl;
        this.cx=this.co=co;
        //this.cl=this.curln();
        //this.cx=this.co=b.pt-(!this.cl?0:1)-b.lines[this.cl];
    },

    up(n){this.up_down_helper(Math.max(this.cl-n,0));},
    down(n){this.up_down_helper(Math.min(Math.max(0,b.lines.length-1),this.cl+n));},

    up_down_helper(target_line){
        const target_line_length=Math.max(0,b.getline(target_line).length-1);
        if(this.cx<0){this.co=target_line_length;}
        else{this.co=Math.min(Math.max(0,target_line_length),this.cx);}
        this.cl=target_line;
        if(target_line===0){b.pt=this.co;}
        else{b.pt=b.lines[target_line]+1+this.co;}
    },

    /* Change the text! */
    del_at_point(n=1){if(this.bol()&&this.eol()){return;}b.del(n);if(this.eol()){this.left(n);}},
    del_to_eol(){b.del(b.getline(this.cl).slice(this.co).length);this.left(1);},
    del_backward(n=1){b.del(-n);this.left(n,true);},
    del_forward(n=1){b.del(n);},
    ins(s){b.ins(s);},/* pass it on */

    /* Mode changers! */
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

    /* status : () -> 'modeline' */
    status(){return this.mode+'  '+this.cl+':'+this.co;},
});
