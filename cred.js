// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    MODE='normal',
    ESC_FD=0,
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    Cursor=(b)=>({
        // STATE
        cl:0,// current line
        //pl:0,// previous line
        co:0,// current column
        //po:0,// previous column
        cx:0,// maximum column
        msg:'init',

        // METHODS
        curln(){return b.lines.map(_=>b.pt>=_).lastIndexOf(true);},
        eol(){return b.s[b.pt+1]==='\n';},// end of line
        bol(){return b.s[b.pt-0]==='\n';},// beginning of line
        bob(){return b.s[b.pt-1]===undefined;},// beginning of buffer
        eob(){return b.pt+1>=b.s.length;},// end of buffer

        // FIXME - left and right move 2 spaces when changing direction
        left(n){
            if(n===1&&this.bol()){
                this.msg='BOL';
                return;
            }
            else if(b.pt-n<0){
                this.msg='BOF';
                b.pt=0;
            }// goto BOF
            else{
                this.msg='...';
                b.pt-=n;
                this.cl=this.curln();
            }
            // update line and column
            this.co=b.pt-(b.lines[this.cl]);
            this.cx=this.co;
        },

        right(n,write_override=false){
            if(n===1&&this.eol()){
                this.msg='EOL';
                return;
            }// l doesn't cross '\n'
            else if(b.pt+n>=b.s.length-1){
                this.msg='EOF';
                b.pt=Math.min(b.pt+n,b.s.length-1);//b.s.length-(write_override?0:1);
            }
            else{
                this.msg='...';
                b.pt+=n;
            }
            this.cl=this.curln();
            this.co=b.pt-b.lines[this.cl];
            this.cx=this.co;
        },

        up(n){
            // find target line
            var target_line=this.cl-n<0?0:this.cl-n;
            //if(target_line<0){target_line=0;}
            var t_line=b.getline(target_line);// the string

            // find target column
            var target_column=this.cx;
            if(target_column>t_line.length-1){target_column=t_line.length-1;}
            this.co=target_column;

            // move point
            b.pt=b.lines[target_line]+target_column;
            this.cl=target_line;
        },

        down(n){
            // find target line
            var target_line=Math.min(this.cl+n,b.lines.length-1);

            // find target column
            this.cl=this.curln();// line containing point
            this.co=b.pt-b.lines[this.cl];
        },

        append_mode(){if(b.s[b.pt]!=='\n'){this.right(1,true);}},
        insert_mode(){},// intentionally left blank
        esc_fd(){b.del(-2);this.left(2);if(b.pt>b.s.length-1){b.pt=b.s.length-1;}},
        status(){return this.msg+' [col: '+this.co+', pt: '+b.pt+', line: '+this.cl+']';},
    }),
    Buffer=()=>({
        // STATE
        s:'',
        pt:0,
        lines:[0],

        // METHODS
        getline(n){// Int->String // the entire line
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
            this.lines=this.gen_lines();// recalculate whole line table
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
    if(cur.bob()){c.fillStyle='green';}
    else if(cur.eob()){c.fillStyle='red';}
    else if(cur.bol()){c.fillStyle='lightgreen';}
    else if(cur.eol()){c.fillStyle='pink';}
    else{c.fillStyle='orange';}

    // stats
    c.clearRect(offs.bw,offs.lmul(10),c.canvas.width,offs.h);
    c.fillText(cur.status(),offs.bw,offs.lmul(10)+offs.h);

    var cur_left_edge=c.measureText(l.slice(0,cur.co)).width,
        wid=c.measureText(l.slice(0,cur.co+1)).width-cur_left_edge;
    // fillrect(x,y,width,height)
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

//buf.ins('a test with\na newline\n\nand a pair of newlines\n\n\nand a very long line after three at the end');
buf.ins('withgjqp|\na newline');
cur.right(0);
