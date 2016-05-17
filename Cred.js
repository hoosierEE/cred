// TODO: file i/o
'use strict';
var c=document.getElementById('c').getContext('2d'),
    KEYQ=[{mods:[false,false,false,false],k:''}],// lightens duties for key event handler


    Window=(c)=>({// class @param c: the target Canvas
        // STATE
        bw:20,// border width
        // defaults should be bad enough to clue you in that something's awry
        line_height:10, line_descent:5, v:{},// viewport position and size

        // METHODS
        ln_top(n){return this.bw+this.line_height*(n+1);},// top pixel of line n
        co_left(n){return this.bw+c.measureText(buf.getline(cur.cl).slice(0,n)).width;},// left edge of column n
        co_right(n){return this.bw+c.measureText(buf.getline(cur.cl).slice(0,n+1)).width;},// right edge of column n
        num_visible_lines(){return (c.canvas.height-2*this.bw)/this.line_height|0;},

        scroll(soff=5){
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
            if(prev_x!=this.v.x||prev_y!=this.v.y){c.setTransform(1,0,0,1,-this.v.x,-this.v.y);}
        },
        init(ctx){// must be called before using other Window methods
            var fm=FontMetric(cfg.font_name,cfg.font_size);
            this.line_ascent=fm[0];// top of text such as QMEW|
            this.line_height=fm[1];// total line height
            this.line_descent=fm[2];// lower bound of text such as: jgpq|
            this.v={x:0,y:0,w:c.canvas.width,h:c.canvas.height};
            this.scroll();
        },
    }),


    Configuration=()=>({// class
        font_size:'20px',
        font_name:'courier new',//'Sans-Serif',
        init(c){c.font=this.font_size+' '+this.font_name; c.fillStyle='#dacaba';},
    }),


    Buffer=()=>({// class
        // STATE
        s:'',
        pt:0,
        lines:[0],

        // METHODS
        getline(n){// Int->String the Nth line, not including any trailing newline
            var l=this.lines,len=l.length;
            if(0<n&&n<len){return this.s.slice(l[n]+1,l[n+1]);}// line in middle
            else if(n===0){return this.s.slice(0,l[1]);}// first
            else if(n>=len){return this.s.slice(1+l[len-1]);}// last
            else{return this.getline(Math.max(0,len+n));}// negative n indexes backwards but doesn't wrap
        },

        // ()->[Int] array of line start indexes
        gen_lines(){return this.s.split('').reduce((a,b,i)=>{b==='\n'&&a.push(i);return a;},[0]);},

        ins(ch){// insert ch chars to right of p
            if(this.pt===this.s.length){this.s=this.s+ch;}
            else{var fst=this.s.slice(0,this.pt),snd=this.s.slice(this.pt);this.s=fst+ch+snd;}
            this.lines=this.gen_lines();
            this.pt+=ch.length;
        },

        del(n){// delete n chars to right (n>0) or left (n<0) of point
            if(n===0||n+this.pt<0){return;}
            var leftd=n<0?n:0,rightd=n<0?0:n;
            var fst=this.s.slice(0,this.pt+leftd),snd=this.s.slice(this.pt+rightd);this.s=fst+snd;
            this.lines=this.gen_lines();
        },
    }),


    Cursor=(b)=>({// class
        /* Cursor
           Given a Buffer b:
           * keep track of editing "mode" (normal, insert, etc.)
           * modify b's point in response to motion commands
           * provide a "row, column" view of the Buffer (which is really just a String)
           * FSM for multi-part commands (e.g: `dt;` which means: delete from Point to first occurrence of ';')
           */

        // STATE
        cl:0,// current line
        co:0,// current column
        cx:0,// maximum column
        fd:0,// f-d escape sequence
        mode:'normal',// insert, TODO visual, various "minor modes"

        // METHODS
        curln(){return Math.max(0,b.lines.filter(x=>b.pt>x).length-1);},
        bol(){return b.s[b.pt-1]==='\n';},
        eol(){return b.s[b.pt]==='\n';},
        eob(){return b.pt>=b.s.length;},

        // Search
        to_bol(){this.left(this.co);},
        to_eol(){this.right(b.getline(this.cl).length-this.co-(this.eol()?0:1));this.cx=-1;},
        to_bob(){b.pt=0;this.rowcol();},
        to_eob(){b.pt=b.s.length-1;this.rowcol();},
        forward_paragraph(){
            var ra=b.s.slice(b.pt+1).search(/\n{2,}/);
            if(ra>=0){b.pt+=ra+2;this.rowcol();}
            else{this.to_eob();}
        },
        forward_word(){
            var ra=b.s.slice(b.pt+1).search(/\w\W/);
            if(ra>=0){this.right(ra+1,true);}
            else{this.to_eol();}
        },
        forward_to_char(c){
            if(this.eol()){this.cx=-1;return;}
            var ca=b.getline(this.cl).slice(this.co+1).indexOf(c);
            if(ca>=0){this.right(ca+1);}
        },
        backward_paragraph(){
            var ra=[...b.s.slice(0,b.pt)].reverse().join('').search(/\n{2,}/);
            if(ra>=0){b.pt-=ra+1;this.rowcol();}
            else{this.to_bob();}
        },
        backward_word(){
            var ra=[...b.s.slice(0,b.pt)].reverse().join('').search(/\n|(\w\W)/);
            if(ra>=0){this.left(ra+1,true);}
            else{this.to_bol();}
        },
        backward_to_char(c){
            if(this.bol()){return;}
            var ca=[...b.getline(this.cl).slice(0,this.co)].reverse().indexOf(c);
            if(ca>=0){this.left(ca+1);}
        },

        // Motion
        left(n,freely=false){
            b.pt-=n;if(b.pt<0){b.pt=0;}
            if(!freely&&n===1&&b.s[b.pt]==='\n'){b.pt+=1;}
            this.rowcol();
        },
        right(n,freely=false){
            if(this.eob()){return;}
            if(b.pt<b.s.length){
                if(b.s[b.pt+1]==='\n'&&n===1){b.pt+=freely?1:0;}
                else if(b.pt+n>b.s.length){b.pt=b.s.length-1;}
                else{b.pt+=n;}
            }
            this.rowcol();
        },
        rowcol(){
            this.cl=b.pt?this.curln():0;
            this.cx=this.co=b.pt-(!this.cl?0:1)-b.lines[this.cl];
        },
        up(n){this.up_down_helper(Math.max(this.cl-n,0));},
        down(n){this.up_down_helper(Math.min(Math.max(0,b.lines.length-1),this.cl+n));},
        up_down_helper(target_line){
            var target_line_length=Math.max(0,b.getline(target_line).length-1);
            if(this.cx<0){this.co=target_line_length;}
            else{this.co=Math.min(Math.max(0,target_line_length),this.cx);}
            this.cl=target_line;
            if(target_line===0){b.pt=this.co;}
            else{b.pt=b.lines[target_line]+1+this.co;}
        },

        // MODE changers
        esc_fd(){b.del(-2);this.left(2);if(this.eol()||this.eob()){this.left(1);}this.normal_mode();},
        append_mode(){this.mode='insert'; this.right(1,true);},
        insert_mode(){this.mode='insert';},
        normal_mode(){this.mode='normal';this.rowcol();},
        visual_mode(){this.mode='visual';},

        // status : () -> String // contains the modeline
        status(){return this.mode+'  '+this.cl+':'+this.co;},
    }),


    Parser=()=>({// class
        fsm:{mul:'',verb:'',mod:'',state:''},
        parse(dec){// parse : Decoder -> Action
            if(dec.code.search(/\d/)!==-1){this.fsm.mul+=dec.code;}
            if(dec.code.search(/]fFtT]/)!==-1){this.fsm.verb='find';}
            console.log(this.fsm);
        },
    }),

    // instances of the above classes
    cfg=Configuration(),
    buf=Buffer(),
    cur=Cursor(buf),
    par=Parser(cur),
    win=Window(c);

