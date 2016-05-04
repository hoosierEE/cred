// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    MODE='normal',// Vim modes: normal, insert, visual[-block, -line], etc.
    ESC_FD=0,// 'fd' escape sequence
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    Cursor=(b)=>{// Buffer -> Cursor
        // Cursor translates motion inputs into new Buffer indexes.
        // Because Buffer is line-oriented, Cursor has a concept of where, in terms of
        // lines and columns, the point should be after a move.
        // Cursor also handles selection, as in selection-start and selection-end, block selection, ...?
        var cc={
            cl:0,// current line
            co:0,// current column
            cx:0,// maximum column
            selection_start:0,// indexs from left edge of first selected char
            selection_end:0,// index at left edge of last selected char
            log(){
                console.log('cl: '+this.cl+', co:'+this.co+', cx:'+this.cx);
            },
            left(n){
                if(b.pt-n<0){b.pt=0;this.co=0;}
                else if(n===-1&&b.s[b.pt-1]==='\n'){return;}// h doesn't cross '\n'
                else{
                    b.pt-=n;
                    this.cl=b.linearray().map(x=>b.pt>=x).lastIndexOf(true);
                    this.co=b.pt-b.lines[this.cl];
                }
                this.cx=this.co;// left or right movement overrides maximum column
                this.log();
            },
            right(n){
                if(b.pt+n>b.s.length){b.pt=b.s.length;}// b.s[b.s.length-1] is last char, so this puts pt past it
                else if(n===1&&'\n'===b.s[b.pt+1]){return;}// l doesn't cross '\n'
                else{
                    b.pt+=n;
                    this.cl=b.linearray().map(x=>b.pt>=x).lastIndexOf(true);// line containing point
                    this.co=b.pt-b.lines[this.cl];
                }
                this.cx=this.co;
                this.log();
            },
            up(n){
                // concept: move the point backward to the start of the line above,
                // then forward to cx, stopping at max of EOL or cx
                this.cl=b.linearray().map(x=>b.pt>=x).lastIndexOf(true);
                this.co=b.pt-b.linearray()[this.cl];
                var target_line=Math.min(0,this.cl-n);
                var target_column=Math.max(b.pt-b.linearray()[target_line],this.cx)
                this.log();
            },
            down(n){
                this.cl=b.linearray().map(x=>b.pt>=x).lastIndexOf(true);// line containing point
                this.co=b.pt-b.linearray()[this.cl];
                this.log();
            },
            append_mode(){if(b.s[b.pt]!=='\n'){this.right(1);}},
            insert_mode(){},// intentionally left blank
            esc_fd(){b.del(-2);this.left(2);},
            select(sel_mode){},
        };
        // initialize this instance
        return cc;
    },
    Buffer=()=>{// ()->Buffer // Buffer is a String with line and point metadata.
        // Handles insert/delete at the given point
        var bb={
            linearray(){// ()->[Int] // index of each line's start
                if(this.txt_changed||this.lines.length===0){
                    this.lines=this.s.split('').reduce((prev,next,i)=>{
                        next==='\n'&&prev.push(i);return prev;
                    },[0]);
                } return this.lines;// cached array if text is unchanged
            },

            getline(n){// Int->String // the entire line
                var l=this.linearray(),len=l.length;
                if(0<n&&n<len){return this.s.slice(l[n]+1,l[n+1]);}// line in middle
                else if(n===0){return this.s.slice(0,l[1]);}// first
                else if(len<=n){return this.s.slice(1+l[len-1]);}// last
                else{return this.getline(Math.max(0,len+n));}// negative n indexes backwards but doesn't wrap
            },

            ins(ch){// insert ch chars to right of p
                this.txt_changed=true;
                if(this.pt===this.s.length){this.s=this.s+ch;}
                else{var fst=this.s.slice(0,this.pt), snd=this.s.slice(this.pt); this.s=fst+ch+snd;}
                var cur_line=this.lines.filter(a=>a<=this.pt)[0]|0;
                //for(var i=0;i<ch.length;++i){
                //    if(ch[i]==='\n'){
                //        this.lin[0]=this.lin[1];
                //        this.lin[1]+=1;
                //    }
                //}
                this.linearray();
                this.pt+=ch.length;
                //this.mov(ch.length,true);
            },

            left_delete(n){
                if(n===0){return;}
                if(n+this.pt0<0){//delete from pt to beginning of buffer
                }
            },

            right_delete(n){
            },

            del(n){// delete n chars to right of p (or left if n<0)
                if(n===0||n+this.pt<0){return;}
                this.txt_changed=true;
                var leftd=n<0?n:0, rightd=n<0?0:n;
                var fst=this.s.slice(0,this.pt+leftd),
                    snd=this.s.slice(this.pt+rightd);
                this.s=fst+snd;
            },
        };
        bb.s='';// plain old string
        bb.pt=0;// cursor index
        bb.lin=[0,0];// line [previous, current]
        bb.col=[0,0,0];// column [previous, current, previous_maximum] == n chars to right of BOL
        bb.lines=[];// BOL indexes
        bb.linearray();// populate lines
        return bb;
    },
    ScreenOffsets=()=>({
        x:20,// border width
        lmul(lnum){return this.y+this.lh*lnum-this.h;},
        init(ctx){this.lh=this.h=ctx.measureText('W').width;this.y=this.h+this.x;}
    }),
    buf=Buffer(),
    cur=Cursor(buf),
    offs=ScreenOffsets();

