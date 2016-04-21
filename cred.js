'use strict';
var c=document.getElementById('c').getContext('2d'),
    p=document.getElementById('p').getContext('2d'),
    MODE='normal', // Vim modes
    ESC_FD=[0,0], // 'fd' escape sequence
    KEYQ=[{mods:[false,false,false,false],k:''}], // lightens duties for key event handler

    // a string
    Buffer=()=>({
        // cursor position
        p:0,a:'',changed:false,
        mov(n=1){// move the cursor (default: 1 to the right)
            this.p=this.p+n;
            if(this.p<0){this.p=0;}
        },
        ins(ch){// insert ch at this.p
            this.changed=true;
            if(this.p==this.a.length){this.a=this.a+ch;}
            else{this.a=this.a.substr(0,this.p)+ch+this.a.substr(this.p);}
            this.mov(ch.length);},
        del(n){// delete n chars before (n<0) or after (n>0) cursor
            if(n==0){return;}
            if(n<0){
                if(!this.p){return;}
                this.a=this.a.substr(0,this.p+n)+this.a.substr(this.p);
                this.mov(n);
            }
            else{
                if(this.p==this.a.length){return;}
                else{this.a=this.a.substr(0,this.p)+this.a.substr(this.p+n);}
            }
            this.changed=true;
        },
    }),

    // navigation, editing
    Cursor=(buf)=>({
        x:0,y:0,width:0,height:0,
        home(){this.width=p.measureText('W').width; this.height=this.width*1.5;
               this.x=this.width; this.y=this.width*1.5;},

        up(){
            var d=buf.a.lastIndexOf('\n',buf.p-1);// newline to left of cursor?
            if(d<0){this.left(buf.p);}// nope, goto buffer start
            else{this.left(buf.p-d);}// goto left of previous newline
        },

        dn(){
            var d=buf.a.indexOf('\n',buf.p+1);// newline to right of cursor?
            if(d<0){this.right(buf.a.length-buf.p);}//no newline found, move to end of buffer
            else{this.right(d-buf.p);}// goto left of next newline
        },

        // TODO next() and prev() don't handle edge cases yet
        next(ch){
            var d=buf.a.indexOf(ch,buf.p+1);
            return d<0?d:d-(buf.p);
        },

        prev(ch){
            return buf.p-buf.a.lastIndexOf(ch,buf.p-1);
        },

        // left() and right() mutate cursor position logically (buf.p) and graphically (x,y)
        right(n=1){
            while(n-->0){
                if(buf.p==buf.a.length){return;}
                this.width=c.measureText(buf.a[++buf.p]).width;
                this.x+=this.width;
                if(this.x>c.canvas.width){this.crlf();}
            }
        },
        left(n=1){
            while(n-->0){
                if(buf.p==0){return;}
                this.width=c.measureText(buf.a[--buf.p]).width;
                this.x-=this.width;
                if(this.x<this.width){this.x=this.width;}
            }
        },
        crlf(){this.x=this.width;this.y+=this.height;},
    }),
    buf=Buffer();
var cur=Cursor(buf);

buf.a='cred - an html5 canvas rendered editor';
console.log(buf.a);

// udpate : [RawKey] -> BufferAction
var update=(rks)=>{
    while(rks.length){ // consume KEYQ, dispatch event handlers
        var dec=decode(rks.shift()); // behead queue
        if(MODE=='normal'){
            switch(dec.code){// regex?
            case'i':MODE='insert';break;// insert before cursor
            case'a':MODE='insert';cur.right();break;// insert after cursor
            case'A':MODE='insert';if(buf.a[buf.p]!='\n'){cur.dn();}break;// insert at end of line
            case'I':MODE='insert';if(buf.a[buf.p-1]!='\n'){cur.up();}break;// insert at start of line
            case'o':MODE='insert';if(buf.a[buf.p]!='\n'){cur.dn();}buf.ins('\n');break;// insert below
            case'O':MODE='insert';cur.up();buf.ins('\n');if(buf.p==1){cur.left();}break;// insert above
            case'b':cur.left([cur.prev(' '),cur.prev('\n')].filter(x=>x>0)[0]);break;// beginning of word
            case'e':cur.right([cur.next(' '),cur.next('\n')].filter(x=>x>0)[0]);break;// end of word
            case'h':cur.left();break;
            case'j':cur.dn();break;
            case'k':cur.up();break;
            case'l':cur.right();break;}}
        else if(MODE=='insert'){
            switch(dec.type){
            case'escape':MODE='normal';break;
            case'print':
                buf.ins(dec.code); // insert this char to text buffer
                // 'fd' escape sequence
                if(dec.code=='f'){ESC_FD=[1,performance.now()];}
                if(dec.code=='d'&&ESC_FD[0]&&performance.now()-ESC_FD[1]<500){
                    ESC_FD=[0,performance.now()];MODE='normal'; buf.del(-2);} break;
            case'edit':buf.del(dec.code=='B'?-1:1);break;
                // TODO remaining handlers
            case'page':break;}}
        if(dec.type=='arrow'){
            switch(dec.code){
            case'D':cur.dn();break;
            case'U':cur.up();break;
            case'R':cur.right();break;
            case'L':cur.left();break;}}}};

var render_cursor=(t,cursor)=>{
    p.clearRect(10,10,p.canvas.width,p.canvas.height);
    var cursorcolor=1-Math.abs(Math.cos(t/500)/2);// linear-looking sweep
    p.fillStyle='rgba(50,255,255,'+cursorcolor+')';
    p.fillRect(cursor.x, cursor.y-cursor.height, 1, cursor.height);
};

var render_text=(now)=>{
    cur.home();
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='lightgray';
    for(var i=0;i<buf.a.length;++i){
        if(cur.y-cur.height>c.canvas.height){break;} // don't render beyond canvas
        var tw=c.measureText(buf.a[i]).width; // non-monospace fix!
        if(buf.a[i]=='\t'){if(cur.x+tw*4+cur.width>c.canvas.width){cur.crlf();}else{cur.x+=4*tw;}}
        else if(buf.a[i]=='\n'){cur.crlf();}
        else{c.fillText(buf.a[i],cur.x,cur.y); cur.x+=tw;}
        if(cur.x+tw+cur.width>c.canvas.width){cur.crlf();}}};

var gameloop=(now,resiz)=>{
    update(KEYQ);
    if(buf.changed||resiz){
        render_text(now);
        buf.changed=false;}
    if(cur.changed){
        render_cursor(now,cur);
    }
    //requestAnimationFrame(gameloop);
};

window.onload=()=>{
    var rsz=()=>{
        c.canvas.width=c.canvas.clientWidth;
        c.canvas.height=c.canvas.clientHeight;
        p.canvas.width=p.canvas.clientWidth;
        p.canvas.height=p.canvas.clientHeight;
        p.font=c.font='24px Sans-Serif';
        window.requestAnimationFrame((now)=>gameloop(now,true));};
    rsz();
    window.onresize=rsz;
    window.onkeydown=(k)=>{
        if(k.type=='keydown'){
            // push incoming events to a queue as they occur
            window.requestAnimationFrame((now)=>gameloop(now,true));
            k.preventDefault();
            KEYQ.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],k:k.code});}};};
