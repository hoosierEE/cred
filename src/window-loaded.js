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
    // update text, cursor position TODO separate data from rendering
    // draw to canvas
    if(undefined===ks){return;}
    c.fillStyle='lightGray';
    c.font='28px monospace';
    c.fillText(ks,cursor.x,cursor.y);
    cursor.x+=grid.width;
    if(cursor.x+grid.width>c.canvas.width){cursor.y+=grid.height; cursor.x=grid.width;} // wrap
};

var decode=({mods:a,key:k})=>{
    // TODO other modifiers (Shift is a[3])
    console.log(k);
    if(k=='Space'){return' ';}
    var ma=k[k.length-1]; // maybe alphanumeric
    switch(k.slice(0,-1)){
    case'Key':return a[3]?ma:ma.toLowerCase();
    case'Digit':return a[3]?")!@#$%^&*("[ma]:ma; // NOTE qwerty only
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
    if(pin>=0){return punct[pin+(a[3]?2:1)];}

    // different strategy required for these
    switch(k){
    case'Tab':return'\t'; // FIXME cursor position
    case'Enter':return'\n'; // FIXME cursor position
    case'Backspace':return; // FIXME cursor position
    case'Delete':return; // FIXME cursor position
    case'ArrowLeft':return;
    case'ArrowUp':return;
    case'ArrowDown':return;
    case'ArrowRight':return;
    case'Escape':return;
    }
};

window.onload=()=>{
    var pressed_codes=new Set();
    window.onresize=rsz;
    window.onkeydown=window.onkeyup=(k)=>{
        if(k.type=='keydown'){
            k.preventDefault();
            pressed_codes.add(k.keyCode);
            write(decode({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],key:k.code}));
        }
        if(k.type=='keyup'){pressed_codes.delete(k.keyCode);}
    };
    rsz();
};
