'use strict';
var rsz=()=>{
    document.getElementById('c').width=document.body.clientWidth;
    document.getElementById('c').height=document.body.clientHeight;
    draw('hi world');
};

var draw=(txt)=>{
    var c=document.getElementById('c').getContext('2d');
    c.fillStyle='rgba(200,200,200,0.5)'; // cheap fade out effect
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='rgba(20,100,131,0.7)';
    c.font='38px monospace';
    c.fillText(txt,50,50);
};

window.onload=()=>{
    var keys=[];
    // initialization; event listeners
    window.onresize=rsz;
    window.onkeydown=window.onkeyup=(k)=>{
        keys[k.keyCode]=k.type=='keydown';
        draw(k.code+' '+k.type);
    };
    rsz();
};
