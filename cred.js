// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    p=document.getElementById('p').getContext('2d'),// animation canvas (cursor etc.)
    MODE='normal',// Vim modes: normal, insert, visual[-block, -line], etc.
    ESC_FD=0,// 'fd' escape sequence
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler

    Buffer=()=>({// a string with a cursor
        p:[0,0],// [previous point, current point]
        l:[0,0],// [previous line, current line]
        c:[0,0,0],// [previous column, current column, previous max column]
        linecache:[],
        wordcache:[],
        a:'',// text buffer
        txt_changed:false,
        load(txt=''){// load text, or empty string
            this.a='';
            this.p=[0,0];
            this.l=[0,0];
            this.c=[0,0,0];
            this.linecache=[];
            this.wordcache=[];
            this.ins(txt);
            this.mov(0);
        },
        lines(){
            // array of all the buffer's lines, or a cached version if the buffer hasn't changed
            if(this.txt_changed||this.linecache.length===0){
                this.txt_changed=false;
                this.linecache=this.a.split(/\n/g);
            }
            return this.linecache;
        },
        words(){
            if(this.txt_changed||this.wordcache.length===0){
                this.txt_changed=false;
                this.wordcache=this.a.split(/\s/g);
            }
            return this.wordcache;
        },

        append_mode(){if(this.a[this.p[1]]!=='\n'){this.mov(1,false);}},
        insert_mode(){/* a no-op, to make append_mode less lonely */},
        esc_fd(){this.del(-2);},
        ins(ch){// insert ch chars to right of p
            this.txt_changed=true;
            if(this.p[1]===this.a.length){this.a=this.a+ch;}
            else{var fst=this.a.slice(0,this.p[1]),snd=this.a.slice(this.p[1]);this.a=fst+ch+snd;}
            this.mov(ch.length,false);
        },
        del(n){// delete n chars to right of p (or left if n<0)
            if(n===0||n+this.p[1]<0){return;}
            this.txt_changed=true;
            var del_left=n<0?n:0, del_right=n<0?0:n;
            var fst=this.a.slice(0,this.p[1]+del_left),
                snd=this.a.slice(this.p[1]+del_right);
            if(del_left){this.mov(del_left,false);}// move cursor for left deletes
            this.a=fst+snd;
        },

        // up/down motion
        updn(n){
            this.l[0]=this.l[1];// previous line
            if(!n){return;}// no move

            // limits
            if(this.l[1]+n<0){this.l[1]=0;}
            else if(this.l[1]+n>this.linecache.length-1){this.l[1]=this.linecache.length-1;}
            else{this.l[1]+=n;}// current line
            this.p[0]=this.p[1];// prev position
        },

        // left/right motion
        mov(n=1,justmoving=true){// move cursor, update line and column
            this.p[0]=this.p[1];// previous position
            if(!n){return;}// no move

            // limits
            if(this.p[1]+n<0){this.p[1]=0;}
            else if(this.p[1]+n>this.a.length){this.p[1]=this.a.length;}
            else{this.p[1]+=n;}// current position

            // don't move beyond newlines unless ins/del or up/dn
            if(justmoving){// if n is 0 then we're not really moving
                if(this.p[1]>this.p[0]){
                    for(var i=this.p[0];i<this.p[1];++i){if(this.a[i]==='\n'){this.p[1]=i-1;break;}}
                }
                else{//else if(this.p[1]<this.p[0]){
                    for(var i=this.p[0];i>this.p[1];--i){if(this.a[i-1]==='\n'){this.p[1]=i;break;}}
                }
            }
            else{
                // update line number
                for(var i=this.p[n<0?1:0];i<this.p[n<0?0:1];++i){
                    if(this.a[i]==='\n'){
                        this.l[0]=this.l[1];// previous line
                        this.l[1]+=(n<0?-1:1);// current line
                        if(this.l[1]<0){this.l[1]=0;}
                    }
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
    // clear and redraw text between previous and current cursor positions
    // then render the cursor itself

    // current cursor info (x offset, char underneath it, width of char)
    var cur_x=p.measureText(buf.a.slice(buf.a.lastIndexOf('\n',buf.p[1]-1)+1,buf.p[1])).width;
    var cur_char=buf.a[buf.p[1]]||'';// char under the cursor, now
    var cur_wid; // right edge of cursor, now

    // previous cursor info
    var prev_x=p.measureText(buf.a.slice(buf.a.lastIndexOf('\n',buf.p[0]-1)+1,buf.p[0])).width;
    var prev_char=buf.a[buf.p[0]]||'';// char under the cursor, previously
    var prev_wid; // right edge of cursor, previously

    // x and y offsets (width and height of cursor)
    var ofx=offs.x+cur_x;
    var ofy=offs.lmul(buf.l[1]);
    var prev_ofx=offs.x+prev_x;
    var prev_ofy=offs.lmul(buf.l[0]);

    var sortedpos=[Math.min(buf.p),Math.max(buf.p)];//buf.p.concat().sort();
    var text_between=buf.a.slice(sortedpos[0],sortedpos[1]+1);// from old p to current
    //console.log(text_between);

    p.clearRect(0,0,p.canvas.width,p.canvas.height);//whole canvas?!
    if(MODE==='insert'){
        cur_wid=1;// thin cursor during insert operation
        p.fillStyle='lime';
    }else{
        p.fillStyle='orange';
        if(cur_char==='\n'||cur_char===''){cur_wid=10;}
        else{
            cur_wid=p.measureText(cur_char).width;
            var curln=offs.y+offs.lh*buf.l[1];

            p.save();
            p.fillStyle='gray';
            p.fillText(cur_char,offs.x+cur_x,curln); // draw the character under the cursor
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
    if(k.type==='keydown'){// push incoming events to a queue as they occur
        if(!k.metaKey){k.preventDefault();}
        KEYQ.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey], k:k.code});
    }
};

buf.load('a test with\na newline');
//buf.load();// test empty buffer
