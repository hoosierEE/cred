// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    p=document.getElementById('p').getContext('2d'),// animation canvas (cursor etc.)
    MODE='normal',// Vim modes: normal, insert, visual[-block, -line], etc.
    ESC_FD=0,// 'fd' escape sequence
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    Buffer=()=>({// a string with a cursor
        init(){
            this.s='';// string
            this.pt=0;// cursor index
            this.lin=[0,0];// line [previous, current]
            this.col=[0,0,0];// column [previous, current, previous_maximum]
            this.lines=[];
            this.linearray();// indexes of s where lines begin
        },

        linearray(){
            if(this.txt_changed||this.lines.length===0){
                this.lines=[0];
                for(var i=0;i<this.s.length;++i){
                    if(this.s[i]==='\n'){this.lines.push(i);}
                }
            }
            return this.lines;
        },
        getline(n){
            var l=this.linearray(),len=l.length;
            if(n>0&&n<len){return this.s.slice(l[n]+1,l[n+1]);}// typical case
            else if(n===0){return this.s.slice(0,l[1]);}// first (0th) line
            else if(n<0){return this.getline(Math.max(0,len+n));}// last-nth line, down to 0th line
            else{return this.s.slice(1+l[len-1]);}// get last line easily with getline(hugenumber)
        },

        append_mode(){if(this.s[this.pt]!=='\n'){
            //this.mov(1,false);
        }},
        insert_mode(){/* a no-op, to make append_mode less lonely */},
        esc_fd(){this.del(-2);},

        updn(n){// try to move up or down, stopping at BOF/EOF
        },
        mov(n,writing=false){
            this.col[0]=this.col[1];// save column
            if(!writing){// try to move left or right, stopping at newline
                var lastnl=this.s.lastIndexOf('\n');
                if(lastnl<0){lastnl=0;}
                if(this.pt+n<lastnl){
                    // trying to move left over a newline, stop
                }
            }
            else{// when writing (ins or del), mov wherever the text takes you
                // just move the cursor by n
                this.pt+=n;
                if(this.pt<0){this.pt=0;}
                else if(this.pt>this.s.length){this.pt=this.s.length;}
                // update current column
                var lastnl=this.s.lastIndexOf('\n',this.pt);
                this.col[1]=(lastnl<0)?0:lastnl;
            }
            console.log(this.pt);
        },
        ins(ch){// insert ch chars to right of p
            this.txt_changed=true;
            if(this.pt===this.s.length){this.s=this.s+ch;}
            else{var fst=this.s.slice(0,this.pt),snd=this.s.slice(this.pt);this.s=fst+ch+snd;}
            this.mov(ch.length,true);
        },
        del(n){// delete n chars to right of p (or left if n<0)
            if(n===0||n+this.pt<0){return;}
            this.txt_changed=true;
            var leftd=n<0?n:0, rightd=n<0?0:n;
            var fst=this.s.slice(0,this.pt+leftd),
                snd=this.s.slice(this.pt+rightd);
            if(leftd){this.mov(leftd,true);}
            this.s=fst+snd;
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
    offs.y=offs.h+20;// border-top
    // render all the lines TODO: only render visible lines
    buf.linearray().forEach((ln,i)=>c.fillText(buf.getline(i),offs.x,offs.y+(i*offs.h)));
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

buf.init();
buf.ins('a test with\na newline\n\nand a pair of newlines\n\n\nand three at the end');
//buf.load();// test empty buffer
