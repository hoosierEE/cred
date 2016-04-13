'use strict';
var test="asdf";
var c=document.getElementById('c').getContext('2d'),
    //mode={insert:true,normal:false,visual:false},
    grid=25, // monospace grid width/height
    Cursor=()=>{
        var crsr={
            x:0,y:0,width:0,
            init(){this.width=c.measureText('W').width;this.x=grid;this.y=grid*2.5;},
            up(){this.y-=grid*1.5;},
            down(){this.y+=grid*1.5;},
            right(){this.x+=this.width;if(this.x>c.canvas.width){this.crlf();}},
            left(){this.x-=this.width;if(this.x<grid){this.x=grid;}},
            crlf(){this.x=grid;this.y+=grid*1.5;}
        };
        crsr.init();
        return crsr;
    },
    GapBuffer=(sz)=>({
        // ported from https://github.com/jaz303/gapbuffer/blob/master/index.js
        gapsize:sz,
        buffer:new Array(sz),
        length(){this.buffer.length-(this.gapend-this.gapstart);},
    }),
    Text=()=>({
        pos:0,data:[],
        dec(){(this.pos>0)&&--this.pos;this.data.pop();},
        inc(){this.pos<this.data.length&&++this.pos;},
        append(ch){this.data.push(ch);this.inc();}
    }),
    cursor=Cursor(), // for drawing text to the screen
    point=Cursor(); // for the current cursor position
var txt=Text();
for(var i=0;i<test.length;++i){txt.data.push(test[i]);}

var render_text=()=>{
    requestAnimationFrame(render_text);
    cursor.init();
    c.fillStyle='black';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='lightGray';
    c.font='28px monospace'; // FIXME non-monospace fonts are messed up
    var tw=cursor.width;
    for(var i=0;i<txt.data.length;++i){
        // TODO only draw what's visible
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
    // blinking cursor
    var blink_alpha=0.7+0.5*Math.cos(Date.now()*0.005);
    c.fillStyle='rgba(255,255,255,'+blink_alpha+')';
    c.fillRect(point.x+point.width,point.y-grid*1.25,1,grid*1.25);
};

//  update : {decoded key} -> Keystate -> Action k
var update=(dec_k,state)=>{
    console.log(dec_k);
    switch(dec_k.type){
    case'print':txt.append(dec_k.code);break; // add char to text buffer
    case'edit':if(dec_k.code=='b'){txt.dec();}break;
    case'arrow':break;
    case'page':break;
    }
};

//  decode : [bool] -> string -> {type:string,code:char,mods:[bool]}
var decode=(mods,k)=>{
    var dec={type:'',code:'',mods:mods}; // return type
    // printable
    if(k=='Space'){dec.code=' ';}
    else{
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
        var pun=['Comma',',','<','Quote',"'",'"','Equal','=','+','Minus','-','_'
                 ,'Slash','/','?','Period','.','>','Semicolon',';',':','Backslash','\\','|'
                 ,'Backquote','`','~','BracketLeft','[','{','BracketRight',']','}'];
        var pid=pun.indexOf(k);
        if(pid>=0){dec.code=pun[pid+(shft?2:1)];}
    }
    // non-printable
    if(dec.code.length>0){dec.type='print';}
    else{
        if(k=='Backspace'||k=='Delete'){dec.type='edit'; dec.code=k[0].toLowerCase();} // 'b','d'
        else if(k=='Escape'){dec.type='escape';} // '' (should still be an empty string)
        else if(k.slice(0,5)=='Arrow'){dec.type='arrow'; dec.code=k[5].toLowerCase();} // 'u','d','l','r'
        else if(k.slice(0,4)=='Page'){dec.type='page'; dec.code=k[4].toLowerCase();} // 'u','d'
        else if(k=='Home'||k=='End'){dec.type='page'; dec.code=k[0].toLowerCase();} // 'h','e'
    }
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
            var decoded=decode([k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],k.code)
            update(decoded,{});
            //console.log(decoded);
        }
    };
    requestAnimationFrame(render_text);
};
