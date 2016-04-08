'use strict';
var rsz=()=>{
    var c=document.getElementById('c').getContext('2d');
    c.canvas.width=window.innerWidth;
    c.canvas.height=window.innerHeight;
    draw('howdy fsdsdf');
};

var draw=(txt)=>{
    var c=document.getElementById('c').getContext('2d');
    c.fillStyle='rgba(200,200,200,0.99)'; // cheap fade out effect
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='rgba(20,100,131,0.7)';
    c.font='38px monospace';
    c.fillText(txt,50,50);
};

window.onload=()=>{
    var keyset=new Set();
    //var keys=[];
    window.onresize=rsz;
    window.onkeydown=window.onkeyup=(k)=>{
        if(k.type=='keydown')keyset.add(k.code);
        if(k.type=='keyup')keyset.delete(k.code);
        //keys[k.keyCode]=k.type=='keydown';
        draw(k.code+' '+k.type);
        console.log(keyset);
    };
    rsz();
};
