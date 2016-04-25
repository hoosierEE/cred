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
        change:[0,0],// [previous_pt, current_pt]
        load(txt){this.a='';this.change=[0,0];this.pt=0;this.ins(txt);this.mov(0);},
        lines(){return this.a.split(/\n/g);},// array of all the buffer's lines
        words(){return this.a.split(/\s/g).reduce((a,b)=>a.concat(b),[]);},
        // modes
        append_mode(){if(this.a[this.pt]!=='\n'){this.mov(1);}},
        insert_mode(){/* a no-op, to make the API feel more natural */},
        esc_fd(){
            this.del(-2);
        },
        ins(ch){// insert ch chars to right of p
            if(this.pt==this.a.length){this.a=this.a+ch;}
            else{var fst=this.a.slice(0,this.pt),snd=this.a.slice(this.pt);this.a=fst+ch+snd;}
            this.mov(ch.length);
            this.txt_changed=true;
        },
        del(n){// delete n chars to right of p (or left if n<0)
            if(n==0||n+this.pt<0){return;}
            var del_left=n<0?n:0, del_right=n<0?0:n;
            var fst=this.a.slice(0,this.pt+del_left),
                snd=this.a.slice(this.pt+del_right);
            if(del_left){this.mov(del_left);}// move cursor for left deletes
            this.a=fst+snd;
            this.txt_changed=true;
        },
        mov(n=1){// move cursor
            this.change[0]=this.pt;// location before move
            //this.pt=this.pt+n;
            if(this.pt+n<0){this.pt=0;}
            else if(this.pt+n>this.a.length){this.pt=this.a.length;}
            else{this.pt+=n;}
            this.change[1]=this.pt;// location after move
            // update line number
            for(var i=this.change[n<0?1:0];i<this.change[n<0?0:1];++i){
                if(this.a[i]&&this.a[i]=='\n'){this.ln+=(n<0?-1:1);if(this.ln<0){this.ln=0;}}
            }
        },
    }),
    ScreenOffsets=()=>({
        x:20,y:20,h:0,lh:undefined,
        init(ctx){this.lh=ctx.measureText('W').width;}
    }),
    buf=Buffer(),
    offs=ScreenOffsets();

var render_cursor=()=>{

    // left edge of cursor, currently
    var cur_l=p.measureText(buf.a.slice(buf.a.lastIndexOf('\n',buf.change[1]-1)+1,buf.change[1])).width;
    // right edge of cursor, currently
    var cur_r,wid;

    // left edge of cursor, previously
    var prev_l=p.measureText(buf.a.slice(buf.a.lastIndexOf('\n',buf.change[0]-1)+1,buf.change[0])).width;
    // right edge of cursor, previously
    var prev_r,pwid;

    p.clearRect(0,0,p.canvas.width,p.canvas.height);//whole canvas?!
    if(MODE=='normal'){
        cur_r=buf.a[buf.change[1]];
        prev_r=buf.a[buf.change[0]];
        p.fillStyle='orange';
        console.log(cur_r+' '+prev_r);
        if(cur_r=='\n'||cur_r==undefined){wid=10;}
        else{
            p.save();
            // draw the character under the cursor
            p.fillStyle='black';
            p.fillText(buf.a[buf.change[1]],offs.x+cur_l,(offs.y+offs.lh*buf.ln));
            // draw the character at the previous position
            p.fillStyle='magenta';
            p.fillText(buf.a[buf.change[0]],offs.x+prev_l,(offs.y+offs.lh*buf.ln));
            p.restore();
            wid=p.measureText(cur_r).width;
        }
    }else{
        wid=1;// thin cursor during insert operation
        p.fillStyle='lime';
    }
    var ofx=offs.x+cur_l;
    var ofy=offs.y+offs.lh*(buf.ln)-offs.h;
    var cwd=wid;
    var cwh=offs.h*1.1;
    p.fillRect(ofx,ofy,cwd,cwh);
};

var render_text=()=>{
    offs.h=c.measureText('W').width;
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
    if(k.type=='keydown'){// push incoming events to a queue as they occur
        if(!k.metaKey){k.preventDefault();}
        KEYQ.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey], k:k.code});
    }
};

buf.load('a test with\na newline');
