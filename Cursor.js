var Cursor=(b)=>({// Buffer -> Cursor
    // STATE
    cl:0,// current line
    co:0,// current column
    cx:0,// maximum column
    fd:0,// f-d escape sequence
    mode:'normal',// insert, TODO visual, various "minor modes"

    // METHODS
    curln(){return Math.max(0,b.lines.filter(x=>b.pt>x).length-1);},// line containing point
    eol(){return b.s[b.pt]==='\n';},// end-of-line: cursor is on a newline
    bol(){return b.s[b.pt-1]==='\n';},// beginning-of-line: newline directly to left of cursor
    bob(){return b.pt===0;},// beginning of buffer
    eob(){return b.pt>=b.s.length;},// end of buffer

    rowcol(){
        this.cl=b.pt?this.curln():0;
        // subtract the extra newline except at line 0
        this.cx=this.co=b.pt-(!this.cl?0:1)-b.lines[this.cl];
    },

    // freely: allow moving past left-side limits
    left(n,freely=false){
        b.pt-=n;
        if(b.pt<0){b.pt=0;}
        if(!freely&&n===1&&b.s[b.pt]==='\n'){b.pt+=1;}
        this.rowcol();
    },

    // freely: allow moving past right-side limits
    right(n,freely=false){
        if(this.eob()||0===b.getline(this.curln()).length){return;}
        if(b.pt<b.s.length){
            if(b.s[b.pt+1]==='\n'&&n===1){b.pt+=freely?1:0;}
            else if(b.pt+n>b.s.length){b.pt=b.s.length-1;}
            else{b.pt+=n;}
        }
        this.rowcol();
    },

    esc_fd(){
        b.del(-2);
        this.left(2);
        if(this.eol()||this.eob()){this.left(1);}
        this.normal_mode();
    },

    append_mode(){this.mode='insert'; this.right(1,true);},
    empty_line(){return 0===b.getline(this.curln()).length;},
    insert_mode(){this.mode='insert';},
    normal_mode(){this.mode='normal';this.rowcol();},
    visual_mode(){this.mode='visual';},
    status(){return this.cl+':'+this.co;},

    up(n){this.up_down(Math.max(this.cl-n,0));},
    down(n){this.up_down(Math.min(Math.max(0,b.lines.length-1),this.cl+n));},
    up_down(target_line){
        var target_line_length=b.getline(target_line).length-1;
        this.co=Math.min(Math.max(0,target_line_length),this.cx);// try in order: maxco, len-1, 0
        this.cl=target_line;
        if(target_line===0){b.pt=this.co;}
        else{b.pt=b.lines[target_line]+1+this.co;}
    },
});