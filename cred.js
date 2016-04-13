'use strict';
var c=document.getElementById('c').getContext('2d'),
    mode={insert:true,normal:false,visual:false},
    grid=25, // monospace grid width/height
    Cursor=()=>{
        var crsr={
            x:0,y:0,
            width(){return c.measureText('a').width;},
            init(){this.x=grid;this.y=grid*2.5;},
            up(){this.y-=grid*1.5;},
            down(){this.y+=grid*1.5;},
            right(){this.x+=this.width();
                    if(this.x>c.canvas.width){this.crlf();}},
            left(){this.x-=this.width();if(this.x<grid){this.x=grid;}},
            crlf(){this.x=grid;this.y+=grid*1.5;}
        };
        crsr.init();
        return crsr;
    },
    txt={pos:0,data:[]}; // editing position, entire contents
var cursor=Cursor(); // for drawing text to the screen
var point=Cursor(); // for the current cursor position

var render_text=()=>{
    requestAnimationFrame(render_text);
    cursor.init();
    c.fillStyle='black';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='lightGray';
    c.font='28px monospace'; // FIXME non-monospace fonts are messed up
    var tw=cursor.width();
    for(var i=0;i<txt.data.length;++i){
        // TODO only draw what's visible
        if(cursor.x+tw+grid>c.canvas.width){cursor.crlf();}
        if(txt.data[i]=='\t'){
            if(cursor.x+tw*4+grid>c.canvas.width){cursor.crlf();}
            else{cursor.x+=4*tw;}
        }
        else if(txt.data[i]=='\n'){cursor.crlf();}
        else if(cursor.x+tw+grid>c.canvas.width){cursor.crlf();}
        else{
            cursor.x+=tw;
            c.fillText(txt.data[i],cursor.x,cursor.y);
        }
    }
    var blink_alpha=0.7+0.5*Math.cos(Date.now()*0.007);
    c.fillStyle='rgba(255,255,255,'+blink_alpha+')';
    c.fillRect(point.x+point.width(),point.y-grid*1.25,1,grid*1.25);
};

//  decode : [mods] -> keycode -> {type:string,code:char,mods:[bool]}
var decode=(mods,k)=>{
    var dec={type:'',code:'',mods:mods}; // return type
    if(k=='Space'){dec.code=' ';}else{
        var shft=mods[3];
        var ma=k.slice(-1); // maybe alphanumeric
        switch(k.slice(0,-1)){
        case'Key':dec.code=shft?ma:ma.toLowerCase();break;
        case'Digit':dec.code=shft?")!@#$%^&*("[ma]:ma;break; // sigh
        }
        switch(k){
        case'Tab':dec.code='\t';break;
        case'Enter':dec.code='\n';break;
        }
        var punct=['Comma',',','<','Quote',"'",'"','Equal','=','+','Minus','-','_'
                   ,'Slash','/','?','Period','.','>','Semicolon',';',':','Backslash','\\','|'
                   ,'Backquote','`','~','BracketLeft','[','{','BracketRight',']','}'];
        var pin=punct.indexOf(k);
        if(pin>=0){dec.code=punct[pin+(shft?2:1)];}
    }
    // non-printable keys
    if(dec.code.length>0){dec.type='printable';}else{
        if(k=='Backspace'||k=='Delete'){dec.type='edit'; dec.code=k[0].toLowerCase();} // 'b','d'
        else if(k=='Escape'){dec.type='escape'; dec.code='e';} // 'e'
        else if(k.slice(0,5)=='Arrow'){dec.type='arrow'; dec.code=k[5].toLowerCase();} // 'u','d','l','r'
        else if(k.slice(0,4)=='Page'){dec.type='page'; dec.code=k[4].toLowerCase();} // 'u','d'
        else if(k=='Home'||k=='End'){dec.type='page'; dec.code=k[0].toLowerCase();} // 'h','e'
    }
    console.log(dec);
    return dec;
};

window.onload=()=>{
    var rsz=()=>{
        c.canvas.width=c.canvas.clientWidth;
        c.canvas.height=c.canvas.clientHeight;
        cursor.x=grid; cursor.y=grid*1.5;
        c.fillStyle='black';
        c.fillRect(0,0,c.canvas.width,c.canvas.height);
    };
    rsz();
    window.onresize=rsz;
    window.onkeydown=window.onkeyup=(k)=>{
        if(k.type=='keydown'){
            k.preventDefault();
            decode([k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],k.code);
        }
    };
    requestAnimationFrame(render_text);
};
