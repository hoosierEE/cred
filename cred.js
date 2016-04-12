'use strict';
var c=document.getElementById('c').getContext('2d'),
    mode={insert:true,normal:false,visual:false},
    grid=25, // monospace grid width/height
    Cursor=()=>{
        var crsr={
            x:0,y:0,
            width(){return c.measureText('a').width;},
            init(){this.x=grid;this.y=grid*2.5;},
            up(){this.y-=grid*1.5;},
            down(){this.y+=grid*1.5;},
            right(){this.x+=this.width();
                    if(this.x>c.canvas.width){this.crlf();}},
            left(){this.x-=this.width();if(this.x<grid){this.x=grid;}},
            crlf(){this.x=grid;this.y+=grid*1.5;}
        };
        crsr.init();
        return crsr;
    },
    txt={pos:0,data:[]}; // editing position, entire contents
var cursor=Cursor(); // for drawing text to the screen
var point=Cursor(); // for the current cursor position

var render_text=()=>{
    requestAnimationFrame(render_text);
    cursor.init();
    c.fillStyle='black';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='lightGray';
    c.font='28px monospace'; // FIXME non-monospace fonts are messed up
    var tw=cursor.width();
    for(var i=0;i<txt.data.length;++i){
        // TODO only draw what's visible
        if(cursor.x+tw+grid>c.canvas.width){cursor.crlf();}
        if(txt.data[i]=='\t'){
            if(cursor.x+tw*4+grid>c.canvas.width){cursor.crlf();}
            else{cursor.x+=4*tw;}
        }
        else if(txt.data[i]=='\n'){cursor.crlf();}
        else if(cursor.x+tw+grid>c.canvas.width){cursor.crlf();}
        else{
            cursor.x+=tw;
            c.fillText(txt.data[i],cursor.x,cursor.y);
        }
    }
    var blink_alpha=0.7+0.5*Math.cos(Date.now()*0.007);
    c.fillStyle='rgba(255,255,255,'+blink_alpha+')';
    c.fillRect(point.x+point.width(),point.y-grid*1.25,1,grid*1.25);
};

var decode=(alt,ctrl,meta,shft,k)=>{
    var decoded={act:'',c:''}; // {action, printable}
    // printable?
    if(k=='Space'){decoded.c=' ';}
    var ma=k[k.length-1]; // maybe alphanumeric
    switch(k.slice(0,-1)){
    case'Key':decoded.c=shft?ma:ma.toLowerCase();break;
    case'Digit':decoded.c=shft?")!@#$%^&*("[ma]:ma;break;
    }
    // other punctuation not associated with an alphanumeric key
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
              ];
    var pin=punct.indexOf(k);
    if(pin>=0){decoded.c=punct[pin+(shft?2:1)];}

    // weird-shaped characters
    switch(k){
    case'Tab':decoded.c='\t';break;
    case'Enter':decoded.c='\n';break;
    }

    // handle whatever {Action, printable} we just decoded
    var update_txt=(ks)=>{
        switch(ks.act){
        case'Backspace':
            txt.pos=txt.pos>0?txt.pos-1:0;
            txt.data.pop();
            break;
        case'Delete':txt.data.splice(txt.pos,1);
        }
        if(ks.c.length>0){
            txt.pos+=1;
            txt.data.push(ks.c);
        }
    };

    var update_point=(ks)=>{

        if(ks.c.length>0){
            point.x=cursor.x+cursor.width();
            point.y=cursor.y;
        }
        if(ks.act.slice(0,5)=='Arrow'){
            switch(ks.act.slice(5)){
            case'Right':point.right();break;
            case'Left':point.left();break;
            case'Up':point.up();break;
            case'Down':point.down();break;
            }
        }
        switch(ks.act){
        case'Enter':point.crlf();break;
        }
    };
    decoded.act=k; // catch-all
    update_txt(decoded);
    update_point(decoded);
};

window.onload=()=>{
    var rsz=()=>{
        c.canvas.width=c.canvas.clientWidth;
        c.canvas.height=c.canvas.clientHeight;
        cursor.x=grid; cursor.y=grid*1.5;
        c.fillStyle='black';
        c.fillRect(0,0,c.canvas.width,c.canvas.height);
    };
    rsz();
    window.onresize=rsz;
    window.onkeydown=window.onkeyup=(k)=>{
        if(k.type=='keydown'){
            //if(k.defaultPrevented){return;}
            k.preventDefault();
            decode(k.altKey,k.ctrlKey,k.metaKey,k.shiftKey,k.code);
        }
    };
    requestAnimationFrame(render_text);
};
