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
        h:0,y:0,b:0,
        viewport:{x:0,y:0,w:0,h:0},// viewport bounding rectangle, position and size
        curln_top(n){return this.y+this.h*n;},// top edge of line n, in pixels
        screen_lines(){return Math.floor((c.canvas.height-this.y)/this.h)},// screen height, in lines
        scroll(){// scroll to cursor if it's outside viewport
            var cur_top=this.curln_top(cur.cl),// top of cursor
                v_upper=this.viewport.y,// top of viewport bounding rect
                v_lower=v_upper+this.viewport.h;// bottom of viewport bounding rect

            console.log('ct: '+cur_top+' vu: '+v_upper+' vl: '+v_lower);
            if(cur_top>v_lower*0.8){
                // increment viewport
                this.viewport.y+=cur_top-(0.8*v_lower|0);
                if(this.viewport.y<0){this.viewport.y=0;}
            }
            if(cur_top<v_lower*0.2){
                this.viewport.y=-(v_lower*0.2|0)+cur_top;
                if(this.viewport.y<0){this.viewport.y=0;}
            }
            c.setTransform(1,0,0,1,0,-this.viewport.y);// cursor at bottom of page
        },
        init(ctx){// must be called before using other ScreenOffsets methods
            var fm=FontMetric(settings.font_name,settings.font_size);
            //fm[0] is baseline (bottom edge of letters such as abcde)
            this.h=fm[1];// total line height
            this.b=fm[2];// lower bound of text such as: jgpq|
            this.y=this.h+this.bw;
            this.viewport={x:0,y:0,w:c.canvas.width,h:c.canvas.height};
        },
    }),
    settings=Settings(),
    offs=ScreenOffsets(c);

var render_cursor=()=>{// {Buffer, Cursor, Canvas}=>Rectangle
    // 1. clear where cursor was previously
    // 2. rewrite text at old cursor position
    // 3. draw the cursor at the new position
    c.save();
    var l=buf.getline(cur.cl);// current line (what)
    var ltop=offs.curln_top(cur.cl);// top edge of current line (where)
    c.globalCompositeOperation='difference';
    var cur_left_edge=c.measureText(l.slice(0,cur.co)).width,
        wid=c.measureText(l.slice(0,cur.co+1)).width-cur_left_edge;

    c.fillStyle='orange';
    if(!wid){wid=10;}

    // debugging status line (message, [col, maxcol, point, line])
    c.fillText(cur.status(),offs.bw,offs.curln_top(0)+offs.h);

    if(cur.mode==='insert'){wid=1;}
    c.fillRect(offs.bw+cur_left_edge,ltop-offs.h+offs.b,wid,offs.h+offs.b/2);// draw cursor over existing text
    c.restore();
};

var render_text=()=>{
    c.clearRect(0,0,c.canvas.width,offs.viewport.y+offs.viewport.h);
    // render ALL THE LINES
    buf.lines.forEach((ln,i)=>c.fillText(buf.getline(i),offs.bw,offs.curln_top(i)));
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

buf.ins('five\n\n\n\n\n\n\n\n\n\n\n\n\n'+'five\n\n\n'+'five\n');
cur.rowcol();
