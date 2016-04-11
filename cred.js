'use strict';
var c=document.getElementById('c').getContext('2d'),
    grid=25, // monospace grid width/height
    Cursor=function(){
        return {
            x:grid,y:grid*2.5,
            width:function(){return c.measureText('a').width;},
            up:function(){this.y-=grid*1.5;},
            down:function(){this.y+=grid*1.5;},
            right:function(){this.x+=this.width();},
            left:function(){this.x-=this.width();}
        };
    },
    mode={insert:true,normal:false,visual:false},
    txt=[''],
    tw=3,
    pressed_codes=new Set(); // keys that are down right now
var cursor=new Cursor(); // for writing text
var point=new Cursor();

var render_text=()=>{
    requestAnimationFrame(render_text);
    cursor.x=grid;cursor.y=grid*2.5; // FIXME this resets cursor position to home each time
    c.fillStyle='black';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='lightGray';
    c.font='28px monospace';
    var newline=()=>{cursor.x=grid;cursor.y+=grid*1.5;}
    for(var i=0;i<txt.length;++i){
        tw=cursor.width();
        if(cursor.x+tw+grid>c.canvas.width){newline();}
        if(txt[i]=='\t'){
            if(cursor.x+tw*4+grid>c.canvas.width){newline();}
            else{cursor.x+=4*tw;}
        }
        else if(txt[i]=='\n'){newline();}
        else if(cursor.x+tw+grid>c.canvas.width){newline();}
        else{
            cursor.x+=tw;
            c.fillText(txt[i],cursor.x,cursor.y);
        }
    }
    // cursor
    this.prev_blink_alpha=0;
    var blink_alpha=0.7+0.5*Math.cos(Date.now()*0.007);
    c.fillStyle='rgba(255,255,255,'+blink_alpha+')';
    c.fillRect(point.x+point.width(),point.y-grid*1.25,2,grid*1.5);
};

var decode=(a,c,m,s,k)=>{
    var action={act:'',c:''};
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

    //console.log(k);
    // TODO #6 cursor movers
    switch(k){
    case'Tab':action.c='\t';break;
    case'Enter':action.c='\n';break;
    case'ArrowLeft':point.left();break;
    case'ArrowRight':point.right();break;
    case'ArrowUp':point.up();break;
    case'ArrowDown':point.down();break;
    }
    var update_txt=(ks)=>{
        if(!ks){return;}
        if(ks.act=='Backspace'){txt.pop();}
        else if(ks.c.length==0){return;}
        else{txt.push(ks.c);}
    };
    var update_point=(ks)=>{
        if(ks.act.slice(0,5)!='Arrow'){
            point.x=cursor.x+point.width();
            point.y=cursor.y;
        }
        if(ks.act=='Enter'){point.x=grid;point.down();}
        //if(ks.act=='Backspace'){point.x=cursor.x-point.width();}
        if(ks.act=='Backspace'){point.left();point.left();} // FIXME this ugly hack
        if(ks.act=='Delete'){point.right();}
    };
    action.act=k; // catch-all
    update_txt(action);
    update_point(action);
};

window.onload=()=>{
    var rsz=()=>{
        c.canvas.width=c.canvas.clientWidth;
        c.canvas.height=c.canvas.clientHeight;
        cursor.x=grid; cursor.y=grid*2.5;
        c.fillStyle='black';
        c.fillRect(0,0,c.canvas.width,c.canvas.height);
    };
    rsz();
    window.onresize=rsz;
    window.onkeydown=window.onkeyup=(k)=>{
        if(k.type=='keydown'){
            k.preventDefault();
            pressed_codes.add(k.keyCode);
            decode(k.altKey,k.ctrlKey,k.metaKey,k.shiftKey,k.code);
        }
        if(k.type=='keyup'){pressed_codes.delete(k.keyCode);}
    };
    requestAnimationFrame(render_text);
};
