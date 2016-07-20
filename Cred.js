/*TODO: file i/o */
const c=document.getElementById('c').getContext('2d'),
      Keyq=[{mods:[false,false,false,false],k:''}],/* lightens duties for key event handler */
      Mouseq={wheel:[],dtxy:[{dt:0,dx:0,dy:0}]},
      buf=Buffer(),
      cur=Cursor(buf),
      par=Parser(cur),
      cfg=Config(),
      win=Window(c,cur,cfg);

/* decode : RawKey -> DecodedKey */
const decode=({k, mods})=>{
    const dec={type:'',code:'',mods:mods};/* return type (modifiers pass through) */
    /* printable */
    if(k==='Space'){dec.code=' ';}
    else{
        const shft=mods[3],
              ma=k.slice(-1),/* maybe alphanumeric */
              kd=k.slice(0,-1);
        if(kd==='Key'){dec.code=shft?ma:ma.toLowerCase();}
        else if(kd==='Digit'){dec.code=shft?")!@#$%^&*("[ma]:ma;}
        else if(k==='Tab'){dec.code='\t';}
        else if(k==='Enter'){dec.code='\n';}
        else{
            const pun=['Comma',',','<','Quote',"'",'"','Equal','=','+','Minus','-','_'
                       ,'Slash','/','?','Period','.','>','Semicolon',';',':','Backslash','\\','|'
                       ,'Backquote','`','~','BracketLeft','[','{','BracketRight',']','}'],
                  pid=pun.indexOf(k);
            if(pid>=0){dec.code=pun[pid+(shft?2:1)];}
        }
    }
    /* non-printable */
    if(dec.code.length>0){dec.type='print';}
    else{
        if(k==='Backspace'||k==='Delete'){dec.type='edit';dec.code=k[0];}/* 'b','d' */
        else if(k==='Escape'){dec.type='escape';}/* dec.code should still be an empty string ('') */
        else if(k.slice(0,5)==='Arrow'){dec.type='arrow';dec.code=k[5];}/* 'u','d','l','r' */
        else if(k.slice(0,4)==='Page'){dec.type='page';dec.code=k[4];}/* 'u','d' */
        else if(k==='Home'||k==='End'){dec.type='page';dec.code=k[0];}/* 'h','e' */
    }
    return dec;
};

const render_text=()=>{
    /* Which lines are visible? */
    let from_line=Math.max(0,cur.cl-win.num_visible_lines()),
        to_line=Math.min(buf.lines.length-1,cur.cl+win.num_visible_lines());

    /* Render just those lines. */
    c.fillStyle=cfg.get('font');
    for(let i=from_line;i<to_line+1;++i){c.fillText(buf.getline(i),win.bw,win.ln_top(i));}
};

const render_cursor=()=>{
    /* Draw the cursor at the new position. */
    const l=buf.getline(cur.cl),/* current line */
          cur_left_edge=c.measureText(l.slice(0,cur.co)).width,
          wid=cur.mode==='insert'?1:c.measureText(l.slice(0,cur.co+1)).width-cur_left_edge||10,
          status_line_y=win.v.y+win.v.h-1*win.line_height;

    /* statusbar background */
    c.fillStyle=cfg.get('status');
    c.fillRect(win.v.x,status_line_y,win.v.w,win.line_height);

    /* statusbar */
    c.fillStyle=cfg.get('cursor');
    c.fillText(cur.status(),win.v.x+win.bw,status_line_y+win.line_ascent);

    /* cursor */
    c.save();
    c.globalCompositeOperation='multiply';
    c.fillRect(win.bw+cur_left_edge,win.ln_top(cur.cl)-win.line_ascent,wid,win.line_height);
    c.restore();
};

window.onload=()=>{

    const gameloop=(now)=>{
        /* Consume input events. */
        while(Keyq.length){par.parse(now,decode(Keyq.shift()));}
        while(Mouseq.wheel.length){
            const wheel=Mouseq.wheel.shift();
            if(wheel<0){cur.up(-wheel%win.line_height|0);}
            else{cur.down(wheel%win.line_height|0);}
        }

        /* Repaint. */
        c.clearRect(win.v.x,win.v.y,win.v.w,win.v.h);
        win.scroll();
        render_text();
        render_cursor();
        /* other ideas: render_minimap(); render_statusline(); render_popups(); */
    };

    const rsz=()=>{
        c.canvas.width=c.canvas.clientWidth;
        c.canvas.height=c.canvas.clientHeight;
        cfg.init(c);
        win.init(c);
        requestAnimationFrame(gameloop);
    };

    /* events */
    window.onresize=rsz;
    c.canvas.onmousewheel=(ev)=>{
        Mouseq.wheel.push(ev.deltaY);
        requestAnimationFrame(gameloop);
    };
    window.onkeydown=(k)=>{
        if(k.type==='keydown'){/* push incoming events to a queue as they occur */
            if(!k.metaKey){k.preventDefault();}/* allows CMD-I on OSX */
            Keyq.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey], k:k.code});
            requestAnimationFrame(gameloop);
        }
    };

    /* theme */
    if(localStorage.user_config){
        console.log('using stored theme');
        let thm=JSON.parse(localStorage.getItem('user_config'));
        thm.theme.cursor.hue=20;
        cfg.theme=thm.theme;
        for(let i in thm.theme){if(cfg.theme.hasOwnProperty(i)){cfg.theme[i]=thm.theme[i];}}
        for(let i in thm.font){if(cfg.font.hasOwnProperty(i)){cfg.font[i]=thm.font[i];}}
    }
    else{
        localStorage.setItem('user_config',cfg.store());
    }
    document.body.style.backgroundColor=cfg.get('base');
    rsz();
};
