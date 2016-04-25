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
        append_mode(){if(this.a[this.pt]!=='\n'){this.mov(1);}},
        insert_mode(){if(this.a[this.pt]==undefined){this.mov(-1);}},
        normal_mode(){if(this.a[this.pt-1]=='\n'){this.del(-2);this.mov(1);}
                      else{this.del(-2);}},
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
            else if(this.pt>this.a.length){this.pt=this.a.length-1;}
            this.change[1]=this.pt;// ending point

            // what line is the cursor on now?
            for(var i=this.change[n<0?1:0];i<this.change[n<0?0:1];++i){
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
    var w=p.measureText(buf.a.slice(buf.a.lastIndexOf('\n',buf.pt-1)+1,buf.pt)).width,
        next_char=buf.a[buf.pt],
        next_char_width=0;
    p.clearRect(0,0,p.canvas.width,p.canvas.height);//whole canvas?!
    spot.lh=spot.lh||p.measureText('W').width;
    if(MODE=='normal'){
        p.fillStyle='orange';
        if(next_char=='\n'||next_char==undefined){next_char_width=10;}
        else{
            p.save();
            p.fillStyle='black';
            p.fillText(buf.a[buf.pt],spot.x+w,(spot.y+spot.lh*buf.ln));
            p.restore();
            next_char_width=p.measureText(next_char).width;
        }
    }else{next_char_width=1;p.fillStyle='lime';}
    p.fillRect(spot.x+w,spot.y+spot.lh*(buf.ln)-spot.h,next_char_width,spot.h*1.1);
};

var render_text=()=>{
    spot.h=c.measureText('W').width;
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    spot.y=spot.h+20;// border-top
    buf.lines().forEach((l,i)=>c.fillText(l,spot.x,spot.y+(i*spot.h)));
};

var gameloop=(now,resiz)=>{update(KEYQ,now); render_text(); render_cursor();};

var rsz=()=>{
    p.canvas.width=c.canvas.width=c.canvas.clientWidth;
    p.canvas.height=c.canvas.height=c.canvas.clientHeight;
    p.font=c.font='24px Sans-Serif';
    c.fillStyle='#cacada';
    p.globalCompositeOperation='multiply';
    requestAnimationFrame(now=>gameloop(now,true));
};

window.onload=rsz;
window.onresize=rsz;
window.onkeydown=(k)=>{
    if(k.type=='keydown'){// push incoming events to a queue as they occur
        k.preventDefault();
        KEYQ.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey], k:k.code});
        requestAnimationFrame(now=>gameloop(now,true));
    }
};

buf.load('a test with\na newline');