var render_text=()=>{
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    // render all the lines
    // TODO: only render visible lines.
    // use the "cursor visible" constriant to do this?
    buf.linearray().forEach((ln,i)=>c.fillText(buf.getline(i),offs.x,offs.y+(i*offs.h)));
};

var render_cursor=()=>{
    // clearing whole line of text with a rectangle leaves artifacts (esp. for p,g,q,y,j)
    // 1. clear where cursor was previously
    // 2. rewrite text at old cursor position
    // 3. draw the cursor at the new position
    // NOTE: requires monotonic previous/current operations (must update both col and lin)
    var l=buf.getline(buf.lin[1]);// current line
    var bcolm1=Math.max(0,buf.col[1]-1);// current column - 1
    var pt_left=l.slice(0,bcolm1);// text upto cursor's left edge
    var pt_right=l.slice(0,buf.col[1]);
    var cur_left_edge=c.measureText(pt_left).width;
    var cur_right_edge=c.measureText(pt_right).width;
    var wid=cur_right_edge-cur_left_edge;
    var liney=offs.lmul(buf.lin[1]);
    //c.clearRect(offs.x+oldpt_left,oldpt_y,oldpt_wid,offs.lh);// clear old cursor position
    c.fillText(l,offs.x,liney+offs.lh);// draw old cursor position's text
    c.save();
    c.globalCompositeOperation='difference';
    c.fillStyle='orange';
    //console.log(pt_left+','+pt_right);
    c.fillRect(offs.x+cur_left_edge,liney,wid,offs.lh);
    c.restore();
}

var gameloop=now=>{
    update(KEYQ,now);
    // TODO: render only what's changed (both text and cursor)
    //if(buf.txt_changed){
    //    render_text();
    //    buf.txt_changed=false;
    //}
    render_text();
    render_cursor();
};

var rsz=()=>{
    requestAnimationFrame(gameloop);
    c.canvas.width=c.canvas.clientWidth;
    c.canvas.height=c.canvas.clientHeight;
    c.font='24px Sans-Serif';
    offs.init(c);
    c.fillStyle='#dacaba';
};

window.onload=rsz;
window.onresize=rsz;
window.onkeydown=(k)=>{
    requestAnimationFrame(gameloop);
    if(k.type==='keydown'){// push incoming events to a queue as they occur
        if(!k.metaKey){k.preventDefault();}
        KEYQ.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey], k:k.code});
    }
};

buf.ins('a test with\na newline\n\nand a pair of newlines\n\n\nand a very long line after three at the end');
//buf.load();// test empty buffer
