'use strict';
var c=document.getElementById('c').getContext('2d'),
    grid=25, // monospace grid width/height
    CodeStack=[], // enables making the event handler more lightweight
    Cursor=()=>{
        // data structure to help render text
        var crsr={
            x:0,y:0,width:0,height:0,
            init(){this.width=c.measureText('W').width;
                   this.height=this.width*2;
                   this.x=this.width;this.y=this.width*2;},
            up(){this.y-=this.height;},
            down(){this.y+=this.height;},
            right(){this.x+=this.width;if(this.x>c.canvas.width){this.crlf();}},
            left(){this.x-=this.width;if(this.x<this.width){this.x=this.width;}},
            crlf(){this.x=this.width;this.y+=this.height;}
        };
        crsr.init();
        return crsr;
    },
    Buffer=()=>({
        // data structure for the text
        pos:0,data:[],changed:false,
        dec(){this.pos>0&&--this.pos;},
        inc(){this.pos<this.data.length&&++this.pos;},
        add(ch){this.data.push(ch);this.changed=true;this.inc();},
        rem(){this.data.pop();this.changed=true;this.dec();}
    }),
    cursor=Cursor(), // for drawing text to the screen
    point=Cursor(), // for the current cursor position
    buf=Buffer();

// testing
for(var j=0;j<200;++j){
    for(var i=0;i<img.length;++i){buf.add(img[i]);}
}
console.log(buf.data.length);

var render_text=(now)=>{
    cursor.init();
    c.fillStyle='black';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='lightGray';
    var tw=cursor.width;
    for(var i=0;i<buf.data.length;++i){
        if(cursor.y-cursor.height>c.canvas.height){break;}
        if(buf.data[i]=='\t'){
            if(cursor.x+tw*4+grid>c.canvas.width){cursor.crlf();}
            else{cursor.x+=4*tw;}
        }
        else if(buf.data[i]=='\n'){cursor.crlf();}
        else if(cursor.x+tw+grid>c.canvas.width){cursor.crlf();}
        else{
            cursor.x+=tw;
            c.fillText(buf.data[i],cursor.x,cursor.y);
        }
    }
};

var service_queue=(now,override)=>{
    requestAnimationFrame(service_queue);
    if(buf.changed||override){buf.changed=false;render_text();}
    render_cursor(now);
};

var render_cursor=(now)=>{
    var blink_alpha=Math.cos(0.005*now)/2+0.5;
    c.fillStyle='blue';
    c.fillRect(point.x+point.width,point.y-grid*1.25,1,grid*1.25);
    c.fillStyle='rgba(255,255,255,'+blink_alpha+')';
    c.fillRect(point.x+point.width,point.y-grid*1.25,1,grid*1.25);
};

//  update : {decoded key} -> Keystate -> Action k
var update=(dec_k,state)=>{
    switch(dec_k.type){
    case'print':buf.add(dec_k.code);break; // add char to text buffer
    case'edit':if(dec_k.code=='B'){buf.rem();}break;
    case'arrow':break;
    case'page':break;
    }
};

var decode=(mods,k)=>{
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
        cursor.x=grid; cursor.y=grid*1.5;
        c.font='14px monospace'; // FIXME non-monospace fonts are messed up
        window.requestAnimationFrame((now)=>service_queue(now,true));
    };rsz();
    var kev=(k)=>{
        if(k.type=='keydown'){
            k.preventDefault();
            CodeStack.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],k:k.code});
            console.log(CodeStack);
            var decoded=decode([k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],k.code)
            update(decoded,{});
        }
    };
    window.onresize=rsz;
    window.onkeydown=kev;
    //window.onkeyup=kev; // currently unused
};
