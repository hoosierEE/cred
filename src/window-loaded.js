"use strict";
var rsz=()=>{
    document.getElementById('c').width=document.body.clientWidth;
    document.getElementById('c').height=document.body.clientHeight;
    draw();
};

var txt="hi, peeps!";
var draw=()=>{
    var c=document.getElementById('c').getContext('2d');
    c.fillStyle='rgba(20,40,80,0.1)';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='rgba(20,100,131,0.7)';
    c.font='38px monospace';
    c.strokeText(txt,50,50);
};

window.onload=()=>{
    // initialization; event listeners
    window.onresize=rsz;
    window.addEventListener('keydown',k=>{
        if(k.defaultPrevented){return;}
        console.log(k);
        console.log(k.keyIdentifier);
        k.preventDefault();
    },true);
    rsz();
};
