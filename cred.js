// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),
    p=document.getElementById('p').getContext('2d'),
    MODE='normal', // Vim modes: normal, insert, visual[-block, -line]
    ESC_FD=0, // 'fd' escape sequence
    KEYQ=[{mods:[false,false,false,false],k:''}], // lightens duties for key event handler
    Buffer=()=>({// a string with a cursor
        p:0,a:'',changed:false,
        nl:[0],//newline indexes, prepopulated with 1 at start
        load(txt){// load and initialize a buffer
            this.ins(txt);
            for(var i=0;i<txt.length;++i){
                if(txt[i]=='\n'){
                    this.nl.push(i);//get newlines
                }
            }
        },
        ins(ch){// insert ch chars to right of p
            this.changed=true;
            if(this.p==this.a.length){
                for(var i=0;i<ch.length;++i){if(ch[i]=='\n'){this.nl.push[this.p+i];}}
                this.a=this.a+ch;
            }
            else{
                for(var i=0;i<ch.length;++i){if(ch[i]=='\n'){this.nl.push[this.p+i];nl.sort();}}
                this.a=this.a.slice(0,this.p)+ch+this.a.slice(this.p);
            }
            this.mov(ch.length);
        },
        del(n){// delete n chars to right of p (or left if n<0)
            if(n==0||n+this.p<0){return;}
            var bz=n<0?n:0, fz=n<0?0:n;
            this.changed=true;
            this.a=this.a.slice(0,this.p+bz)+this.a.slice(this.p+fz);
            this.mov(bz);
        },
        mov(n=1){// move the cursor
            this.p=this.p+n;
            if(this.p<0){this.p=0;}
            else if(this.p>this.a.length){this.p=this.a.length;}
        },
    }),
    buf=Buffer();

// udpate : [RawKey] -> BufferAction
var update=(rks)=>{
    while(rks.length){ // consume KEYQ, dispatch event handlers
        var dec=decode(rks.shift()); // behead queue
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
        if(dec.type=='arrow'){
            switch(dec.code){
            case'L':buf.mov(-1);break;
            case'R':buf.mov(1);break;
            }
        }
    }
};

var spot={x:20,y:0};

var render_cursor=(t)=>{
    p.clearRect(0,0,p.canvas.width,p.canvas.height);
    var clr=Math.abs(Math.cos(t/500));
    p.fillStyle='rgba(20,255,255,'+clr+')';
    var h=p.measureText('W').width;//cursor as tall as a W is wide
    var w=p.measureText(buf.a.slice(0,buf.p)).width;//string width upto cursor
    p.fillRect(w+spot.x,spot.y-h,1,h);
};

var render_text=()=>{
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    var h=c.measureText('W').width;
    spot.y=h+20;
    var lines=buf.a.split('\n');
    for(var i=0;i<lines.length;++i){
        c.fillText(lines[i],spot.x,spot.y);
        spot.y+=h;// cursor uses this value, oops
    }
    //spot.x=(c.canvas.width-w)/2;//center horizontally
    //spot.y=c.canvas.height/2;//center vertically
    //c.fillText(buf.a,spot.x,spot.y);
};

var gameloop=(now,resiz)=>{
    requestAnimationFrame((now)=>gameloop(now,true));
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
};

window.onload=rsz;
window.onresize=rsz;
window.onkeydown=(k)=>{
    if(k.type=='keydown'){// push incoming events to a queue as they occur
        k.preventDefault();
        KEYQ.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey], k:k.code});
    }
};

buf.load('a test\nwith a newline');

