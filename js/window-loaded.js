'use strict';
var draw_to_canvas=(ks)=>{
    // update text, cursor position TODO separate data from rendering
    if(undefined===ks){return;} // TODO who should handle this, really?
    c.fillStyle='lightGray';
    c.font='28px monospace';
    c.fillText(ks,cursor.x,cursor.y);
    cursor.x+=grid.width;
    if(cursor.x+grid.width>c.canvas.width){cursor.y+=grid.height; cursor.x=grid.width;} // wrap
};

window.onload=()=>{
    var rsz=()=>{c.canvas.width=window.innerWidth; c.canvas.height=window.innerHeight;};
    window.onresize=rsz;
    window.onkeydown=window.onkeyup=(k)=>{
        if(k.type=='keydown'){
            k.preventDefault();
            pressed_codes.add(k.keyCode);
            draw_to_canvas(decode({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],keycode:k.code}));
        }
        if(k.type=='keyup'){pressed_codes.delete(k.keyCode);}
    };
    rsz();
    // init canvas
    cursor.x=grid.width; cursor.y=grid.height;
    c.fillStyle='black';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
};
