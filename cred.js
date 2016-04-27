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
        lines:[],
        a:'',// text buffer
        txt_changed:false,
        load(txt=''){// load text, or empty string
            this.a='';
            this.p=[0,0];
            this.l=[0,0];
            this.c=[0,0,0];
            this.lines=[];
            this.ins(txt);
            this.mov(0);
        },
        get_lines(){
            if(this.txt_changed||this.lines.length===0){
                this.txt_changed=false;
                this.lines=this.a.split('\n').map(a=>a.length);
            }
            return this.lines;
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
            else if(this.l[1]+n>this.lines.length-1){this.l[1]=this.lines.length-1;}
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
        h:0, lh:0,// height, line height
        lmul(lnum){return this.y+this.lh*lnum-this.h;},
        init(ctx){
            this.lh=this.h=ctx.measureText('W').width;
            this.y=this.h+this.x;
        }
    }),
    buf=Buffer(),
    offs=ScreenOffsets();

var render_cursor=()=>{
    // clear and redraw text between previous and current cursor positions
    // then render the cursor itself
};

var render_text=()=>{
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    //offs.y=offs.h+20;// border-top
    buf.get_lines().forEach((l,i)=>c.fillText(l,offs.x,offs.y+(i*offs.h)));
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

buf.load('a test with\na newline\n\nand a pair of newlines\n\n\nand three at the end');
//buf.load();// test empty buffer
