'use strict';
// {[Alt,Ctrl,Meta,Shift],keyCode} => Char
// TODO return Action Char instead, where Action can be one of
// insert, move cursor, etc.
var decode=({mods:a,keycode:k})=>{
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
