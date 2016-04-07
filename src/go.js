window.onload=()=>{
    var c=document.getElementById('c').getContext('2d');
    c.canvas.width=400;
    c.canvas.height=100;
    c.fillStyle='rgba(20,40,80,0.1)';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='rgba(20,100,131,0.7)';
    c.font='38px monospace';
    c.strokeText('Hello, World!',50,50);
};

