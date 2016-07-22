"use strict";
/*TODO: file i/o */
const c=document.getElementById('c').getContext('2d'),
      Keyq=[{mods:[false,false,false,false],k:''}],/* lightens duties for key event handler */
      Mouseq={wheel:[],dtxy:[{dt:0,dx:0,dy:0}]};

const Buffer=()=>({
    /* Buffer
       A line-oriented view of a String, with an insertion point.
       Editing operations automatically update line numbers. */

    /* STATE */
    s:'',
    pt:0,
    lines:[0],

    /* METHODS */
    getline(n){/* getline : Int -> String -- the Nth line, not including any trailing newline */
        const l=this.lines,len=l.length;
        if(0<n&&n<len){return this.s.slice(l[n]+1,l[n+1]);}/* line in middle */
        else if(n===0){return this.s.slice(0,l[1]);}/* first */
        else if(n>=len){return this.s.slice(1+l[len-1]);}/* last */
        else{return this.getline(Math.max(0,len+n));}/* negative n indexes backwards but doesn't wrap */
    },

    /* gen_lines : () -> [Int] -- array of line start indexes */
    gen_lines(){return[...this.s].reduce((x,y,i)=>{y==='\n'&&x.push(i);return x;},[0]);},

    /* insert ch chars to right of p */
    ins(ch){
        if(this.pt===this.s.length){this.s=this.s+ch;}
        else{const fst=this.s.slice(0,this.pt),snd=this.s.slice(this.pt);this.s=fst+ch+snd;}
        this.lines=this.gen_lines();
        this.pt+=ch.length;
    },

    /* delete n chars to right (n>0) or left (n<0) of point */
    del(n){
        if(n===0||n+this.pt<0){return;}
        const leftd=n<0?n:0,rightd=n<0?0:n;
        const fst=this.s.slice(0,this.pt+leftd),snd=this.s.slice(this.pt+rightd);this.s=fst+snd;
        this.lines=this.gen_lines();
    },
});


const Cursor=(b)=>({
    cl:0,/* current line */
    co:0,/* current column */
    cx:0,/* maximum column */
    clipboard:'',
    mode:'normal',/*  TODO visual, various "minor modes" */
    /* status : () -> 'modeline' */
    status(){return this.mode+'  '+this.cl+':'+this.co;},
});


/* Parser -- Convert keyboard events into cursor-based Actions */
const Parser=(cur)=>{
    const Command=({p:'',c:''}),
          /* arrow : DecodedKey -> Action Move */
          arrow=(dec)=>{
              switch(dec.code){
              case'D':cur.down();break;
              case'U':cur.up();break;
              case'R':dec.mods[1]?(cur.move(cur.eow)):(cur.right());break;
              case'L':dec.mods[1]?(cur.move(cur.bow)):(cur.left());break;
              }
          };
    return({
        /* parse : timestamp -> DecodedKey -> Action */
        parse(t,dec){
            if(dec.type==='arrow'){arrow(dec);}
            else if(cur.mode==='insert'){insert(t,dec);}
            else{if(dec.mods.lastIndexOf(true)>1){cmd.c+=dec.code}}
            // TODO return something
        },
    });
};


const Config=()=>({
    theme:{
        base:{hue:270,sat:100,lig:98},
        font:{hue:270,sat:50,lig:5},
        cursor:{hue:270,sat:50,lig:80},
        status:{hue:270,sat:100,lig:20},
    },
    font:{size:'20px', name:'serif',},
    /*(base|font|cursor|status)->'hsl(...)' */
    get(x){return `hsl(${this.theme[x].hue},${this.theme[x].sat}%,${this.theme[x].lig}%)`},
    /* for use by localStorage */
    store(){return JSON.stringify({theme:this.theme,font:this.font},null,0)},
    init(ctx){ctx.font=this.font.size+' '+this.font.name;},
});



const Window=(c,cur,cfg)=>({
    /* @param c: the target canvas
       @param cur: an already-instantiated Cursor
       @param cfg: an already-instantiated Configuration */

    /* STATE */
    bw:20,/* border width */
    line_ascent:5,line_descent:5,line_height:10,
    v:{},/* viewport position and size */

    /* METHODS */
    ln_top(n){return this.bw+this.line_height*(n+1);},/* top pixel of line n */
    co_left(n){return this.bw+c.measureText(buf.getline(cur.cl).slice(0,n)).width;},/* left edge of column n */
    co_right(n){return this.bw+c.measureText(buf.getline(cur.cl).slice(0,n+1)).width;},/* right edge of column n */
    num_visible_lines(){return (c.canvas.height-2*this.bw)/this.line_height|0;},

    scroll(line_offset=5){
        if(line_offset>this.num_visible_lines()){line_offset=this.num_visible_lines()/2|0;}
        else if(line_offset<1){line_offset=1;}/* smallest usable value - 0 is too small */
        let prev_y=this.v.y, prev_x=this.v.x;/* grab current value of x and y */

        /* up/down */
        let ltop=this.ln_top(cur.cl+line_offset), lbot=this.ln_top(cur.cl-line_offset);
        if(ltop>this.v.y+this.v.h){this.v.y+=ltop-(this.v.y+this.v.h);}
        if(lbot<this.v.y){this.v.y-=this.v.y-lbot;}

        /* left/right */
        let crt=this.co_right(cur.co)+this.bw, clt=this.co_left(cur.co)-this.bw;
        if(crt>this.v.x+this.v.w){this.v.x+=crt-this.v.w;}
        if(clt<this.v.x){this.v.x-=this.v.x-clt;}
        if(this.v.y<0){this.v.y=0;}
        if(this.v.x<0){this.v.x=0;}

        /* translate canvas if necessary */
        if(prev_x!=this.v.x||prev_y!=this.v.y){c.setTransform(1,0,0,1,-this.v.x,-this.v.y);}
    },
    init(ctx){/* must be called before using other Window methods, but AFTER the HTML body loads */
        let fm=FontMetric(cfg.font.name,cfg.font.size);
        this.line_ascent=fm[0];/* top of text such as QMEW| */
        this.line_height=fm[1];/* total line height */
        this.line_descent=fm[2];/* lower bound of text such as: jgpq| */
        this.v={x:0,y:0,w:c.canvas.width,h:c.canvas.height};
        this.scroll();
    },
});



const buf=Buffer(),
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
