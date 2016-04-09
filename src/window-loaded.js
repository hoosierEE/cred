'use strict';
var rsz=()=>{
    var c=document.getElementById('c').getContext('2d');
    c.canvas.width=window.innerWidth;
    c.canvas.height=window.innerHeight;
    reset();
};

const grid={width:25,height:50}; // monospace width/height
var c=document.getElementById('c').getContext('2d');
var cursor={x:25,y:75};
var reset=()=>{
    cursor.x=grid.width;
    cursor.y=grid.height;
    c.fillStyle='black';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
};

var write=(ks)=>{
    if(undefined===ks)return;
    c.fillStyle='lightGray';
    c.font='28px monospace';
    c.fillText(ks,cursor.x,cursor.y);
    cursor.x+=grid.width;
    if(cursor.x>c.canvas.width){cursor.y+=grid.height; cursor.x=grid.width;} // wrap
};

var decode=({mods:a,key:k})=>{
    // TODO support modifier keys besides just Shift
    console.log(k);
    var ma=k[k.length-1]; // maybe alphanumeric
    if(k.startsWith('Key')){return a[3]?ma:ma.toLowerCase();}
    if(k=='Space'){return ' ';}
    var symbol=")!@#$%^&*(";
    if(k.startsWith('Digit')){return a[3]?symbol[ma]:ma;}
};

window.onload=()=>{
    var pressed_codes=new Set();
    window.onresize=rsz;
    window.onkeydown=window.onkeyup=(k)=>{
        if(k.type=='keydown'){
            k.preventDefault(); // NOTE: required by browser version, not Chrome app
            pressed_codes.add(k.keyCode);
            //console.log(k.code);
            write(decode({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],key:k.code}));
        }
        if(k.type=='keyup'){pressed_codes.delete(k.keyCode);}
    };
    rsz();
};
