// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    Cursor=b=>({
        // STATE
        cl:0,// current line
        co:0,// current column
        cx:0,// maximum column
        fd:0,// f-d escape sequence
        mode:'normal',// insert, visual, lisp(?)
        msg:'',

        // METHODS
        curln(){return Math.max(0,b.lines.filter(x=>b.pt>x).length-1);},// line containing point
        eol(){return b.s[b.pt]==='\n';},// currently at the end of line
        bol(){return b.s[b.pt-1]==='\n';},// beginning of line
        bob(){return b.pt===0;},// beginning of buffer
        eob(){return b.pt>=b.s.length;},// end of buffer

        // freely: allow moving past left-side limits
        left(n,freely=false){
            b.pt-=n;
            if(b.pt<0){b.pt=0;}
            if(!freely&&n===1&&b.s[b.pt]==='\n'){b.pt+=1;}
            this.rowcol();
        },

        // freely: allow moving past right-side limits
        right(n,freely=false){
            if(this.eob()||this.empty_line()){return;}
            b.pt+=n;
            if(!freely){
                if(n===1&&b.s[b.pt]==='\n'||b.pt>b.s.length){b.pt-=1;}
            }
            this.rowcol();
        },

        esc_fd(){
            b.del(-2);
            this.left(2);
            this.normal_mode();
        },

        append_mode(){
            this.mode='insert';
            this.right(1,true);
        },

        empty_line(){return 0===b.getline(this.curln()).length;},
        insert_mode(){this.mode='insert';},
        normal_mode(){this.mode='normal';this.rowcol();},
        visual_mode(){this.mode='visual';},
        inserting(){return this.mode==='insert';},
        visualizing(){return this.mode==='visual';},
        normal(){return this.mode==='normal';},

        rowcol(){
            this.cl=b.pt?this.curln():0;
            // subtract the extra newline except at line 0
            this.cx=this.co=b.pt-(!this.cl?0:1)-b.lines[this.cl];
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

        status(){return this.cl+':'+this.co;},
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
            // NOTE: by adding newlines as we go, we can add ch.length
            // to each element of lines that is past the editing location.
            this.lines=this.gen_lines();// recalculate whole line table AAAH!
            this.pt+=ch.length;
        },

        del(n){// delete n chars to right (n>0) or left (n<0) of point
            if(n===0||n+this.pt<0){return;}
            var leftd=n<0?n:0, rightd=n<0?0:n;
            var fst=this.s.slice(0,this.pt+leftd),
                snd=this.s.slice(this.pt+rightd);
            this.s=fst+snd;
            // NOTE: by subtracting newlines as we go, we can subtract ch.length
            // from each element of lines past the editing location.
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
//            4            11       16
//buf.ins('five\n\n\n');
////                11
//buf.ins('five\n');
////            16
cur.rowcol();
