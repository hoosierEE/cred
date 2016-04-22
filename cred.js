// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    p=document.getElementById('p').getContext('2d'),// animation canvas (cursor etc.)
    MODE='normal',// Vim modes: normal, insert, visual[-block, -line], etc.
    ESC_FD=0,// 'fd' escape sequence
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    Buffer=()=>({// a string with a cursor
        p:0,a:'',changed:false,oldp:0,
        change:[0,0],//start,end of last modification
        load(txt){this.ins(txt);},
        lines(){return this.a.split(/\n/g);},// array of all the buffer's lines
        words(){return this.a.split(/\s/g).reduce((a,b)=>a.concat(b),[]);},
        ins(ch){// insert ch chars to right of p
            this.changed=true;
            if(this.p==this.a.length){this.a=this.a+ch;}
            else{this.a=this.a.slice(0,this.p)+ch+this.a.slice(this.p);}
            this.change=[this.p,this.p+ch.length];
            this.mov(ch.length);
        },
        del(n){// delete n chars to right of p (or left if n<0)
            if(n==0||n+this.p<0){return;}
            var bz=n<0?n:0, fz=n<0?0:n;
            this.changed=true;
            this.a=this.a.slice(0,this.p+bz)+this.a.slice(this.p+fz);
            this.mov(bz);
            this.change=[this.p,this.p+n];
        },
        mov(n=1){// move the cursor
            this.oldp=this.p;//previous cursor position
            this.p=this.p+n;
            if(this.p<0){this.p=0;}
            else if(this.p>this.a.length){this.p=this.a.length;}
        },
    }),
    buf=Buffer();

// udpate : [RawKey] -> BufferAction
var update=(rks)=>{
    while(rks.length){// consume KEYQ, dispatch event handlers
        var dec=decode(rks.shift());// behead queue
        if(MODE=='normal'){
            switch(dec.code){
            case'i':MODE='insert';break;
            case'a':MODE='insert';buf.mov(1);break;
            case'h':buf.mov(-1);break;
            case'l':buf.mov(1);break;
            case' ':console.log('SPC-');break;// hmm...
            }
        }else if(MODE=='insert'){
            switch(dec.type){
            case'escape':MODE='normal';break;
            case'print':
                buf.ins(dec.code);
                if(dec.code=='f'){ESC_FD=-performance.now();}
                if(dec.code=='d'&&ESC_FD<0&&performance.now()+ESC_FD<500){
                    MODE='normal'; buf.del(-2);}break;
            case'edit':buf.del(dec.code=='B'?-1:1);break;
            }
        }
        if(dec.type=='arrow'){//all modes support arrows in the same way
            switch(dec.code){
            case'L':buf.mov(-1);break;
            case'R':buf.mov(1);break;
            }
        }
    }
};

var spot={x:20,y:0,h:0};
spot.y=spot.h+spot.x;

var render_cursor=(t)=>{
    // where is the cursor on the screen?
    var clr=Math.abs(Math.cos(t/500));
    var h=p.measureText('W').width;
    var w=p.measureText(buf.a.slice(0,buf.p)).width;//ideally slice(buf.current_line_p,buf.p)
    //p.clearRect(0,0,p.canvas.width,p.canvas.height);//whole canvas?!
    //var oldw=p.measureText(buf.a.slice(buf.oldp,Math.abs(buf.p+buf.oldp))).width;
    var pdiff=buf.p-buf.oldp;// left==negative
    var oldw=(p.measureText(buf.a.slice(0,buf.oldp).width))-(p.measureText(buf.a.slice(0,buf.p)).width);
    p.fillStyle='rgba(150,150,150,0.1)';
    p.fillRect(spot.x+oldw-10,spot.y-spot.h,12,spot.h);
    p.fillStyle='rgba(20,255,255,'+clr+')';
    p.fillRect(spot.x+w,spot.y-spot.h,1,spot.h);
};

var render_text=()=>{
    // in response to a change in screen size or text
    // the portion of text drawn should be a function of:
    // 1. cursor position (n lines above, m below)
    // 2. screen area, font size, word wrapping
    spot.h=c.measureText('W').width;
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    spot.y=spot.h+20;// border-top
    var lines=buf.lines();
    lines.forEach((l,i)=>c.fillText(l,spot.x,spot.y+(i*spot.h)));
};

var gameloop=(now,resiz)=>{
    requestAnimationFrame((now)=>gameloop(now,false));
    render_cursor(now);
    update(KEYQ);
    if(buf.changed||resiz){
        render_text();
        buf.changed=false;
    }
};
requestAnimationFrame((now)=>gameloop(now,true));

var rsz=()=>{
    c.canvas.width=c.canvas.clientWidth;
    c.canvas.height=c.canvas.clientHeight;
    c.fillStyle='#cacada';
    c.font='24px Sans-Serif';
    p.canvas.width=p.canvas.clientWidth;
    p.canvas.height=p.canvas.clientHeight;
    p.font='24px Sans-Serif';
    requestAnimationFrame((now)=>gameloop(now,true));
};

window.onload=rsz;
window.onresize=rsz;
window.onkeydown=(k)=>{
    if(k.type=='keydown'){// push incoming events to a queue as they occur
        k.preventDefault();
        KEYQ.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey], k:k.code});
    }
};

buf.load('a test without a newline');

