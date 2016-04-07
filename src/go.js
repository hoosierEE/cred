input=_=>{
    console.log('hi from the console');
};
rsz=_=>{
    var d=document;
    d.getElementById('c').width=d.body.clientWidth;
    d.getElementById('c').height=d.body.clientHeight;
    draw();
};
draw=_=>{
    c=document.getElementById('c').getContext('2d');
    c.fillStyle='rgba(20,40,80,0.1)';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='rgba(20,100,131,0.7)';
    c.font='38px monospace';
    c.strokeText('Hello, World!',50,50);
    input();
};
window.onresize=rsz;
window.onload=rsz;

