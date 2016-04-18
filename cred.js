'use strict';
var c=document.getElementById('c').getContext('2d'),
    Mode='normal', // Vim modes
    KeyQueue=[{mods:[false,false,false,false],k:''}], // lightens duties for key event handler
    Buffer=()=>({
        // cursor position
        pos:0,data:[], // currently a simple Array
        dec(){this.pos>0&&--this.pos;},
        inc(){++this.pos;},
        changed:false,
        ins(ch){ // append ch chars to position pos
            this.changed=true;
            if(this.pos==this.data.length){this.data.push(ch);}
            else{this.data.splice(this.pos,0,ch);}
            this.inc();
        },
        del(n){ // delete n chars before (n<0) or after (n>0) cursor
            if(n==0){return;}
            if(n<0){this.dec();
                    if(this.pos==this.data.length){for(var i=0;i<n*-1;++i){this.data.pop();}}
                    else{this.data.splice(this.pos,1);}}
            else{if(this.pos==this.data.length){return;}
                 else{for(var i=1;i<=n;++i){this.data.splice(this.pos,i);}}}
            this.changed=true;
        }
    }),

    Cursor=(buf)=>({
        x:0,y:0,width:0,height:0,moved:false,
        home(){this.width=c.measureText('W').width;this.height=this.width*1.5; this.x=this.width;this.y=this.width*1.5;},
        up(){var there=buf.data.lastIndexOf('\n',buf.pos-1); this.left(buf.pos-(there<0?0:there));},
        down(){var there=buf.data.indexOf('\n',buf.pos+1); this.right(there<0?buf.data.length-buf.pos:there-buf.pos);},
        right(n=1){
            while(n-->0){
                if(buf.pos==buf.data.length){return;}
                this.moved=true;
                this.width=c.measureText(buf.data[++buf.pos]).width;
                this.x+=this.width;
                if(this.x>c.canvas.width){this.crlf();}
            }
        },
        left(n=1){
            while(n-->0){
                if(buf.pos==0){return;}
                this.moved=true;
                this.width=c.measureText(buf.data[--buf.pos]).width;
                this.x-=this.width;
                if(this.x<this.width){this.x=this.width;}
            }
        },
        crlf(){this.x=this.width;this.y+=this.height;},
        to(p){this.x=p[0],this.y=p[1];},
    }),
    buf=Buffer();
var cur=Cursor(buf); // for drawing text to the screen

for(var i=0;i<20;++i){buf.ins(img[i]);} // testing

var gameloop=(now,resiz)=>{
    update(KeyQueue);
    if(cur.moved||buf.changed||resiz){
        cur.moved=false;
        render_text(now,cur);
        buf.changed=false;
    }
    requestAnimationFrame(gameloop);
};

var render_text=(now,cur)=>{
    cur.home();
    c.fillStyle='#222';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='lightgray';
    for(var i=0;i<buf.data.length;++i){
        if(buf.pos==i){c.fillRect(cur.x, cur.y-cur.height, 1, cur.height);} // draw cursor
        var tw=c.measureText(buf.data[i]).width; // non-monospace fix!
        if(cur.y-cur.height>c.canvas.height){break;} // don't render beyond canvas
        if(buf.data[i]=='\t'){if(cur.x+tw*4+cur.width>c.canvas.width){cur.crlf();}else{cur.x+=4*tw;}}
        else if(buf.data[i]=='\n'){cur.crlf();}
        else{c.fillText(buf.data[i],cur.x,cur.y); cur.x+=tw;}
        if(cur.x+tw+cur.width>c.canvas.width){cur.crlf();}
    }
    if(buf.pos==buf.data.length){c.fillRect(cur.x, cur.y-cur.height, 1, cur.height);}
};

// udpate : [RawKey] -> BufferAction
var update=(rks)=>{
    while(rks.length){ // consume KeyQueue, dispatch event handlers
        var dec=decode(rks.shift()); // behead queue
        if(Mode=='normal'){
            switch(dec.code){
            case'i':Mode='insert';break;
            case'h':cur.left();break;
            case'j':cur.down();break;
            case'k':cur.up();break;
            case'l':cur.right();break;
            }
        }
        else if(Mode=='insert'){
            switch(dec.type){
            case'escape':Mode='normal';break;
            case'print':buf.ins(dec.code);break; // ins char to text buffer
            case'edit':buf.del(dec.code=='B'?-1:1);break;
                // TODO remaining handlers
            case'page':break;}
        }
        if(dec.type=='arrow'){
            switch(dec.code){
            case'D':cur.down();break;
            case'U':cur.up();break;
            case'R':cur.right();break;
            case'L':cur.left();break;}
        }
    }
};

window.onload=()=>{
    var rsz=()=>{
        c.canvas.width=c.canvas.clientWidth;
        c.canvas.height=c.canvas.clientHeight;
        c.font='24px Sans-Serif';
        window.requestAnimationFrame((now)=>gameloop(now,true));
    };rsz();
    window.onresize=rsz;
    window.onkeydown=(k)=>{
        if(k.type=='keydown'){
            // push incoming events to a queue as they occur
            k.preventDefault();
            KeyQueue.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],k:k.code});
        }
    };
};
