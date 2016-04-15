'use strict';
var c=document.getElementById('c').getContext('2d'),
    KeyStack=[{mods:[],k:''}], // enables making the event handler more lightweight
    Buffer=()=>({
        // text data
        pos:0,data:[],changed:false,
        dec(){this.pos>0&&--this.pos;},
        inc(){this.pos<this.data.length&&++this.pos;},
        add(ch){this.data.push(ch);this.changed=true;this.inc();},
        rem(){this.data.pop();this.changed=true;this.dec();}
    }),
    Cursor=()=>({
        // text rendering
        x:0,y:0,width:0,height:0,
        home(){this.width=c.measureText('W').width;this.height=this.width*2;
               this.x=this.width;this.y=this.width*2;},
        up(){this.y-=this.height;},
        down(){this.y+=this.height;},
        right(){this.x+=this.width;if(this.x>c.canvas.width){this.crlf();}},
        left(){this.x-=this.width;if(this.x<this.width){this.x=this.width;}},
        crlf(){this.x=this.width;this.y+=this.height;},
        to(p){this.x=p[0],this.y=p[1];},
    }),
    cursor=Cursor(), // for drawing text to the screen
    point=Cursor(), // for the current cursor position
    buf=Buffer();

// testing
for(var i=0;i<250;++i){buf.add(img[i]);}
console.log(buf.data.length);

var render_text=(now)=>{
    cursor.home();
    c.fillStyle='#000';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='lightgray';
    for(var i=0;i<buf.data.length;++i){
        var tw=c.measureText(buf.data[i]).width; // non-monospace fix!
        //console.log(buf.data[i]+' '+tw);
        if(cursor.y-cursor.height>c.canvas.height){break;} // don't render beyond canvas
        if(buf.data[i]=='\t'){
            if(cursor.x+tw*4+cursor.width>c.canvas.width){cursor.crlf();}
            else{cursor.x+=4*tw;}
        }
        else if(buf.data[i]=='\n'){cursor.crlf();}
        else if(cursor.x+tw+cursor.width>c.canvas.width){cursor.crlf();}
        else{
            c.fillText(buf.data[i],cursor.x,cursor.y);
            cursor.x+=tw;
        }
    }
};

var service_queue=(now,override)=>{
    requestAnimationFrame(service_queue);
    update();
    if(buf.changed||override){
        buf.changed=false;
        render_text();
        point.to([cursor.x,cursor.y]);
    }
    render_cursor(now);
};

var render_cursor=(now)=>{
    var blink_alpha=Math.cos(0.005*now)/2+0.5;
    c.fillStyle='blue';
    c.fillRect(point.x, point.y-point.height, 1, point.height);
    c.fillStyle='rgba(255,255,255,'+blink_alpha+')';
    c.fillRect(point.x, point.y-point.height, 1, point.height);
};

var update=()=>{
    while(KeyStack.length){
        var dec_k=decode(KeyStack.pop());
        switch(dec_k.type){
        case'print':buf.add(dec_k.code);break; // add char to text buffer
        case'edit':if(dec_k.code=='B'){buf.rem();}break;
        case'arrow':
            switch(dec_k.code){
            case'R':point.right();break;
            case'L':point.left();break;
            case'U':point.up();break;
            case'D':point.down();break;
            }
        case'page':break;
        }
    }
};

var decode=(cs)=>{
    var k=cs.k, mods=cs.mods;
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
        point.home();
        cursor.home();
        c.font='24px Sans-Serif';
        window.requestAnimationFrame((now)=>service_queue(now,true));
    };rsz();
    var kev=(k)=>{
        if(k.type=='keydown'){
            k.preventDefault();
            KeyStack.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],k:k.code});
        }
    };
    window.onresize=rsz;
    window.onkeydown=kev;
    //window.onkeyup=kev; // currently unused
};
