'use strict';
var c=document.getElementById('c').getContext('2d'),
    border=25, // monospace grid width/height
    cursor={x:25,y:75}, // cursor position on grid
    mode={insert:true,normal:false,visual:false},
    txt=[],
    prevtxtlen=0,
    pressed_codes=new Set(); // keys that are down right now

var update_txt=(ks)=>{
    if(!ks){return;}
    if(ks.act=='Backspace'){txt.pop();}
    else if(ks.c.length==0){return;}
    else{txt.push(ks.c);}
};

var render=()=>{
    requestAnimationFrame(render);
    //if(txt.length==prevtxtlen){return;}
    //prevtxtlen=txt.length;
    cursor.x=border;cursor.y=border*2.5;
    c.fillStyle='black';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='lightGray';
    c.font='28px monospace';
    var newline=()=>{cursor.x=border;cursor.y+=border*1.5;}
    for(var i=0;i<txt.length;++i){
        var tw=c.measureText(txt[i]).width;
        if(cursor.x+tw+border>c.canvas.width){newline();}
        if(txt[i]=='\t'){
            if(cursor.x+tw*4+border>c.canvas.width){newline();}
            else{cursor.x+=4*tw;}
        }
        else if(txt[i]=='\n'){newline();}
        else if(cursor.x+tw+border>c.canvas.width){newline();}
        else{cursor.x+=tw;c.fillText(txt[i],cursor.x,cursor.y);}
    }
};

var decode=(a,c,m,s,k)=>{//console.log(k);
    var action={c:''};
    if(k=='Space'){action.c=' ';}
    var ma=k[k.length-1]; // maybe alphanumeric
    switch(k.slice(0,-1)){
    case'Key':action.c=s?ma:ma.toLowerCase();break;
    case'Digit':action.c=s?")!@#$%^&*("[ma]:ma;break;
    }
    var punct=['Comma',',','<'
               ,'Quote',"'",'"'
               ,'Equal','=','+'
               ,'Minus','-','_'
               ,'Slash','/','?'
               ,'Period','.','>'
               ,'Semicolon',';',':'
               ,'Backslash','\\','|'
               ,'Backquote','`','~'
               ,'BracketLeft','[','{'
               ,'BracketRight',']','}'
              ]; // maybe all the keys should be done this way, hmm...
    var pin=punct.indexOf(k);
    if(pin>=0){action.c=punct[pin+(s?2:1)];}

    // TODO #6 cursor movers
    switch(k){
    case'Tab':action.act='Tab';action.c='\t';break;
    case'Enter':action.act='Enter';action.c='\n';break;
    default:action.act=k;break; // everything else (escape, arrows, page up/down, etc.)
    }
    return action;
};

window.onload=()=>{
    var rsz=()=>{
        c.canvas.width=c.canvas.clientWidth;
        c.canvas.height=c.canvas.clientHeight;
        cursor.x=border; cursor.y=border*2.5;
        c.fillStyle='black';
        c.fillRect(0,0,c.canvas.width,c.canvas.height);
    };
    rsz();
    window.onresize=rsz;
    window.onkeydown=window.onkeyup=(k)=>{
        if(k.type=='keydown'){
            k.preventDefault();
            pressed_codes.add(k.keyCode);
            update_txt(decode(k.altKey,k.ctrlKey,k.metaKey,k.shiftKey,k.code))
        }
        if(k.type=='keyup'){pressed_codes.delete(k.keyCode);}
    };
    requestAnimationFrame(render);
};
