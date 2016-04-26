// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    p=document.getElementById('p').getContext('2d'),// animation canvas (cursor etc.)
    MODE='normal',// Vim modes: normal, insert, visual[-block, -line], etc.
    ESC_FD=0,// 'fd' escape sequence
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler

    Buffer=()=>({// a string with a cursor
        pt:0,// number of chars between start of file and cursor position
        ln:[0,0],// [previous line, current line]
        co:0,// column containing pt
        a:'',// text buffer
        txt_changed:false,
        pos:[0,0],// [previous, current_pt]
        load(txt){this.a='';this.pos=[0,0];this.pt=0;this.ins(txt);this.mov(0);},
        lines(){return this.a.split(/\n/g);},// array of all the buffer's lines
        words(){return this.a.split(/\s/g).reduce((a,b)=>a.concat(b),[]);},
        // modes
        append_mode(){if(this.a[this.pt]!=='\n'){this.mov(1);}},
        insert_mode(){/* a no-op, to make append_mode less lonely */},
        esc_fd(){
            this.del(-2);
        },
        ins(ch){// insert ch chars to right of p
            if(this.pt==this.a.length){this.a=this.a+ch;}
            else{var fst=this.a.slice(0,this.pt),snd=this.a.slice(this.pt);this.a=fst+ch+snd;}
            this.mov(ch.length);
            this.txt_changed=true;
        },
        del(n){// delete n chars to right of p (or left if n<0)
            if(n==0||n+this.pt<0){return;}
            var del_left=n<0?n:0, del_right=n<0?0:n;
            var fst=this.a.slice(0,this.pt+del_left),
                snd=this.a.slice(this.pt+del_right);
            if(del_left){this.mov(del_left);}// move cursor for left deletes
            this.a=fst+snd;
            this.txt_changed=true;
        },
        mov(n=1){// move cursor
            this.pos[0]=this.pt;// location before move
            //this.pt=this.pt+n;
            if(this.pt+n<0){this.pt=0;}
            else if(this.pt+n>this.a.length){this.pt=this.a.length;}
            else{this.pt+=n;}
            this.pos[1]=this.pt;// location after move
            // update line number
            for(var i=this.pos[n<0?1:0];i<this.pos[n<0?0:1];++i){
                if(this.a[i]&&this.a[i]=='\n'){
                    this.ln[0]=this.ln[1];// save previous line
                    this.ln[1]+=(n<0?-1:1);// update current line
                    if(this.ln[1]<0){this.ln[1]=0;}
                }
            }
        },
    }),

    ScreenOffsets=()=>({
        x:20,y:20,// border width
        h:0,
        lmul(lnum){
            return this.y+this.lh*lnum-this.h;
        },
        lh:0,
        init(ctx){
            this.h=c.measureText('W').width;
            this.lh=ctx.measureText('W').width;
        }
    }),
    buf=Buffer(),
    offs=ScreenOffsets();

var render_cursor=()=>{
    // re-render the text between where the cursor is now, and where it was last,
    // then render the cursor itself

    // current cursor info (x offset, char underneath it, width of char)
    var cur_x=p.measureText(buf.a.slice(buf.a.lastIndexOf('\n',buf.pos[1]-1)+1,buf.pos[1])).width;
    var cur_char=buf.a[buf.pos[1]]||'';// char under the cursor, now
    var cur_wid; // right edge of cursor, now

    // left edge of cursor, previously
    var prev_x=p.measureText(buf.a.slice(buf.a.lastIndexOf('\n',buf.pos[0]-1)+1,buf.pos[0])).width;
    var prev_char=buf.a[buf.pos[0]]||'';// char under the cursor, previously
    var prev_wid; // right edge of cursor, previously

    // x and y offsets (width and height of cursor)
    var ofx=offs.x+cur_x;
    var ofy=offs.lmul(buf.ln[1]);
    var prev_ofx=offs.x+prev_x;
    var prev_ofy=offs.lmul(buf.ln[0]);

    var sortedpos=buf.pos.sort();
    var text_between=buf.a.slice(sortedpos[0],sortedpos[1]+1);// from old pos to current
    console.log(text_between);

    p.clearRect(0,0,p.canvas.width,p.canvas.height);//whole canvas?!
    if(MODE=='insert'){
        cur_wid=1;// thin cursor during insert operation
        p.fillStyle='lime';
    }else{
        p.fillStyle='orange';
        if(cur_char=='\n'||cur_char==''){cur_wid=10;}
        else{
            cur_wid=p.measureText(cur_char).width;
            var curln=offs.y+offs.lh*buf.ln[1];

            p.save();
            p.fillStyle='gray';
            p.fillText(cur_char,offs.x+cur_x,curln); // draw the character under the cursor
            p.fillStyle='magenta';
            p.fillText(prev_char,offs.x+prev_x,curln); // draw the character at the previous position
            p.restore();
        }
    }
    p.fillRect(ofx,ofy,cur_wid,offs.h);
};

var render_text=()=>{
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    offs.y=offs.h+20;// border-top
    buf.lines().forEach((l,i)=>c.fillText(l,offs.x,offs.y+(i*offs.h)));
};

var gameloop=(now,resiz)=>{update(KEYQ,now); render_text(); render_cursor();};

var rsz=()=>{
    requestAnimationFrame(now=>gameloop(now,true));
    p.canvas.width=c.canvas.width=c.canvas.clientWidth;
    p.canvas.height=c.canvas.height=c.canvas.clientHeight;
    p.font=c.font='24px Sans-Serif';
    p.globalCompositeOperation='multiply';
    offs.init(p);
    c.fillStyle='#dacaba';
};

window.onload=rsz;
window.onresize=rsz;
window.onkeydown=(k)=>{
    requestAnimationFrame(now=>gameloop(now,true));
    if(k.type=='keydown'){// push incoming events to a queue as they occur
        if(!k.metaKey){k.preventDefault();}
        KEYQ.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey], k:k.code});
    }
};

buf.load('a test with\na newline');
