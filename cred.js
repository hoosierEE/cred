// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    p=document.getElementById('p').getContext('2d'),// animation canvas (cursor etc.)
    MODE='normal',// Vim modes: normal, insert, visual[-block, -line], etc.
    ESC_FD=0,// 'fd' escape sequence
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    Buffer=()=>({// a string with a cursor
        pt:0,// number of chars between start of file and cursor position
        lin:0,// line containing pt
        col:0,// column containing pt
        a:'',// text buffer
        txt_changed:false,
        change:[0,0],//start,end of last modification
        load(txt){this.a='';this.change=[0,0];this.pt=0;this.ins(txt);},
        lines(){return this.a.split(/\n/g);},// array of all the buffer's lines
        words(){return this.a.split(/\s/g).reduce((a,b)=>a.concat(b),[]);},
        ins(ch){// insert ch chars to right of p
            this.change[0]=this.pt;// starting point
            if(this.pt==this.a.length){this.a=this.a+ch;}
            else{this.a=this.a.slice(0,this.pt)+ch+this.a.slice(this.pt);}
            this.mov(ch.length);
            this.change[1]=this.pt;// ending point
            this.txt_changed=true;
        },
        del(n){// delete n chars to right of p (or left if n<0)
            if(n==0||n+this.pt<0){return;}
            this.change[0]=this.pt;// starting point
            var del_left=n<0?n:0, del_right=n<0?0:n;
            // if cursor left deleted N newlines, lin-=N
            if(del_left){
                var nls=this.a.slice(this.pt+del_left,this.pt).match(/\n/g)
                if(nls!==null){this.lin-=nls.length;console.log(this.lin);}
            }
            this.a=this.a.slice(0,this.pt+del_left)+this.a.slice(this.pt+del_right);
            this.mov(del_left);// only move cursor for left deletes
            this.change[1]=this.pt;// ending point
            this.txt_changed=true;
        },
        mov(n=1){// move the cursor
            this.pt=this.pt+n;
            if(this.pt<0){this.pt=0;console.log('begin');}
            else if(this.pt>this.a.length){this.pt=this.a.length;console.log('end');}
            if(this.pt==this.change[1]){this.change[0]=this.pt;}
            // this.pt now equals the "destination".
            // the "source" is still cached in this.change[0]

            // update line number
            if(n<0){
                // if we moved left over a N newlines, lin -= N
                var lines_left=this.a.slice(this.pt,this.change[0]).match(/\n/g);
                if(lines_left!==null){this.lin-=lines_left.length;if(this.lin<0){this.lin=0;}}
            }
            else{
                // likewise if we move right over N, lin += N
                var lines_right=this.a.slice(this.change[0],this.pt).match(/\n/g);
                if(lines_right!==null){this.lin+=lines_right.length;}
            }
        },
    }),
    buf=Buffer();

// udpate : [RawKey] -> BufferAction
var update=(rks,t)=>{
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
                if(dec.code=='f'){ESC_FD=-t;}
                if(dec.code=='d'&&ESC_FD<0&&t+ESC_FD<500){
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

var spot={x:20,y:20,h:0,lh:undefined};// screen border, cached offsets

var render_cursor=()=>{
    var w=p.measureText(buf.a.slice(buf.a.lastIndexOf('\n',buf.pt)+1,buf.pt)).width;
    p.clearRect(0,0,p.canvas.width,p.canvas.height);//whole canvas?!
    spot.lh=spot.lh||p.measureText('W').width;
    p.fillStyle='rgba(20,255,255,'+Math.abs(Math.cos(performance.now()/500))+')';
    p.fillRect(spot.x+w,spot.y+spot.lh*(buf.lin-0)-spot.h,1,spot.h);
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
