// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    MODE='normal',
    ESC_FD=0,
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    Cursor=b=>({
        // STATE
        cl:0,// current line
        co:0,// current column
        cx:0,// maximum column
        //pl:0,// previous line
        //po:0,// previous column

        // METHODS
        curln(){return b.lines.map(_=>b.pt>=_).lastIndexOf(true);},
        eol(){return b.s[b.pt+1]==='\n';},// end of line
        bol(){return b.s[b.pt-1]==='\n';},// beginning of line
        bob(){return b.pt===0;},// beginning of buffer
        eob(){return b.pt>=b.s.length-0;},// end of buffer

        // to put the point at column X on line Y:
        // goto line Y lines begin with a newline except the first one in the file
        // example string:
        // 0    5     10   15   20   25   30   35    40   45   50   55   60
        // some text\n...second line is longer, and\nthe third line is last
        //                                           ^ column=0, line=2, point=40
        //            ^ column 0, line 1, point 10
        // ^ column 0, line 0
        // we can see that in terms of the buffer's Point:
        // line | column | point
        // 0    | 0      | follows column
        // 1    | 0      | first newline index, plus 1
        // 2    | 0      | second newline index, plus 1

        // del: delete override - allow moving past left-side limits if deleting
        left(n,del=false){
            b.pt-=n;
            if(b.pt<0){b.pt=0;}
            if(!del&&n===1&&b.s[b.pt]==='\n'){b.pt+=1;}
            this.left_right();
        },
        // wo: write override - allow moving past right-side limits if writing
        right(n,wo=false){
            b.pt+=n;
            if(b.pt>b.s.length-1){b.pt=b.s.length-1;}
            if(!wo&&n===1&&b.s[b.pt]==='\n'){b.pt-=1;}
            this.left_right();
        },
        left_right(){
            this.cl=this.curln();
            this.co=b.pt-(this.cl===0?0:1)-b.lines[this.cl];// subtract the extra newline except at line 0
            this.cx=this.co;
        },

        up(n){this.up_down(Math.max(this.cl-n,0));},
        down(n){this.up_down(Math.min(Math.max(0,b.lines.length-1),this.cl+n));},
        up_down(target_line){
            var target_line_length=b.getline(target_line).length-1;
            this.co=Math.min(Math.max(0,target_line_length),this.cx);// try in order: maxco, len-1, 0
            this.cl=target_line;
            if(target_line===0){b.pt=this.co;}
            else{b.pt=b.lines[target_line]+1+this.co;}
        },

        append_mode(){if(b.s[b.pt]!=='\n'){this.right(1,true);}},// TODO: fix for appending around newlines
        //append_mode(){this.right(1,true);},
        insert_mode(){},// intentionally left blank
        esc_fd(){b.del(-2);this.left(2);if(b.pt>b.s.length-1){b.pt=b.s.length-1;}},
        msg:'',
        status(){return this.msg+' [col: '+this.co+', cx: '+this.cx+', pt: '+b.pt+', line: '+this.cl+']';},
    }),
    Buffer=()=>({
        // STATE
        s:'',
        pt:0,
        lines:[0],

        // METHODS
        getline(n){// Int->String // the line, not including \n
            var l=this.lines,len=l.length;
            if(0<n&&n<len){return this.s.slice(l[n]+1,l[n+1]);}// line in middle
            else if(n===0){return this.s.slice(0,l[1]);}// first
            else if(len<=n){return this.s.slice(1+l[len-1]);}// last
            else{return this.getline(Math.max(0,len+n));}// negative n indexes backwards but doesn't wrap
        },

        gen_lines(){return this.s.split('').reduce((a,b,i)=>{b==='\n'&&a.push(i);return a;},[0]);},

        ins(ch){// insert ch chars to right of p
            if(this.pt===this.s.length){this.s=this.s+ch;}
            else{
                var fst=this.s.slice(0,this.pt),
                    snd=this.s.slice(this.pt);
                this.s=fst+ch+snd;
            }
            this.lines=this.gen_lines();
            // NOTE: if we add newlines to lines as we go, we can add ch.length to each element
            // of lines that is past where point started.
            this.pt+=ch.length;
        },

        del(n){// delete n chars to right (n>0) or left (n<0) of point
            if(n===0||n+this.pt<0){return;}
            var leftd=n<0?n:0, rightd=n<0?0:n;
            var fst=this.s.slice(0,this.pt+leftd),
                snd=this.s.slice(this.pt+rightd);
            this.s=fst+snd;
            this.lines=this.gen_lines();// recalculate whole line table AAAH!
        },
    }),

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
    c.fillStyle='orange';
    if(cur.bob()){c.fillStyle='green';}
    else if(cur.eob()){c.fillStyle='red';}
    else if(cur.bol()){c.fillStyle='lightgreen';}
    else if(cur.eol()){c.fillStyle='pink';}

    // debugging status line (message, [col, maxcol, point, line])
    c.clearRect(offs.bw,offs.lmul(10),c.canvas.width,offs.h);
    c.fillText(cur.status(),offs.bw,offs.lmul(10)+offs.h);

    var cur_left_edge=c.measureText(l.slice(0,cur.co)).width,
        wid=c.measureText(l.slice(0,cur.co+1)).width-cur_left_edge;
    if(MODE==='insert'){wid=1;}
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

buf.ins('five\n');
buf.ins('five\n');
buf.ins('five\n');
buf.ins('five\n');
cur.right(0);