// decode : RawKey -> DecodedKey
var decode=({k, mods})=>{
    //var k=rk.k, mods=rk.mods;// get the components of the RawKey object
    var dec={type:'',code:'',mods:mods};// return type (modifiers pass through)
    // printable
    if(k==='Space'){dec.code=' ';}
    else{
        var shft=mods[3];
        var ma=k.slice(-1);// maybe alphanumeric
        var kd=k.slice(0,-1);
        if(kd==='Key'){dec.code=shft?ma:ma.toLowerCase();}
        else if(kd==='Digit'){dec.code=shft?")!@#$%^&*("[ma]:ma;}
        else if(k==='Tab'){dec.code='\t';}
        else if(k==='Enter'){dec.code='\n';}
        else{
            var pun=['Comma',',','<','Quote',"'",'"','Equal','=','+','Minus','-','_'
                     ,'Slash','/','?','Period','.','>','Semicolon',';',':','Backslash','\\','|'
                     ,'Backquote','`','~','BracketLeft','[','{','BracketRight',']','}'];
            var pid=pun.indexOf(k);
            if(pid>=0){dec.code=pun[pid+(shft?2:1)];}
        }
    }
    // non-printable
    if(dec.code.length>0){dec.type='print';}
    else{
        if(k==='Backspace'||k==='Delete'){dec.type='edit';dec.code=k[0];}// 'b','d'
        else if(k==='Escape'){dec.type='escape';}// dec.code should still be an empty string ('')
        else if(k.slice(0,5)==='Arrow'){dec.type='arrow';dec.code=k[5];}// 'u','d','l','r'
        else if(k.slice(0,4)==='Page'){dec.type='page';dec.code=k[4];}// 'u','d'
        else if(k==='Home'||k==='End'){dec.type='page';dec.code=k[0];}// 'h','e'
    }
    return dec;
};

