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
            updn(n){// try to move up or down, stopping at 0 or lines.length
                console.log('BEFORE pt:'+this.pt+',col:'+this.col+',lin:'+this.lin);
                this.lin[0]=this.lin[1];// save old line
                //this.col[0]=this.col[1];// save old column if changed

                // update line number
                var l=this.linearray(),len=l.length;
                if(this.lin[1]+n<0){this.lin[1]=0;}
                else if(this.lin[1]+n>=len){this.lin[1]=len-1;}
                else{this.lin[1]+=n;}

                // update column number
                var curln=this.getline(this.lin[1]);// used to calculate column
                var maxcurln=(curln.length-1)<0?0:(curln.length-1);
                if(maxcurln<this.col[1]){this.col[1]=maxcurln;}// update current (not max!) column
                this.pt=this.lines[this.lin[1]]+this.col[1];// update point
                console.log('AFTER pt:'+this.pt+',col:'+this.col+',lin:'+this.lin);
            },

            update_lin_col(){
                // TODO line and column adjustments should be their own function, because
                // we should always have a "previous" that tracks both line and column.
                var line_start=this.lines[this.lin[1]];// start index of this line
                if(writing){
                    this.col[1]=this.col[2]=this.pt-line_start;
                }// columns follow point
                else{
                    if(n<0){this.col[2]+=n;}// moving left always updates max column
                    // jumping newline requires |n|>1
                    if(Math.abs(n)===1){
                        if(this.s[this.pt+((n>0)?1:0)]==='\n'){
                            this.pt-=n;
                        }
                        this.col[1]=this.pt-line_start;// update columns
                        this.col[2]=Math.max(this.col[1],this.col[2]);
                    }
                    else{// moved, possibly over a newline, so we check the current line
                        var nl_pass=0, n_signum=n<0?-1:1;// how many \n's, which direction?
                        for(var i=this.pt[n<0?1:0];i<this.pt[n<0?0:1];++i){
                            if(this.s[i]==='\n'){nl_pass+=n_signum;}
                        }
                        if(nl_pass!==0){
                            // updn updates point (and possibly column)
                            this.updn(nl_pass);
                        }
                        else{// update column
                            this.col[1]=this.pt-line_start;
                            this.col[2]=Math.max(this.col[1],this.col[2]);
                        }
                    }
                }

            },

            mov(n,writing=false){// Int -> [Bool] -> () // moves cursor
                console.log('BEFORE pt:'+this.pt+',col:'+this.col+',lin:'+this.lin);
                if(n===0){
                    // mov affects history, but recomputing lin/col not required
                    this.col[0]=this.col[1];
                    this.lin[0]=this.lin[1];
                }
                else{
                    if(this.pt+n<0){this.pt=0;}
                    else if(this.pt+n>this.s.length){this.pt=this.s.length;}
                    else{this.pt+=n;}
                    // TODO: afterward, check to see if moving the point changes line and/or column
                    this.update_lin_col(n,writing);
                }
                console.log('AFTER pt:'+this.pt+',col:'+this.col+',lin:'+this.lin);
            },

            ins(ch){// insert ch chars to right of p
                this.txt_changed=true;
                if(this.pt===this.s.length){this.s=this.s+ch;}
                else{var fst=this.s.slice(0,this.pt), snd=this.s.slice(this.pt); this.s=fst+ch+snd;}
                for(var i=0;i<ch.length;++i){
                    if(ch[i]==='\n'){
                        this.lin[0]=this.lin[1];
                        this.lin[1]+=1;
                    }
                }
                this.linearray();
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
        bc.s='';// plain old string
        bc.pt=0;// cursor index
        bc.lin=[0,0];// line [previous, current]
        bc.col=[0,0,0];// column [previous, current, previous_maximum] == n chars to right of BOL
        bc.lines=[];// BOL indexes
        bc.linearray();// populate lines
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
    // render all the lines
    // TODO: only render /visible/ lines.
    // use the "screen always shows cursor" constriant to do this?
    buf.linearray().forEach((ln,i)=>c.fillText(buf.getline(i),offs.x,offs.y+(i*offs.h)));
};

var render_cursor=()=>{
    // clearing whole line of text with a rectangle leaves artifacts (esp. for p,g,q,y,j)
    // 1. clear where cursor was previously
    // 2. rewrite text at old cursor position
    // 3. draw the cursor at the new position
    // NOTE: requires monotonic previous/current operations (must update both col and lin)
    var l=buf.getline(buf.lin[1]);// current line
    var oldl=buf.getline(buf.lin[0]);// previous line
    var bcolm1=(buf.col[1]-1)<0?0:buf.col[1];
    var pt_left=l.slice(0,bcolm1);// text upto cursor's left edge
    var pt_right=l.slice(0,buf.col[1]);
    var oldpt_left=
    var cur_left_edge=c.measureText(pt_left).width;
    var cur_right_edge=c.measureText(pt_right).width;
    var wid=cur_right_edge-cur_left_edge;
    var liney=offs.lmul(buf.lin[1]);
    c.clearRect(offs.x+oldpt_left,oldpt_y,oldpt_wid,offs.lh);// clear old cursor position
    c.fillText(l,offs.x,liney+offs.lh);// draw old cursor position's text
    c.save();
    c.globalCompositeOperation='difference';
    c.fillStyle='orange';
    c.fillRect(offs.x+cur_left_edge,liney,wid,offs.lh);
    c.restore();
}

var gameloop=now=>{
    update(KEYQ,now);
    if(buf.txt_changed){
        render_text();
        buf.txt_changed=false;
    }
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

buf.ins('a test with\na newline\n\nand a pair of newlines\n\n\nand three at the end');
//buf.load();// test empty buffer
