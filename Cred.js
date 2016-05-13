// TODO: horizontal scrolling, file i/o
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

    ScreenOffsets=(c)=>({// c: the target Canvas
        bw:20,// border width
        // defaults: bad enough to clue you in
        line_height:10, baseline:5, v:{x:0,y:0,w:0,h:0},// viewport position and size
        ln_top(n){return this.bw+this.line_height*(n+1);},// top pixel of line n
        num_visible_lines(){return Math.floor((c.canvas.height-2*this.bw)/this.line_height);},
        scroll(soff=4){// Scroll to cursor. Optional scroll offset `soff` lines from top/bottom of screen.
            // TODO: horizontal scroll

            var prev_y=this.v.y;
            // NOTE: while loops make the math easier.
            while(this.ln_top(cur.cl+soff)>this.v.y+this.v.h){this.v.y+=this.ln_top(cur.cl)-this.ln_top(cur.cl-1);}
            while(this.ln_top(cur.cl-soff)<this.v.y){this.v.y-=this.ln_top(cur.cl)-this.ln_top(cur.cl-1);}
            if(this.v.y<0){this.v.y=0;}// bounds check
            if(prev_y!=this.v.y){c.setTransform(1,0,0,1,0,-this.v.y);}// move canvas opposite of viewport
        },
        init(ctx){// must be called before using other ScreenOffsets methods
            var fm=FontMetric(settings.font_name,settings.font_size);
            //fm[0] is baseline (bottom edge of letters such as abcde)
            this.line_height=fm[1];// total line height
            this.baseline=fm[2];// lower bound of text such as: jgpq|
            this.v={x:0,y:0,w:c.canvas.width,h:c.canvas.height};
            this.scroll();
        },
    }),
    settings=Settings(),
    offs=ScreenOffsets(c);

var render_text=()=>{
    if(buf.changed){// If the buffer changed, render everything
        buf.changed=false;
        c.clearRect(0,0,c.canvas.width,offs.v.y+offs.v.h);
        buf.lines.forEach((ln,i)=>c.fillText(buf.getline(i),offs.bw,offs.ln_top(i)));
    }
    // TODO: only render lines inside of viewport?
    // if soff==0, there could be up to 1 screen's worth of lines on either side
    // of the cursor.  So always render that many lines before and after.
    else{
        var from_line=cur.cl-offs.num_visible_lines(),
            to_line=cur.cl+offs.num_visible_lines();
        if(from_line<0){from_line=0;}
        if(to_line>buf.lines.length-1){to_line=buf.lines.length-1;}
        console.log('from: '+from_line+', to: '+to_line);
        c.clearRect(0,0,c.canvas.width,offs.v.y+offs.v.h);
        for(var i=from_line;i<to_line+1;++i){
            c.fillText(buf.getline(i),offs.bw,offs.ln_top(i));
        }
    }
};

var render_cursor=()=>{// {Buffer, Cursor, Canvas}=>Rectangle
    // 1. clear where cursor was previously (currently handled by render_text)
    // 2. rewrite text at old cursor position (same)
    // 3. draw the cursor at the new position
    c.save();
    var l=buf.getline(cur.cl),// current line
        //ltop=offs.ln_top(cur.cl),// top edge of current line
        cur_left_edge=c.measureText(l.slice(0,cur.co)).width,
        wid=cur.mode==='insert'?1:c.measureText(l.slice(0,cur.co+1)).width-cur_left_edge||10;

    // statusbar background
    var status_line_y=offs.v.y+offs.v.h-offs.ln_top(-1);
    c.fillStyle='rgba(20,20,20,0.9)';
    c.fillRect(0,status_line_y-offs.line_height-offs.baseline,c.canvas.width,2*offs.line_height);

    // statusbar
    c.fillStyle='orange';
    c.globalCompositeOperation='difference';
    c.fillText(cur.status(),offs.bw,status_line_y);// debug status line

    // cursor
    c.fillRect(offs.bw+cur_left_edge,offs.ln_top(cur.cl)-offs.line_height+offs.baseline,wid,offs.line_height);
    c.restore();
};

var gameloop=now=>{
    update(KEYQ,now);
    offs.scroll();// must happen before anything gets drawn, or scrolling is one frame behind
    render_text();
    // render_minimap();
    // render_statusline();
    render_cursor();
    // render_popups();

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

var example_code=
    'if(!wid){wid=10;}\n'+
    '// bottom of screen\n'+
    'var status_line_y=offs.v.y+offs.v.h-offs.ln_top(-1);\n'+
    'c.clearRect(0,status_line_y-offs.line_height,c.canvas.width,2*offs.line_height);\n'+
    'c.fillText(cur.status(),offs.bw,status_line_y);// debug status line\n'+
    '\n'+
    'if(cur.mode==="insert"){wid=1;}\n'+
    'c.fillRect(offs.bw+cur_left_edge,ltop-offs.line_height+offs.baseline,wid,offs.line_height);\n'+
    'c.restore();\n'+
    '};\n'+
    '\n'+
    'var render_text=()=>{\n'+
    'c.clearRect(0,0,c.canvas.width,offs.v.y+offs.v.h);\n'+
    '// render ALL THE LINES\n'+
    'buf.lines.forEach((ln,i)=>c.fillText(buf.getline(i),offs.bw,offs.ln_top(i)));\n'+
    'if(!wid){wid=10;}\n'+
    '// bottom of screen\n'+
    'var status_line_y=offs.v.y+offs.v.h-offs.ln_top(-1);\n'+
    'c.clearRect(0,status_line_y-offs.line_height,c.canvas.width,2*offs.line_height);\n'+
    'c.fillText(cur.status(),offs.bw,status_line_y);// debug status line\n'+
    '\n'+
    'if(cur.mode==="insert"){wid=1;}\n'+
    'c.fillRect(offs.bw+cur_left_edge,ltop-offs.line_height+offs.baseline,wid,offs.line_height);\n'+
    'c.restore();\n'+
    '};\n'+
    '\n'+
    'var render_text=()=>{\n'+
    'c.clearRect(0,0,c.canvas.width,offs.v.y+offs.v.h);\n'+
    '// render ALL THE LINES\n'+
    'buf.lines.forEach((ln,i)=>c.fillText(buf.getline(i),offs.bw,offs.ln_top(i)));\n'+
    '};';
buf.ins(example_code);
cur.rowcol();
