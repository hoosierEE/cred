'use strict';
var c=document.getElementById('c').getContext('2d'),
    KeyStack=[{mods:[],k:''}], // permits lightweight key event handler
    Buffer=()=>({
        // cursor position
        pos:0,data:[],
        dec(){this.pos>0&&--this.pos;},
        inc(){this.pos<this.data.length&&++this.pos;},
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
            this.data.pop();
            this.dec();
        }
    }),
    Cursor=()=>({
        // text rendering
        x:0,y:0,width:0,height:0,
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
        right(){this.x+=this.width;if(this.x>c.canvas.width){this.crlf();}},
        left(){this.x-=this.width;if(this.x<this.width){this.x=this.width;}},
        crlf(){this.x=this.width;this.y+=this.height;},
        to(p){this.x=p[0],this.y=p[1];},
    }),
    cur=Cursor(), // for drawing text to the screen
    buf=Buffer();

// test text
for(var i=0;i<250;++i){buf.add(img[i]);}
console.log(buf.data.length);

var service_queue=(now,override)=>{
    update();
    //c.globalCompositeOperation='destination-over';
    //c.save();
    render_cursor(now,cur); // animated blinky cursor
    if(buf.changed||override){
        buf.changed=false;
        //c.globalCompositeOperation='source-over';
        render_text(now,cur);
        cur.to([cur.x,cur.y]);
    }
    //c.restore();
    requestAnimationFrame(service_queue);
};

var render_text=(now,cur)=>{
    cur.home();
    c.fillStyle='#222';
    //c.clearRect(0,0,c.canvas.width,c.canvas.height);
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='lightgray';
    for(var i=0;i<buf.data.length;++i){
        var tw=c.measureText(buf.data[i]).width; // non-monospace fix!
        if(cur.y-cur.height>c.canvas.height){break;} // don't render beyond canvas
        if(buf.data[i]=='\t'){
            if(cur.x+tw*4+cur.width>c.canvas.width){cur.crlf();}
            else{cur.x+=4*tw;}
        }
        else if(buf.data[i]=='\n'){cur.crlf();}
        else if(cur.x+tw+cur.width>c.canvas.width){cur.crlf();}
        else{
            c.fillText(buf.data[i],cur.x,cur.y);
            cur.x+=tw;
        }
    }
};

var render_cursor=(now,point)=>{
    c.fillStyle='blue';
    //c.clearRect(0,point.y-point.height*2,c.canvas.width,point.height*3);
    c.fillRect(point.x, point.y-point.height, 1, point.height);
    //c.clearRect(point.x, point.y-point.height, 1, point.height);
    var blink_alpha=Math.cos(0.005*now)/2+0.5;
    c.fillStyle='rgba(255,255,255,'+blink_alpha+')';
    c.fillRect(point.x, point.y-point.height, 1, point.height);
};

var update=()=>{
    while(KeyStack.length){ // consume KeyStack, dispatch event handlers
        var dec=decode(KeyStack.pop());
        switch(dec.type){
        case'print':buf.add(dec.code);break; // add char to text buffer
        case'edit':if(dec.code=='B'){buf.rem();}break;
        case'arrow':cur.go(dec.code);break;
        case'page':break;
        }
    }
};

var decode=(ks)=>{
    var k=ks.k, mods=ks.mods; // get the components of the KeyStack
    var dec={type:'',code:'',mods:mods}; // return type (modifiers pass through)
    // printable
    if(k=='Space'){dec.code=' ';}
    else{
        var shft=mods[3];
        var ma=k.slice(-1); // maybe alphanumeric
        var kd=k.slice(0,-1);
        if(kd=='Key'){dec.code=shft?ma:ma.toLowerCase();}
        else if(kd=='Digit'){dec.code=shft?")!@#$%^&*("[ma]:ma;}
        else if(k=='Tab'){dec.code='\t';}
        else if(k=='Enter'){dec.code='\n';}
        else{
            var pun=['Comma',',','<','Quote',"'",'"','Equal','=','+','Minus','-','_'
                     ,'Slash','/','?','Period','.','>','Semicolon',';',':','Backslash','\\','|'
                     ,'Backquote','`','~','BracketLeft','[','{','BracketRight',']','}'];
            var pid=pun.indexOf(k);
            if(pid>=0){dec.code=pun[pid+(shft?2:1)];}
        }
    }
    // non-printable
    if(dec.code.length>0){dec.type='print';}
    else{
        if(k=='Backspace'||k=='Delete'){dec.type='edit';dec.code=k[0];} // 'b','d'
        else if(k=='Escape'){dec.type='escape';} // '' (should still be an empty string)
        else if(k.slice(0,5)=='Arrow'){dec.type='arrow';dec.code=k[5];} // 'u','d','l','r'
        else if(k.slice(0,4)=='Page'){dec.type='page';dec.code=k[4];} // 'u','d'
        else if(k=='Home'||k=='End'){dec.type='page';dec.code=k[0];} // 'h','e'
    }
    return dec;
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
