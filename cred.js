// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    //p=document.getElementById('p').getContext('2d'),// animation canvas (cursor etc.)
    MODE='normal',// Vim modes: normal, insert, visual[-block, -line], etc.
    ESC_FD=0,// 'fd' escape sequence
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    Buffer=()=>{// a string with a cursor (a.k.a. 'point')
        var bc={
            linearray(){// ()->[Int] // [Int] is the index of each line's start
                if(this.txt_changed||this.lines.length===0){
                    this.lines=this.s.split('').reduce((x,y,i)=>{
                        y==='\n'&&x.push(i);return x;},[0]);
                }return this.lines;// otherwise return cached array
            },

            getline(n){// Int->String // String is the entire line
                var l=this.linearray(),len=l.length;
                if(n>0&&n<len){return this.s.slice(l[n]+1,l[n+1]);}// line in middle
                else if(n===0){return this.s.slice(0,l[1]);}// first
                else if(n>=len){return this.s.slice(1+l[len-1]);}// last
                else{return this.getline(Math.max(0,len+n));}// negative n indexes backwards but doesn't wrap
            },
            append_mode(){if(this.s[this.pt]!=='\n'){this.mov(1);}},
            insert_mode(){/* a no-op, to make append_mode less lonely */},
            esc_fd(){this.del(-2);},
            updn(n){// try to move up or down, stopping at BOF/EOF
                console.log(n);
                //this.lin[0]=this.lin[1];// save old line
                //this.col[0]=this.col[1];// save old column
                //var l=this.linearray(),len=l.length;
                //// update line number
                //if(this.lin[1]+n<0){this.lin[1]=0;}// first line
                //else if(this.lin[1]+n>len){this.lin[1]=len;}// last line
                //else{this.lin[1]+=n;}// some line in the middle
                //// update column number
                //var currentline=this.getline(this.lin[1]);// used to calculate column
                //if(this.col[1]>currentline.length){this.col[1]=currentline.length;}// move column if necessary
                //this.pt=this.lines[this.lin[1]]-this.col[1];// update point
                //console.log('pt:'+this.pt+',col:'+this.col+',lin:'+this.lin);
            },

            mov(n,writing=false){
                //console.log('pt:'+this.pt+',col:'+this.col+',lin:'+this.lin);
                if(n===0){return;}// no movement: no column/line update

                // 1. save previous column
                this.col[0]=this.col[1];

                // 2. move point
                if(this.pt+n<0){this.pt=0;}
                else if(this.pt+n>this.s.length){this.pt=this.s.length;}
                else{this.pt+=n;}
                // afterward, we check to see if moving the point requires other changes

                var line_start=this.lines[this.lin[1]];// start index of this line
                if(writing){this.col[1]=this.col[2]=this.pt-line_start;}// columns follow point
                else{
                    if(Math.abs(n)===1&&this.s[this.pt]==='\n'){
                        // movements of |1| bounce off of newlines
                        this.pt-=n;
                        this.col[1]=this.pt-line_start;// update columns
                        this.col[2]=Math.max(this.col[1],this.col[2]);
                    }
                    else{// moved, possibly over a newline, so we have to check and update the current line
                        var newlines_passed=0;// how many?
                        var n_signum=n<0?-1:1;
                        for(var i=this.lin[1];i<this.lin[1]+this.col[1];++i){
                            if(this.s[i]==='\n'){newlines_passed+=n_signum;}
                        }
                        this.updn(newlines_passed);// add that many to line number
                    }
                    this.col[1]=this.pt-line_start;// current column
                    this.col[2]=Math.max(this.col[1],this.col[2]);// save max column
                }
            },

            ins(ch){// insert ch chars to right of p
                this.txt_changed=true;
                if(this.pt===this.s.length){this.s=this.s+ch;}
                else{var fst=this.s.slice(0,this.pt), snd=this.s.slice(this.pt); this.s=fst+ch+snd;}
                if(ch.search(/\n/)>=0){this.linearray();}
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
        };
        bc.s='';// string
        bc.pt=0;// cursor index
        bc.lin=[0,0];// line [previous, current]
        bc.col=[0,0,0];// column [previous, current, previous_maximum]
        bc.lines=[];
        bc.linearray();// indexes of s where lines begin
        return bc;
    },

    ScreenOffsets=()=>({
        x:20,// border width
        lmul(lnum){return this.y+this.lh*lnum-this.h;},
        init(ctx){this.lh=this.h=ctx.measureText('W').width;this.y=this.h+this.x;}
    }),
    buf=Buffer(),
    offs=ScreenOffsets();

var render_text=()=>{
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    offs.y=offs.h+20;// border-top
    // render all the lines TODO: only render visible lines
    buf.linearray().forEach((ln,i)=>c.fillText(buf.getline(i),offs.x,offs.y+(i*offs.h)));
    c.save();
    c.fillStyle='orange';
    var this_slice=buf.s.slice(buf.lines[buf.lin[1]],buf.col[1]);
    var mt2cur=c.measureText(this_slice).width;
    //console.log(this_slice);
    c.fillRect(offs.x+mt2cur,offs.lmul(buf.lin[1]),20,40);
    c.restore();
};

var gameloop=now=>{update(KEYQ,now); render_text();};

var rsz=()=>{
    requestAnimationFrame(gameloop);
    c.canvas.width=c.canvas.clientWidth;
    c.canvas.height=c.canvas.clientHeight;
    c.font='24px Sans-Serif';
    c.globalCompositeOperation='difference';
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

buf.ins('a test with\na newline\n\nand a pair of newlines\n\n\nand three at the end');
//buf.load();// test empty buffer
