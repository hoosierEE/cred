// TODO: horizontal scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    buf=Buffer(),
    cur=Cursor(buf),

    Configuration=()=>({
        font_name:'Verdana',//'Sans-Serif',
        font_size:'24px',
        init(c){
            c.font=this.font_size+' '+this.font_name;
            c.fillStyle='#dacaba';
        },
    }),

    Window=(c)=>({// c: the target Canvas
        bw:20,// border width
        // defaults: bad enough to clue you in
        line_height:10, baseline:5, v:{},// viewport position and size
        ln_top(n){return this.bw+this.line_height*(n+1);},// top pixel of line n
        co_left(n){return this.bw+c.measureText(buf.getline(cur.cl).slice(0,n)).width;},// left edge of column n
        co_right(n){return this.bw+c.measureText(buf.getline(cur.cl).slice(n,n+1)).width;},// right edge of column n
        num_visible_lines(){return (c.canvas.height-2*this.bw)/this.line_height|0;},
        scroll(soff=5){// TODO scrolloffset `soff` wonky for large values

            if(soff>this.num_visible_lines()){soff=this.num_visible_lines()/2|0;}
            else if(soff<0){soff=0;}
            var prev_y=this.v.y,
                prev_x=this.v.x;


            // scroll down
            var t_ln_top=this.ln_top(cur.cl+soff);
            if(t_ln_top>this.v.y+this.v.h){
                //this.v.y+=this.line_height*(t_ln_top)
            }
            if(t_ln_top<this.v.y){
            }

            // while loops: slower than doing the math, but hey: no math!
            while(this.ln_top(cur.cl+soff)>this.v.y+this.v.h){
                this.v.y+=this.ln_top(cur.cl)-this.ln_top(cur.cl-1);
            }
            // scroll up
            while(this.ln_top(cur.cl-soff)<this.v.y){
                this.v.y-=this.ln_top(cur.cl)-this.ln_top(cur.cl-1);
            }

            if(this.v.y<0){this.v.y=0;}// bounds check
            if(this.v.x<0){this.v.x=0;}
            if(prev_y!=this.v.y){c.setTransform(1,0,0,1,0,-this.v.y);}// move canvas opposite of viewport
        },
        init(ctx){// must be called before using other Window methods
            var fm=FontMetric(cfg.font_name,cfg.font_size);
            //fm[0] is baseline (bottom edge of letters such as abcde)
            this.line_height=fm[1];// total line height
            this.baseline=fm[2];// lower bound of text such as: jgpq|
            this.v={x:0,y:0,w:c.canvas.width,h:c.canvas.height};
            this.scroll();
        },
    }),
    cfg=Configuration(),
    win=Window(c);

var render_text=()=>{
    c.clearRect(0,0,c.canvas.width,win.v.y+win.v.h);
    var from_line=cur.cl-win.num_visible_lines(),
        to_line=cur.cl+win.num_visible_lines();
    if(from_line<0){from_line=0;}
    if(to_line>buf.lines.length-1){to_line=buf.lines.length-1;}
    for(var i=from_line;i<to_line+1;++i){
        c.fillText(buf.getline(i),win.bw,win.ln_top(i));
    }
};

var render_cursor=()=>{// {Buffer, Cursor, Canvas}=>Rectangle
    // 1. clear where cursor was previously (currently handled by render_text)
    // 2. rewrite text at old cursor position (same)
    // 3. draw the cursor at the new position
    c.save();
    var l=buf.getline(cur.cl),// current line
        //ltop=win.ln_top(cur.cl),// top edge of current line
        cur_left_edge=c.measureText(l.slice(0,cur.co)).width,
        wid=cur.mode==='insert'?1:c.measureText(l.slice(0,cur.co+1)).width-cur_left_edge||10;

    // statusbar background
    var status_line_y=win.v.y+win.v.h-win.line_height;
    c.fillStyle='rgba(20,20,20,0.8)';
    c.fillRect(0,status_line_y-win.line_height-win.baseline,c.canvas.width,2*win.line_height);

    // statusbar
    c.fillStyle='orange';
    c.fillText(cur.status(),win.bw,status_line_y);// debug status line

    // cursor
    c.globalCompositeOperation='difference';
    c.fillRect(win.bw+cur_left_edge,win.ln_top(cur.cl)-win.line_height+win.baseline,wid,win.line_height);
    c.restore();
};

var gameloop=now=>{
    // LOGIC
    update(KEYQ,now);
    win.scroll();

    // RENDER - only after transforming text, viewport, or cursor
    render_text();
    // other ideas:
    // render_minimap();
    // render_statusline();
    render_cursor();
    // render_popups();

};

var rsz=()=>{
    requestAnimationFrame(gameloop);
    c.canvas.width=c.canvas.clientWidth;
    c.canvas.height=c.canvas.clientHeight;
    cfg.init(c);
    win.init(c);
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

var example_code=
    'if(!wid){wid=10;}\n'+
    '// bottom of screen\n'+
    'var status_line_y=win.v.y+win.v.h-win.ln_top(-1);\n'+
    'c.clearRect(0,status_line_y-win.line_height,c.canvas.width,2*win.line_height);\n'+
    'c.fillText(cur.status(),win.bw,status_line_y);// debug status line\n'+
    '\n'+
    'if(cur.mode==="insert"){wid=1;}\n'+
    'c.fillRect(win.bw+cur_left_edge,ltop-win.line_height+win.baseline,wid,win.line_height);\n'+
    'c.restore();\n'+
    '};\n'+
    '\n'+
    'var render_text=()=>{\n'+
    'c.clearRect(0,0,c.canvas.width,win.v.y+win.v.h);\n'+
    '// render ALL THE LINES\n'+
    'buf.lines.forEach((ln,i)=>c.fillText(buf.getline(i),win.bw,win.ln_top(i)));\n'+
    'if(!wid){wid=10;}\n'+
    '// bottom of screen\n'+
    'var status_line_y=win.v.y+win.v.h-win.ln_top(-1);\n'+
    'c.clearRect(0,status_line_y-win.line_height,c.canvas.width,2*win.line_height);\n'+
    'c.fillText(cur.status(),win.bw,status_line_y);// debug status line\n'+
    '\n'+
    'if(cur.mode==="insert"){wid=1;}\n'+
    'c.fillRect(win.bw+cur_left_edge,ltop-win.line_height+win.baseline,wid,win.line_height);\n'+
    'c.restore();\n'+
    '};\n'+
    '\n'+
    'var render_text=()=>{\n'+
    'c.clearRect(0,0,c.canvas.width,win.v.y+win.v.h);\n'+
    '// render ALL THE LINES\n'+
    'buf.lines.forEach((ln,i)=>c.fillText(buf.getline(i),win.bw,win.ln_top(i)));\n'+
    '};';
buf.ins(example_code);
cur.rowcol();
cur.up(11);
