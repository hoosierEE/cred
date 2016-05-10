// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler

    ScreenOffsets=()=>({
        bw:20,// border width
        h:0,y:0,b:0,
        lmul(lnum){return this.y+this.h*lnum;},// lower edge of line
        init(ctx){
            var fm=FontMetric(settings.font_name,settings.font_size);
            this.h=fm[1];// total line height
            this.b=fm[2];// lower bound of text such as: jgpq|
            this.y=this.h+this.bw;
        },
    }),
    Settings=()=>({
        font_name:'Sans-Serif',
        font_size:'24px',
    }),
    buf=Buffer(),
    cur=Cursor(buf),
    settings=Settings(),
    offs=ScreenOffsets();

var render_text=()=>{
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    // render ALL THE LINES
    buf.lines.forEach((ln,i)=>c.fillText(buf.getline(i),offs.bw,offs.lmul(i)));
};

var render_cursor=()=>{
    // 1. clear where cursor was previously
    // 2. rewrite text at old cursor position
    // 3. draw the cursor at the new position
    var l=buf.getline(cur.curln());// current line (what)
    var ltop=offs.lmul(cur.curln());// top edge of current line (where)

    c.save();
    c.globalCompositeOperation='difference';
    var cur_left_edge=c.measureText(l.slice(0,cur.co)).width,
        wid=c.measureText(l.slice(0,cur.co+1)).width-cur_left_edge;

    c.fillStyle='orange';
    if(!wid){wid=10;}

    // debugging status line (message, [col, maxcol, point, line])
    c.clearRect(offs.bw,offs.lmul(10),c.canvas.width,offs.h);
    c.fillText(cur.status(),offs.bw,offs.lmul(10)+offs.h);

    if(cur.mode==='insert'){wid=1;}
    c.fillRect(offs.bw+cur_left_edge,ltop-offs.h+offs.b,wid,offs.h+offs.b/2);// draw cursor over existing text
    c.restore();
}

var gameloop=now=>{
    update(KEYQ,now);
    render_text();
    render_cursor();
};

var rsz=()=>{
    requestAnimationFrame(gameloop);
    c.canvas.width=c.canvas.clientWidth;
    c.canvas.height=c.canvas.clientHeight;
    c.font=settings.font_size+' '+settings.font_name;//'24px Sans-Serif';
    offs.init(c);
    c.fillStyle='#dacaba';
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

buf.ins('five\n'+'five\n\n\n'+'five\n');
cur.rowcol();
