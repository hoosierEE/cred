// TODO: file i/o
var c=document.getElementById('c').getContext('2d'),
    Keyq=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    Mouseq={wheel:[],dtxy:[{dt:0,dx:0,dy:0}]},
    buf=Buffer(),
    cur=Cursor(buf),
    par=Parser(cur),
    cfg=Configuration(),
    win=Window(c,cur,cfg);

// decode : RawKey -> DecodedKey
var decode=({k, mods})=>{
    var dec={type:'',code:'',mods:mods};// return type (modifiers pass through)
    // printable
    if(k==='Space'){dec.code=' ';}
    else{
        var shft=mods[3];
        var ma=k.slice(-1);// maybe alphanumeric
        var kd=k.slice(0,-1);
        if(kd==='Key'){dec.code=shft?ma:ma.toLowerCase();}
        else if(kd==='Digit'){dec.code=shft?")!@#$%^&*("[ma]:ma;}
        else if(k==='Tab'){dec.code='\t';}
        else if(k==='Enter'){dec.code='\n';}
        else{
            var pun=['Comma',',','<','Quote',"'",'"','Equal','=','+','Minus','-','_'
                     ,'Slash','/','?','Period','.','>','Semicolon',';',':','Backslash','\\','|'
                     ,'Backquote','`','~','BracketLeft','[','{','BracketRight',']','}'];
            var pid=pun.indexOf(k);
            if(pid>=0){dec.code=pun[pid+(shft?2:1)];}
        }
    }
    // non-printable
    if(dec.code.length>0){dec.type='print';}
    else{
        if(k==='Backspace'||k==='Delete'){dec.type='edit';dec.code=k[0];}// 'b','d'
        else if(k==='Escape'){dec.type='escape';}// dec.code should still be an empty string ('')
        else if(k.slice(0,5)==='Arrow'){dec.type='arrow';dec.code=k[5];}// 'u','d','l','r'
        else if(k.slice(0,4)==='Page'){dec.type='page';dec.code=k[4];}// 'u','d'
        else if(k==='Home'||k==='End'){dec.type='page';dec.code=k[0];}// 'h','e'
    }
    return dec;
};

var render_text=()=>{
    c.clearRect(win.v.x,win.v.y,win.v.w,win.v.h);// clear visible window

    // determine what lines are visible
    var from_line=cur.cl-win.num_visible_lines(),
        to_line=cur.cl+win.num_visible_lines();
    if(from_line<0){from_line=0;}
    if(to_line>=buf.lines.length){to_line=buf.lines.length-1;}

    // render just those lines
    for(var i=from_line;i<to_line+1;++i){
        c.fillText(buf.getline(i),win.bw,win.ln_top(i));
    }
};

var render_cursor=()=>{// {Buffer, Cursor, Canvas}=>Rectangle
    // 1. clear where cursor was previously (currently handled by render_text)
    // 2. rewrite text at old cursor position (currently handled by render_text)
    // 3. draw the cursor at the new position
    c.save();
    var l=buf.getline(cur.cl),// current line
        cur_left_edge=c.measureText(l.slice(0,cur.co)).width,
        wid=cur.mode==='insert'?1:c.measureText(l.slice(0,cur.co+1)).width-cur_left_edge||10;

    // statusbar background
    var status_line_y=win.v.y+win.v.h-1*win.line_height;
    c.fillStyle=cfg.status_bg;
    c.fillRect(win.v.x,status_line_y,win.v.w,win.line_height);

    // statusbar
    c.fillStyle=cfg.cursor_clr;
    c.fillText(cur.status(),win.v.x+win.bw,status_line_y+win.line_ascent);

    // cursor
    c.globalCompositeOperation='multiply';
    c.fillRect(win.bw+cur_left_edge,win.ln_top(cur.cl)-win.line_ascent,wid,win.line_height);
    c.restore();
};

window.onload=()=>{
    var gameloop=(now)=>{
        while(Keyq.length){par.parse(now,decode(Keyq.shift()));}// consume keyboard events
        while(Mouseq.wheel.length){
            var wheel=Mouseq.wheel.shift();
            if(wheel<0){cur.up(-wheel%win.line_height|0);}
            else{cur.down(wheel%win.line_height|0);}
        }
        win.scroll();
        render_text();
        render_cursor();
        // other ideas: render_minimap(); render_statusline(); render_popups();
    };
    var rsz=()=>{
        requestAnimationFrame(gameloop);
        c.canvas.width=c.canvas.clientWidth;
        c.canvas.height=c.canvas.clientHeight;
        cfg.init(c);
        win.init(c);
    };
    // events
    window.onresize=rsz;
    c.canvas.onmousewheel=(ev)=>{
        requestAnimationFrame(gameloop);
        Mouseq.wheel.push(ev.deltaY);
    };
    window.onkeydown=(k)=>{
        requestAnimationFrame(gameloop);
        if(k.type==='keydown'){// push incoming events to a queue as they occur
            if(!k.metaKey){k.preventDefault();}// allows CMD-I on OSX
            Keyq.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey], k:k.code});
        }
    };
    rsz();
};
