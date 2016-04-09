'use strict';
var c=document.getElementById('c').getContext('2d');
var grid={width:25,height:50}, // monospace grid width/height
    cursor={x:25,y:75};
var rsz=()=>{
    c.canvas.width=window.innerWidth; c.canvas.height=window.innerHeight;
    reset();
};
var reset=()=>{
    cursor.x=grid.width; cursor.y=grid.height;
    c.fillStyle='black';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
};

var write=(ks)=>{
    // update text, cursor position
    if(undefined===ks){return;}
    c.fillStyle='lightGray';
    c.font='28px monospace';
    c.fillText(ks,cursor.x,cursor.y);
    cursor.x+=grid.width;
    if(cursor.x+grid.width>c.canvas.width){cursor.y+=grid.height; cursor.x=grid.width;} // wrap
};

var decode=({mods:a,key:k})=>{
    // check common keys first
    // NOTE so far only handles Shift modifier key (a[3])
    console.log(k);
    if(k=='Space'){return' ';}
    var ma=k[k.length-1]; // maybe alphanumeric
    switch(k.slice(0,-1)){
    case'Key':return a[3]?ma:ma.toLowerCase();
    case'Digit':return a[3]?")!@#$%^&*("[ma]:ma;
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
              ]; // might be better to do all the keys like this...
    var pin=punct.indexOf(k);
    if(pin>=0){return punct[pin+(a[3]?2:1)];}

    switch(k){ // different strategy?
    case'Tab':return'\t'; // FIXME cursor position
    case'Enter':return'\n'; // FIXME cursor position
    case'Backspace':return; // FIXME cursor position
    case'Delete':return; // FIXME cursor position
    }
};

window.onload=()=>{
    var pressed_codes=new Set();
    window.onresize=rsz;
    window.onkeydown=window.onkeyup=(k)=>{
        if(k.type=='keydown'){
            k.preventDefault(); // NOTE: required for browser version, not Chrome app
            pressed_codes.add(k.keyCode);
            write(decode({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],key:k.code}));
        }
        if(k.type=='keyup'){pressed_codes.delete(k.keyCode);}
    };
    rsz();
};
