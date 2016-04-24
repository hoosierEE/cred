// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    p=document.getElementById('p').getContext('2d'),// animation canvas (cursor etc.)
    MODE='normal',// Vim modes: normal, insert, visual[-block, -line], etc.
    ESC_FD=0,// 'fd' escape sequence
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    Buffer=()=>({// a string with a cursor
        pt:0,// number of chars between start of file and cursor position
        ln:0,// line containing pt
        co:0,// column containing pt
        a:'',// text buffer
        txt_changed:false,
        change:[0,0],//start,end of last modification
        load(txt){this.a='';this.change=[0,0];this.pt=0;this.ins(txt);this.mov(0);},
        lines(){return this.a.split(/\n/g);},// array of all the buffer's lines
        words(){return this.a.split(/\s/g).reduce((a,b)=>a.concat(b),[]);},
        ins(ch){// insert ch chars to right of p
            if(this.pt==this.a.length){this.a=this.a+ch;}
            else{this.a=this.a.slice(0,this.pt)+ch+this.a.slice(this.pt);}
            this.mov(ch.length);
            this.txt_changed=true;
        },
        del(n){// delete n chars to right of p (or left if n<0)
            if(n==0||n+this.pt<0){return;}
            var del_left=n<0?n:0, del_right=n<0?0:n;
            var fst=this.a.slice(0,this.pt+del_left),
                snd=this.a.slice(this.pt+del_right);
            if(del_left){this.mov(del_left);}// move cursor for left deletes
            this.a=fst+snd;// change text
            this.txt_changed=true;
        },
        mov(n=1){// move the cursor
            this.change[0]=this.pt;// starting point
            this.pt=this.pt+n;
            if(this.pt<0){this.pt=0;}
            else if(this.pt>=this.a.length){this.pt=this.a.length;}
            this.change[1]=this.pt;// ending point

            // what line is the cursor on now?
            for(var i=this.change[(n<0?1:0)];i<this.change[(n<0?0:1)];++i){
                if(this.a[i]&&this.a[i]=='\n'){
                    this.ln+=(n<0?-1:1);
                    if(this.ln<0){this.ln=0;}
                }
            }
        },
    }),
    buf=Buffer();

var spot={x:20,y:20,h:0,lh:undefined};// screen border, cached offsets

var render_cursor=()=>{
    var w=p.measureText(buf.a.slice(buf.a.lastIndexOf('\n',buf.pt-1)+1,buf.pt)).width;
    p.clearRect(0,0,p.canvas.width,p.canvas.height);//whole canvas?!
    spot.lh=spot.lh||p.measureText('W').width;
    p.fillStyle='rgba(20,255,255,'+Math.abs(Math.cos(performance.now()/500))+')';
    p.fillRect(spot.x+w,spot.y+spot.lh*(buf.ln-0)-spot.h,1,spot.h);
};

var render_text=()=>{
    spot.h=c.measureText('W').width;
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    spot.y=spot.h+20;// border-top
    buf.lines().forEach((l,i)=>c.fillText(l,spot.x,spot.y+(i*spot.h)));
};

var gameloop=(now,resiz)=>{update(KEYQ,now); render_text();};

var rsz=()=>{
    p.canvas.width=c.canvas.width=c.canvas.clientWidth;
    p.canvas.height=c.canvas.height=c.canvas.clientHeight;
    p.font=c.font='24px Sans-Serif';
    c.fillStyle='#cacada';
    requestAnimationFrame(now=>gameloop(now,true));
};

window.onload=()=>{rsz(); setInterval(render_cursor,1000/30);}
window.onresize=rsz;
window.onkeydown=(k)=>{
    if(k.type=='keydown'){// push incoming events to a queue as they occur
        k.preventDefault();
        KEYQ.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey], k:k.code});
        requestAnimationFrame(now=>gameloop(now,true));
    }
};

buf.load('a test with\na newline');