// udpate : [DecodedKey] -> Action
var update=(rks,t)=>{
    while(rks.length){// consume KEYQ, dispatch event handlers
        var dec=decode(rks.shift());// behead queue
        if(cur.mode==='normal'){
            switch(dec.code){
            case'0':cur.to_bol();break;
            case'$':cur.to_eol();break;
            case'{':cur.backward_paragraph();break;
            case'}':cur.forward_paragraph();break;
            case'j':cur.down(1);break;
            case'k':cur.up(1);break;
            case'l':cur.right(1);break;
            case'G':cur.to_eob();break;
            case'h':cur.left(1);break;
            case'i':cur.insert_mode();break;
            case'a':cur.append_mode();break;
            case'b':cur.backward_word();break;
            case'e':cur.forward_word();break;
            case'x':buf.del(1);cur.left(1);break;
            case'D':buf.del(buf.getline(cur.cl).slice(cur.co).length);cur.left(1);break;
            case' ':console.log('SPC-');break;// TODO SPC-prefixed functions a-la Spacemacs!
            default:if(dec.code.search(/[1-9dcyfgt]/)!==-1){par.parse(dec);}break;
            }
        }
        else if(cur.mode==='vimcmd'){
            // parse multi-part vim commands (verb [modifier] object)
        }
        else if(cur.mode==='insert'){
            switch(dec.type){
            case'print':
                buf.ins(dec.code);cur.rowcol();
                // auxiliary escape methods: quickly type 'fd' or use the chord 'C-['
                if(dec.code==='f'){cur.fd=-t;}
                if(dec.code==='d'&&cur.fd<0&&t+cur.fd<500){cur.esc_fd();}
                if(dec.code==='['&&dec.mods[1]){buf.del(-1);cur.mode='normal';cur.left(2);}
                break;
            case'edit':
                if(dec.code==='B'){buf.del(-1);cur.left(1,true);}// backspace
                else if(dec.code==='D'){buf.del(1);}// forward delete
                break;
            case'escape':cur.normal_mode();break;
            }
        }
        if(dec.type==='arrow'){//all modes support arrows in the same way
            switch(dec.code){
            case'D':cur.down(1);break;
            case'U':cur.up(1);break;
            case'R':cur.right(1,true);break;
            case'L':cur.left(1,true);break;
            }
        }
    }
};


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

c.canvas.onmousewheel=(ev)=>{console.log(ev);};

window.onload=rsz;
window.onresize=rsz;
window.onkeydown=(k)=>{
    requestAnimationFrame(gameloop);
    if(k.type==='keydown'){// push incoming events to a queue as they occur
        if(!k.metaKey){k.preventDefault();}
        KEYQ.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey], k:k.code});
    }
};
