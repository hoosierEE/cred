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

    ScreenOffsets=(c)=>({// @param the target Canvas
        bw:20,// border width
        h:0,y:0,b:0,
        viewport:{x:0,y:0,w:c.canvas.width,h:c.canvas.height},
        curln_y(n){return this.y+this.h*n;},// lower edge of line n, in pixels
        curco_x(n){return this.bw;},// right edge of cursor at column n, in pixels
        screen_lines(){return Math.floor((c.canvas.height-this.y)/this.h)},// screen height, in lines
        scroll(m){// scroll to position m
            // viewport determines bounding rect

            var amt=[0,0];// x,y
            // test if cursor is outside viewport
            // vertical
            // horizontal
            // move viewport (x or y)
            if(cur.cl<this.screen_lines()){amt=this.curln_y(cur.cl);}
            else{amt[1]=this.curln_y(m-Math.floor(this.screen_lines()/2));}
            console.log('screen_lines: '+this.screen_lines()+', '+amt);
            this.viewport.y=0;
            this.viewport.h=0;
            c.setTransform(1,0,0,1,amt[0],amt[1]);// cursor at bottom of page

            // if cursor is outside bounding box in horizontal direction
            this.viewport.x=0;
            this.viewport.w=0;
        },
        init(ctx){// must be called before using other ScreenOffsets methods
            var fm=FontMetric(settings.font_name,settings.font_size);
            this.h=fm[1];// total line height
            this.b=fm[2];// lower bound of text such as: jgpq|
            this.y=this.h+this.bw;
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
    var ltop=offs.curln_y(cur.cl);// top edge of current line (where)
    c.globalCompositeOperation='difference';
    var cur_left_edge=c.measureText(l.slice(0,cur.co)).width,
        wid=c.measureText(l.slice(0,cur.co+1)).width-cur_left_edge;

    c.fillStyle='orange';
    if(!wid){wid=10;}

    // debugging status line (message, [col, maxcol, point, line])
    c.clearRect(offs.bw,offs.curln_y(10),c.canvas.width,offs.h);
    c.fillText(cur.status(),offs.bw,offs.curln_y(10)+offs.h);

    if(cur.mode==='insert'){wid=1;}
    c.fillRect(offs.bw+cur_left_edge,ltop-offs.h+offs.b,wid,offs.h+offs.b/2);// draw cursor over existing text
    c.restore();
};

var render_text=()=>{
    var h=c.canvas.height;
    c.clearRect(0,-h,c.canvas.width,3*h);
    // render ALL THE LINES
    buf.lines.forEach((ln,i)=>c.fillText(buf.getline(i),offs.bw,offs.curln_y(i)));
};

var gameloop=now=>{
    update(KEYQ,now);
    render_text();
    // render_minimap();
    // render_statusline();
    render_cursor();
    // render_popups();

    // move canvas by the amount necessary to put the cursor on-screen
    offs.scroll(cur.cl);
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
