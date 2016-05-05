// TODO: scrolling, file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),// rarely changing bottom canvas (for text)
    MODE='normal',
    ESC_FD=0,
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler
    Cursor=(b)=>({
        // STATE
        cl:0,// current line
        co:0,// current column
        cx:0,// maximum column
        msg:'constructed',

        // METHODS
        get_current_line(){return b.lines.map(_=>b.pt>=_).lastIndexOf(true);},
        eol(){return b.s[b.pt+1]==='\n';},// End of line
        bol(){return b.s[b.pt-1]==='\n';},// Beginning of line
        left(n){
            if(n===1&&this.bol()){
                this.msg='BOL';
                return;
            }// h doesn't cross '\n'
            else if(b.pt-n<0){
                this.msg='BOF';
                b.pt=0;
            }// goto BOF
            else{
                this.msg='...';
                b.pt-=n;
            }
            // update line and column
            this.cl=this.get_current_line();
            this.co=b.pt-b.lines[this.cl]-1;
            this.cx=this.co;// left or right movement overrides maximum column
        },

        right(n,write_override=false){
            if(n===1&&this.eol()){
                this.msg='EOL';
                return;
            }// l doesn't cross '\n'
            else if(b.pt+n>b.s.length-1){
                this.msg='EOF';
                b.pt=b.s.length-(write_override?0:1);
            }
            else{
                this.msg='...';
                b.pt+=n;
            }
            this.cl=this.get_current_line();
            this.co=b.pt-b.lines[this.cl];
            this.cx=this.co;
        },

        up(n){
            // concept: move the point backward to the start of the line above,
            // then forward to cx, stopping at max of EOL or cx
            var target_line=this.cl-n;
            if(target_line<0){target_line=0;}
            var target_column=this.cx;
            var lineabove=b.getline(target_line);
            if(target_column>lineabove.length){target_column=lineabove.length;}
            b.pt=b.lines[target_line]+target_column;
            this.cl=target_line;
            this.co=target_column;
            //console.log(this.co+','+this.cx+','+this.cl);
        },

        down(n){
            var target_line=this.cl+n;
            if(target_line>b.lines.length-1){target_line=b.lines.length-1;}
            this.cl=this.get_current_line();// line containing point
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

        ins(ch){// insert ch chars to right of p
            if(this.pt===this.s.length){this.s=this.s+ch;}
            else{var fst=this.s.slice(0,this.pt), snd=this.s.slice(this.pt); this.s=fst+ch+snd;}
            // update lines
            for(var i=0;i<ch.length;++i){if(ch[i]==='\n'){this.lines.push(this.pt+i);}}
            this.lines.sort();
            this.pt+=ch.length;
        },

        gen_lines(){return this.s.split('').reduce((a,b,i)=>{b==='\n'&&a.push(i);return a;},[0]);},

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
        x:20,// border width
        lmul(lnum){return this.y+this.h*lnum;},// lower edge of line
        init(ctx){this.h=1.25*ctx.measureText('W').width;this.y=this.h+this.x;}
    }),
    buf=Buffer(),
    cur=Cursor(buf),
    offs=ScreenOffsets();

var render_text=()=>{
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    // render all the lines
    buf.lines.forEach((ln,i)=>c.fillText(buf.getline(i),offs.x,offs.lmul(i)));
};

var render_cursor=()=>{
    // 1. clear where cursor was previously
    // 2. rewrite text at old cursor position
    // 3. draw the cursor at the new position
    var l=buf.getline(cur.get_current_line());// current line
    var line_y_offset=offs.lmul(cur.get_current_line());
    c.fillText(l,offs.x,line_y_offset);// draw old cursor position's text

    c.save();
    c.globalCompositeOperation='difference';
    c.fillStyle=cur.eol()?'blue':'orange';

    // stats
    c.clearRect(offs.x,offs.lmul(10),c.canvas.width,offs.h);
    c.fillText(cur.status(),offs.x,offs.lmul(10)+offs.h);

    var cur_left_edge=c.measureText(l.split(0,cur.co)).width,
        wid=c.measureText(l.split(0,cur.co+1)).width-cur_left_edge;
    c.fillRect(offs.x+cur_left_edge,line_y_offset,wid,offs.h);// draw cursor over existing text
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
    c.font='24px Sans-Serif';
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
buf.ins('with\na newline');
