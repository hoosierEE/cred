'use strict';
// globals
var c=document.getElementById('c').getContext('2d'),
    grid={width:25,height:50}, // monospace grid width/height
    cursor={x:25,y:75}, // cursor position on grid
    mode={insert:true,normal:false,visual:false},
    txt=[],
    pressed_codes=new Set(); // keys that are down right now

var draw_to_canvas=(ks)=>{
    // update text, cursor position TODO separate data from rendering
    if(!ks){return;} // TODO who should handle this, really?
    if(ks.c.length==0){return;}
    c.fillStyle='lightGray';
    c.font='38px monospace';
    c.fillText(ks.c,cursor.x,cursor.y);
    var width=c.measureText(ks.c).width;
    if(ks.act=='Tab'){cursor.x+=4*width;}
    else if(ks.act=='Enter'||cursor.x+grid.width+width>c.canvas.width){cursor.y+=grid.height;cursor.x=grid.width;}
    else{cursor.x+=width;}
};

var decode=(a,c,m,s,k)=>{
    console.log(k);
    var action={c:''};
    if(k=='Space'){action.c=' ';}
    var ma=k[k.length-1]; // maybe alphanumeric
    switch(k.slice(0,-1)){
    case'Key':action.c=s?ma:ma.toLowerCase();break;
    case'Digit':action.c=s?")!@#$%^&*("[ma]:ma;break;
    }
    var punct=['Comma',',','<'
               ,'Quote',"'",'"'
               ,'Equal','=','+'
               ,'Minus','-','_'
               ,'Slash','/','?'
               ,'Period','.','>'
               ,'Semicolon',';',':'
               ,'Backslash','\\','|'
               ,'Backquote','`','~'
               ,'BracketLeft','[','{'
               ,'BracketRight',']','}'
              ]; // maybe all the keys should be done this way, hmm...
    var pin=punct.indexOf(k);
    if(pin>=0){action.c=punct[pin+(s?2:1)];}

    // TODO #6 cursor movement
    switch(k){
    case'Tab':action.act='Tab';action.c='\t';break;
    case'Enter':action.act='Enter';action.c='\n';break;
    default:action.act=k;break;
    }
    return action;
};

window.onload=()=>{
    var rsz=()=>{
        c.canvas.width=c.canvas.clientWidth;
        c.canvas.height=c.canvas.clientHeight;
        // init canvas
        cursor.x=grid.width; cursor.y=grid.height;
        c.fillStyle='black';
        c.fillRect(0,0,c.canvas.width,c.canvas.height);
    };
    window.onresize=rsz;
    window.onkeydown=window.onkeyup=(k)=>{
        if(k.type=='keydown'){
            k.preventDefault();
            pressed_codes.add(k.keyCode);
            draw_to_canvas(decode(k.altKey,k.ctrlKey,k.metaKey,k.shiftKey,k.code));
        }
        if(k.type=='keyup'){pressed_codes.delete(k.keyCode);}
    };
    rsz();
};
