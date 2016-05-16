/* Cursor.js
   Given a Buffer b:
   * keep track of editing "mode" (normal, insert, etc.)
   * modify b's point in response to motion commands
   * provide a "row, column" view of the Buffer (which is really just a String)
   * FSM for multi-part commands (e.g: `dt;` which means: delete from Point to first occurrence of ';')
 */
var Cursor=(b)=>({// Buffer -> Cursor
    // STATE
    cl:0,// current line
    co:0,// current column
    cx:0,// maximum column
    fd:0,// f-d escape sequence
    mode:'normal',// insert, TODO visual, various "minor modes"

    fsm:{mode:'normal',multiplier:'1',argument:0},

    // METHODS
    curln(){return Math.max(0,b.lines.filter(x=>b.pt>x).length-1);},
    bol(){return b.s[b.pt-1]==='\n';},
    eol(){return b.s[b.pt]==='\n';},
    eob(){return b.pt>=b.s.length;},
    empty_line(){return 0===b.getline(this.curln()).length;},

    // Search
    to_bol(){if(!this.bol()){this.left(this.co);}},
    to_eol(){if(!this.eol()){this.right(b.getline(this.cl).length-this.co-1);this.cx=-1;}},
    to_bob(){b.pt=0;this.rowcol();},
    to_eob(){b.pt=b.s.length-1;this.rowcol();},
    forward_paragraph(){
        var ra=b.s.slice(b.pt+1).search(/\n{2,}/);
        if(ra>=0){b.pt+=ra+2;this.rowcol();}
        else{this.to_eob();}
    },
    backward_paragraph(){
        var ra=b.s.slice(0,b.pt).split('').reverse().join('').search(/\n{2,}/);
        if(ra>=0){b.pt-=ra+1;this.rowcol();}
        else{this.to_bob();}
    },
    forward_word(){
        var ra=b.s.slice(b.pt+1).search(/\w\W/);if(ra>=0){this.right(ra+1,true);}
    },
    backward_word(){
        var ra=b.s.slice(0,b.pt).split('').reverse().join('').search(/(\w\W)|(\W)/);
        if(ra>=0){this.left(ra+1,true);}
    },
    forward_to_char(c){
        if(this.eol()){this.cx=-1;return;}
        var ca=b.getline(this.cl).slice(this.co+1).indexOf(c);
        if(ca>=0){this.right(ca+1);}
    },
    backward_to_char(c){
        if(this.bol()){return;}
        var ca=b.getline(this.cl).slice(0,this.co).split('').reverse().indexOf(c);
        if(ca>=0){this.left(ca+1);}
    },

    // Motion
    left(n,freely=false){
        b.pt-=n;if(b.pt<0){b.pt=0;}
        if(!freely&&n===1&&b.s[b.pt]==='\n'){b.pt+=1;}
        this.rowcol();
    },
    right(n,freely=false){
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
        var target_line_length=b.getline(target_line).length-1;
        if(this.cx<0){this.co=target_line_length;}
        else{this.co=Math.min(Math.max(0,target_line_length),this.cx);}
        this.cl=target_line;
        if(target_line===0){b.pt=this.co;}
        else{b.pt=b.lines[target_line]+1+this.co;}
    },

    // MODE changers
    esc_fd(){b.del(-2);this.left(2);if(this.eol()||this.eob()){this.left(1);}this.normal_mode();},
    append_mode(){this.mode='insert'; this.right(1,true);},
    insert_mode(){this.mode='insert';},
    normal_mode(){this.mode='normal';this.rowcol();},
    visual_mode(){this.mode='visual';},

    // Parse a multi-part command
    fsm:{mul:'',verb:'',subj:''},
    parse(dec){
        if(dec.code.search(/\d/)!==-1){this.fsm.mul+=dec.code;}
        if(dec.code.search(/[fFtT]/)!==-1){this.fsm.verb='find';}
        console.log(this.fsm);
    },

    // status : () -> String // contains the modeline
    status(){return this.mode+'  '+this.cl+':'+this.co;},
});
