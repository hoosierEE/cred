'use strict';
var rsz=()=>{
    var c=document.getElementById('c').getContext('2d');
    c.canvas.width=window.innerWidth;
    c.canvas.height=window.innerHeight;
    write('howdy fsdsdf');
};

var cursor={x:50,y:75};
var write=(ks)=>{
    var c=document.getElementById('c').getContext('2d');
    //c.fillStyle='rgba(120,80,80,0.99)'; // cheap fade out effect
    c.fillStyle='black';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='lightGray';
    c.font='28px monospace';
    c.fillText(ks,cursor.x,cursor.y);
};

window.onload=()=>{
    var pressed_codes=new Set();
    window.onresize=rsz;
    window.onkeydown=window.onkeyup=(k)=>{
        var mod='0123456789abcdef'[[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey]
                                   .map((a,b)=>a?1<<b:0)
                                   .reduce((a,b)=>a+b)];
        if(k.type=='keydown'){
            k.preventDefault();
            pressed_codes.add(k.keyCode);
            write(mod + String.fromCharCode(k.keyCode));
        }
        if(k.type=='keyup'){
            pressed_codes.delete(k.keyCode);
        }
        console.log(mod);
    };
    rsz();
};
