// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    MODE='normal',
    ESC_FD=0,
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    Cursor=(b)=>({
        cl:0,// current line
        co:0,// current column
        cx:0,// maximum column
        msg:'constructed',
        //selection_start:0,// indexs from left edge of first selected char
        //selection_end:0,// index at left edge of last selected char
        get_current_line(){return b.lines.map(x=>b.pt>=x).lastIndexOf(true);},
        nl_on_right(){return b.s[b.pt+1]==='\n';},
        nl_on_left(){return b.s[b.pt-1]==='\n';},

        left(n){
            if(n===1&&this.nl_on_left()){
                this.msg='h trying to cross newline';
                return;
            }// h doesn't cross '\n'
            else if(b.pt-n<0){
                this.msg='trying to move left of BOF';
                b.pt=0;
            }// goto BOF
            else{
                this.msg='...';
                b.pt-=n;
            }
            // update line and column
            this.cl=this.get_current_line();
            this.co=b.pt-b.lines[this.cl];
            this.cx=this.co;// left or right movement overrides maximum column
        },

        right(n,write_override=false){
            if(n===1&&this.nl_on_right()){
                this.msg='l trying to cross newline';
                return;
            }// l doesn't cross '\n'
            else if(b.pt+n>=b.s.length-1){
                this.msg='trying to move right of EOF';
                b.pt=b.s.length-(write_override?0:1);
            }
            else{
                this.msg='...';
                b.pt+=n;
            }
            this.cl=this.get_current_line();
            this.co=b.pt-b.lines[this.cl];
            this.cx=this.co;
        },

        up(n){
            // concept: move the point backward to the start of the line above,
            // then forward to cx, stopping at max of EOL or cx
            var target_line=this.cl-n;
            if(target_line<0){target_line=0;}
            var target_column=this.cx;
            var lineabove=b.getline(target_line);
            if(target_column>lineabove.length){target_column=lineabove.length;}
            b.pt=b.lines[target_line]+target_column;
            this.cl=target_line;
            this.co=target_column;
            //console.log(this.co+','+this.cx+','+this.cl);
        },

        down(n){
            var target_line=this.cl+n;
            if(target_line>b.lines.length-1){target_line=b.lines.length-1;}
            this.cl=this.get_current_line();// line containing point
            this.co=b.pt-b.lines[this.cl];
        },

        append_mode(){
            if(b.s[b.pt]!=='\n'){this.right(1,true);}
        },

        insert_mode(){},// intentionally left blank
        esc_fd(){b.del(-2);this.left(2);if(b.pt>b.s.length-1){b.pt=b.s.length-1;}},
        status(){return this.msg+' col: '+this.co+' pt: '+b.pt+' line: '+this.cl;},
        //select(sel_mode){},
    }),
    Buffer=()=>{// ()->Buffer // Buffer is a String with line and point metadata.
        // Handles insert/delete at the given point
        var bb={
            getline(n){// Int->String // the entire line
                var l=this.lines,len=l.length;
                if(0<n&&n<len){return this.s.slice(l[n]+1,l[n+1]);}// line in middle
                else if(n===0){return this.s.slice(0,l[1]);}// first
                else if(len<=n){return this.s.slice(1+l[len-1]);}// last
                else{return this.getline(Math.max(0,len+n));}// negative n indexes backwards but doesn't wrap
            },

            ins(ch){// insert ch chars to right of p
                this.txt_changed=true;
                if(this.pt===this.s.length){this.s=this.s+ch;}
                else{var fst=this.s.slice(0,this.pt), snd=this.s.slice(this.pt); this.s=fst+ch+snd;}
                for(var i=0;i<ch.length;++i){
                    if(ch[i]==='\n'){this.lines.push(this.pt+i);}
                }
                this.lines.sort();
                this.pt+=ch.length;
            },

            del(n){// delete n chars to right (n>0) or left (n<0) of point
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
        bb.lines=[0];// BOL indexes
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
    buf.lines.forEach((ln,i)=>c.fillText(buf.getline(i),offs.x,offs.y+(i*offs.h)));
};

var render_cursor=()=>{
    // 1. clear where cursor was previously
    // 2. rewrite text at old cursor position
    // 3. draw the cursor at the new position
    var l=buf.getline(cur.get_current_line());// current line
    var curcom1=cur.co-1;
    if(curcom1<0){curcom1=0;}
    var pt_left=l.slice(0,curcom1);// text upto cursor's left edge
    var pt_right=l.slice(0,cur.co);
    var cur_left_edge=c.measureText(pt_left).width;
    var cur_right_edge=c.measureText(pt_right).width;
    var wid=cur.nl_on_right()?3:cur_right_edge-cur_left_edge;
    var liney=offs.lmul(cur.get_current_line());
    c.fillText(l,offs.x,liney+offs.lh);// draw old cursor position's text
    c.save();
    c.globalCompositeOperation='difference';
    c.fillStyle=cur.nl_on_right()?'blue':'orange';
    c.clearRect(offs.x,offs.lmul(10),c.canvas.width,offs.lh);
    c.fillText(cur.status(),offs.x,offs.lmul(10)+offs.lh);
    c.fillRect(offs.x+cur_left_edge,liney,wid,offs.lh);// draw cursor over existing text
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

//buf.ins('a test with\na newline\n\nand a pair of newlines\n\n\nand a very long line after three at the end');
buf.ins('with\na newline');
