log=()=>{
    var x=document.getElementById('c').getContext('2d');
    x.canvas.width=400;
    x.canvas.height=100;
    x.fillStyle='rgba(20,40,80,0.8)';
    x.fillRect(0,0,x.canvas.width,x.canvas.height);
    console.log('hi');
};

window.onload=log;
