// TODO: robust scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    buf=Buffer(),
    cur=Cursor(buf),

    Settings=()=>({
        font_name:'Sans-Serif',
        font_size:'24px',
        init(c){
            c.font=this.font_size+' '+this.font_name;
            c.fillStyle='#dacaba';
        },
    }),

    ScreenOffsets=(c)=>({// @param a target Canvas
        bw:20,// border width
        h:0,// line height
        y:0,//
        baseline:0,//
        v:{x:0,y:0,w:0,h:0},// viewport position and size
        ln_top(n){return this.y+this.line_height*n;},// top edge of line n, in pixels
        scroll(limit=4){// scroll to cursor
            if(this.ln_top(cur.cl+limit)>this.v.y+this.v.h){this.v.y+=this.ln_top(cur.cl)-this.ln_top(cur.cl-1);}
            if(this.ln_top(cur.cl-limit)<this.v.y){this.v.y-=this.ln_top(cur.cl)-this.ln_top(cur.cl-1);}
            if(this.v.y<0){this.v.y=0;}// bounds check
            c.setTransform(1,0,0,1,0,-this.v.y);// move canvas opposite of viewport
        },
        init(ctx){// must be called before using other ScreenOffsets methods
            var fm=FontMetric(settings.font_name,settings.font_size);
            //fm[0] is baseline (bottom edge of letters such as abcde)
            this.line_height=fm[1];// total line height
            this.baseline=fm[2];// lower bound of text such as: jgpq|
            this.y=this.line_height+this.bw;
            this.v={x:0,y:0,w:c.canvas.width,h:c.canvas.height};
        },
    }),
    settings=Settings(),
    offs=ScreenOffsets(c);

var render_cursor=()=>{// {Buffer, Cursor, Canvas}=>Rectangle
    // 1. clear where cursor was previously (currently handled by render_text)
    // 2. rewrite text at old cursor position (same)
    // 3. draw the cursor at the new position
    c.save();
    c.globalCompositeOperation='difference';
    var l=buf.getline(cur.cl),// current line
        ltop=offs.ln_top(cur.cl),// top edge of current line
        cur_left_edge=c.measureText(l.slice(0,cur.co)).width,
        wid=c.measureText(l.slice(0,cur.co+1)).width-cur_left_edge;

    c.fillStyle='orange';
    if(!wid){wid=10;}
    c.fillText(cur.status(),offs.bw,offs.ln_top(0)+offs.line_height);// debug status line

    if(cur.mode==='insert'){wid=1;}
    c.fillRect(offs.bw+cur_left_edge,ltop-offs.line_height+offs.baseline,wid,offs.line_height);
    c.restore();
};

var render_text=()=>{
    c.clearRect(0,0,c.canvas.width,offs.v.y+offs.v.h);
    // render ALL THE LINES
    buf.lines.forEach((ln,i)=>c.fillText(buf.getline(i),offs.bw,offs.ln_top(i)));
};

var gameloop=now=>{
    update(KEYQ,now);
    render_text();
    // render_minimap();
    // render_statusline();
    render_cursor();
    // render_popups();

    // move canvas by the amount necessary to put the cursor on-screen
    offs.scroll();
};

var rsz=()=>{
    requestAnimationFrame(gameloop);
    c.canvas.width=c.canvas.clientWidth;
    c.canvas.height=c.canvas.clientHeight;
    settings.init(c);
    offs.init(c);
};

window.onload=rsz;
window.onresize=rsz;
window.onkeydown=(k)=>{
    requestAnimationFrame(gameloop);
    if(k.type==='keydown'){// push incoming events to a queue as they occur
        if(!k.metaKey){k.preventDefault();}
        KEYQ.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey], k:k.code});
    }
};

buf.ins('five\n\n\n\n\n\n\n\n\n\n\n\n\n'+'five\n\n\n'+'five\n\n\n\nHi world!');
cur.rowcol();
