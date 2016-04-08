'use strict';
var rsz=()=>{
    var c=document.getElementById('c').getContext('2d');
    c.canvas.width=window.innerWidth;
    c.canvas.height=window.innerHeight;
    print('howdy fsdsdf');
};

var decode=(k)=>{
    // given a Set of KeyboardEvent, get the typed character.
};

var cursor={x:50,y:75};
var print=(ks)=>{
    var c=document.getElementById('c').getContext('2d');
    c.fillStyle='rgba(200,200,200,0.99)'; // cheap fade out effect
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='rgba(20,100,131,0.7)';
    c.font='28px monospace';
    c.fillText(ks,cursor.x,cursor.y);
};

window.onload=()=>{
    var keyset=new Set();
    window.onresize=rsz;
    window.onkeydown=window.onkeyup=(k)=>{
        if(k.type=='keydown'){
            var kc=k.keyCode;
            console.log(kc);
            keyset.add(k);
            print(decode(k));
        }
        if(k.type=='keyup')keyset.delete(k);
    };
    rsz();
};
