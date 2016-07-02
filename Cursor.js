/* Cursor
   Given a Buffer b:
   - keep track of editing "mode" (normal, insert, etc.)
   - move, yank, change, or delete text (yank overwrites clipboard)
   - paste (insert at point) from clipboard
   - modify b's point in response to motion commands
   - provide a "row, column" view of the Buffer (which is really just a String)
*/
const Cursor=(b)=>({
    cl:0,/* current line */
    co:0,/* current column */
    cx:0,/* maximum column */
    mode:'normal',/* insert, TODO visual, various "minor modes" */

    /* METHODS
       1. search for desired new cursor position
       2. if search fails, try alternate which necessarily succeeds
       3. apply verb, which is one of:
       move: just update cursor position
       yank: copy range of text, overwriting clipboard contents
       delete: yank then call buf.del() on the range
       change: yank, delete, then insert_mode()
    */

    curln(){return Math.max(0,b.lines.filter(x=>b.pt>x).length-1);},

    move(fn,mult){
        console.log([fn.name,mult]);
        while(mult-->0){fn.call(this);}
    },

    /* SIGNED SEARCH (example usage: new=old+search)
       0 target is at cursor
       - target is left of cursor
       + target is right of cursor */

    /* helper: reversed substring */
    rs(x,y){return([...b.s.slice(x,y)].reverse().join(''));},

    /* >=0 */
    eob(){const dist=b.s.length-1-b.pt; return Math.max(0,dist);},
    eol(){/* |eob */
        const reg=b.s.slice(b.pt+1).search(/.(?:\n)/);
        return(reg>=0)?(reg):(this.eob());
    },
    end_of_word(){/* |eol */
        const reg=b.s.slice(b.pt+1).search(/\w\W/);
        return(reg>=0)?(reg+1):(this.eol());
    },
    end_of_paragraph(){/* |eob */
        const reg=b.s.slice(b.pt+1).search(/.(?:\n{2,})/);
        return(reg>=0)?(reg+3):(this.eob());
    },

    /* <=0 */
    bob(){return -b.pt;},
    bol(){/* |bob */
        const reg=this.rs(0,b.pt-(b.pt?1:0)).search(/.(?:\n)/);
        return(reg>=0)?(-reg+1):(this.bob());
    },
    beginning_of_word(){/* |bol */
        const reg=this.rs(0,b.pt).search(/\w\W/);
        return(reg>=0)?(-(reg+1)):(this.bol());
    },
    beginning_of_paragraph(){/* |bob */
        const reg=this.rs(0,b.pt-(b.pt?1:0)).search(/.(?:\n{2,})/);
        return(reg>=0)?(-(reg+3)):(this.bob());
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
        const cl=this.curln(), co=b.pt-(!cl?0:1)-b.lines[cl];
        //return [cl,co,cx]
        this.cl=cl;
        this.cx=this.co=co;
        //this.cl=this.curln();
        //this.cx=this.co=b.pt-(!this.cl?0:1)-b.lines[this.cl];
    },

    up(n=1){this.up_down_helper(Math.max(this.cl-n,0));},
    down(n=1){this.up_down_helper(Math.min(Math.max(0,b.lines.length-1),this.cl+n));},

    up_down_helper(target_line){
        const target_line_length=Math.max(0,b.getline(target_line).length-1);
        if(this.cx<0){this.co=target_line_length;}
        else{this.co=Math.min(Math.max(0,target_line_length),this.cx);}
        this.cl=target_line;
        if(target_line===0){b.pt=this.co;}
        else{b.pt=b.lines[target_line]+1+this.co;}
    },

    /* Change the text! */
    // TODO - immutable methods
    //bol(){return b.s[b.pt-1]==='\n';},
    //eol(){return b.s[b.pt]==='\n';},
    //eob(){return b.pt>=b.s.length;},
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
