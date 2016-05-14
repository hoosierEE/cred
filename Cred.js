// TODO: file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),
    //mmc=document.getElementById('mmc').getContext('2d'),// minimap
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    buf=Buffer(),
    cur=Cursor(buf),

    Configuration=()=>({
        font_size:'18px',
        font_name:'mono',//'Sans-Serif',
        init(c){
            c.font=this.font_size+' '+this.font_name;
            c.fillStyle='#dacaba';
        },
    }),

    Window=(c)=>({// c: the target Canvas
        // STATE
        bw:20,// border width
        // defaults should be bad enough to clue you in that something's awry
        line_height:10, line_descent:5, v:{},// viewport position and size

        // METHODS
        ln_top(n){return this.bw+this.line_height*(n+1);},// top pixel of line n
        co_left(n){return this.bw+c.measureText(buf.getline(cur.cl).slice(0,n)).width;},// left edge of column n
        co_right(n){return this.bw+c.measureText(buf.getline(cur.cl).slice(0,n+1)).width;},// right edge of column n
        num_visible_lines(){return (c.canvas.height-2*this.bw)/this.line_height|0;},

        scroll(soff=8){
            if(soff>this.num_visible_lines()){soff=this.num_visible_lines()/2|0;}
            else if(soff<1){soff=1;}// smallest usable value - 0 is too small
            var prev_y=this.v.y, prev_x=this.v.x;// grab current value of x and y

            // scroll up or down
            var ltop=this.ln_top(cur.cl+soff), lbot=this.ln_top(cur.cl-soff);
            if(ltop>this.v.y+this.v.h){this.v.y+=ltop-(this.v.y+this.v.h);}
            if(lbot<this.v.y){this.v.y-=this.v.y-lbot;}

            // scroll left or right
            var crt=this.co_right(cur.co)+this.bw, clt=this.co_left(cur.co)-this.bw;
            if(crt>this.v.x+this.v.w){this.v.x+=crt-this.v.w;}
            if(clt<this.v.x){this.v.x-=this.v.x-clt;}

            if(this.v.y<0){this.v.y=0;}
            if(this.v.x<0){this.v.x=0;}

            // move canvas opposite of viewport if x or y changed
            if(prev_x!=this.v.x||prev_y!=this.v.y){
                c.setTransform(1,0,0,1,-this.v.x,-this.v.y);
            }
        },
        init(ctx){// must be called before using other Window methods
            var fm=FontMetric(cfg.font_name,cfg.font_size);
            //fm[0] is line_descent (bottom edge of letters such as abcde)
            this.line_ascent=fm[0];
            this.line_height=fm[1];// total line height
            this.line_descent=fm[2];// lower bound of text such as: jgpq|
            this.v={x:0,y:0,w:c.canvas.width,h:c.canvas.height};
            this.scroll();
        },
    }),
    cfg=Configuration(),
    win=Window(c);

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
    c.fillStyle='rgba(20,10,10,0.9)';
    c.fillRect(win.v.x,status_line_y,win.v.w,win.line_height);

    // statusbar
    c.fillStyle='orange';
    c.fillText(cur.status(),win.v.x+win.bw,status_line_y+win.line_ascent);

    // cursor
    c.globalCompositeOperation='difference';
    c.fillRect(win.bw+cur_left_edge,win.ln_top(cur.cl)-win.line_ascent,wid,win.line_height);
    c.restore();
};

//var render_minimap=()=>{
//    mmc.canvas.height=c.canvas.clientHeight;
//    mmc.canvas.width=win.v.w*0.9;
//    mmc.fillStyle='white';
//    mmc.font='1px monospace';
//    buf.lines.forEach((l,i)=>mmc.fillText(buf.getline(i),win.bw,0.5*win.ln_top(i)));
//    mmc.clearRect(win.v.w*0.9,win.v.y,win.v.w*0.9,win.v.y+win.v.h);
//    var draw_result=(bmp)=>{
//        c.drawImage(bmp,win.v.w*0.9,win.v.y,mmc.canvas.width,c.canvas.clientHeight);
//    };
//    createImageBitmap(mmc.canvas).then(draw_result);
//};

var gameloop=now=>{
    update(KEYQ,now);
    win.scroll();
    render_text();
    render_cursor();
    // other ideas:
    //render_minimap();
    // render_statusline();
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
    'c.fillRect(win.bw+cur_left_edge,ltop-win.line_height+win.line_descent,wid,win.line_height);\n'+
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
    'c.fillRect(win.bw+cur_left_edge,ltop-win.line_height+win.line_descent,wid,win.line_height);\n'+
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
