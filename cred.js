'use strict';
var c=document.getElementById('c').getContext('2d'),
    KeyStack=[{mods:[false,false,false,false],k:''}], // permits lightweight key event handler
    Buffer=()=>({
        // cursor position
        pos:0,data:[],
        dec(){this.pos>0&&--this.pos;},
        inc(){++this.pos;},
        changed:false,
        // text operations
        add(ch){
            this.changed=true;
            if(this.pos==this.data.length){this.data.push(ch);}
            else{this.data.splice(this.pos,0,ch);}
            this.inc();
        },
        rem(){
            this.changed=true;
            this.dec();
            if(this.pos==this.data.length){this.data.pop();}
            else{this.data.splice(this.pos,1);}
        }
    }),
    Cursor=()=>({
        // text rendering
        x:0,y:0,width:0,height:0,moved:false,
        home(){this.width=c.measureText('W').width;this.height=this.width*1.5;
               this.x=this.width;this.y=this.width*1.5;},
        go(dir){
            if(dir=='L')this.left();
            else if(dir=='U')this.up();
            else if(dir=='R')this.right();
            else if(dir=='D')this.down();
        },
        up(){this.y-=this.height;},
        down(){this.y+=this.height;},
        right(){if(buf.pos==buf.data.length){return;}
                this.moved=true;
                this.width=c.measureText(buf.data[++buf.pos]).width;
                this.x+=this.width;
                if(this.x>c.canvas.width){this.crlf();}},
        left(){this.moved=true;
               this.width=c.measureText(buf.data[--buf.pos]).width;
               this.x-=this.width;
               if(this.x<this.width){this.x=this.width;}},
        crlf(){this.x=this.width;this.y+=this.height;},
        to(p){this.x=p[0],this.y=p[1];},
    }),
    cur=Cursor(), // for drawing text to the screen
    buf=Buffer();

// test text
for(var i=0;i<250;++i){buf.add(img[i]);}
console.log(buf.data.length);

var service_queue=(now,override)=>{
    update(KeyStack);
    if(buf.changed||override||cur.moved){
        buf.changed=false;
        cur.moved=false;
        render_text(now,cur);
    }
    requestAnimationFrame(service_queue);
};

var render_text=(now,cur)=>{
    cur.home();
    c.fillStyle='#222';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='lightgray';
    for(var i=0;i<buf.data.length;++i){
        if(buf.pos==i){c.fillRect(cur.x, cur.y-cur.height, 1, cur.height);}
        var tw=c.measureText(buf.data[i]).width; // non-monospace fix!
        if(cur.y-cur.height>c.canvas.height){break;} // don't render beyond canvas
        if(buf.data[i]=='\t'){
            if(cur.x+tw*4+cur.width>c.canvas.width){cur.crlf();}
            else{cur.x+=4*tw;}
        }
        else if(buf.data[i]=='\n'){cur.crlf();}
        else{
            c.fillText(buf.data[i],cur.x,cur.y);
            cur.x+=tw;
        }
        if(cur.x+tw+cur.width>c.canvas.width){cur.crlf();}
    }
    if(buf.pos==buf.data.length){c.fillRect(cur.x, cur.y-cur.height, 1, cur.height);}
};

var render_cursor=(now,point)=>{
    c.fillStyle='rgba(0,0,0,0.01)';
    c.fillRect(0,point.y-point.height*2,c.canvas.width,point.height*3);
    //c.fillRect(point.x, point.y-point.height, 1, point.height);
    //c.clearRect(point.x, point.y-point.height, 1, point.height);
    var blink_alpha=Math.cos(0.005*now)/2+0.5;
    c.fillStyle='rgba(255,255,255,'+blink_alpha+')';
    c.fillRect(point.x, point.y-point.height, 1, point.height);
};

// udpate : [RawKey] -> BufferAction
var update=(rks)=>{
    while(rks.length){ // consume KeyStack, dispatch event handlers
        var dec=decode(rks.pop());
        switch(dec.type){
        case'print':buf.add(dec.code);break; // add char to text buffer
        case'edit':if(dec.code=='B'){buf.rem();}break;
        case'arrow':cur.go(dec.code);break;
        case'page':break; // TODO remaining handlers
        }
    }
};


window.onload=()=>{
    var rsz=()=>{
        c.canvas.width=c.canvas.clientWidth;
        c.canvas.height=c.canvas.clientHeight;
        cur.home();
        c.font='24px Sans-Serif';
        window.requestAnimationFrame((now)=>service_queue(now,true));
    };rsz();
    window.onresize=rsz;
    window.onkeydown=(k)=>{
        if(k.type=='keydown'){
            k.preventDefault();
            KeyStack.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],k:k.code});
        }
    };
};
