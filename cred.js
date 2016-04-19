'use strict';
var c=document.getElementById('c').getContext('2d'),
    MODE='normal', // Vim modes
    ESC_FD=[0,0], // 'fd' escape sequence
    KEYQUEUE=[{mods:[false,false,false,false],k:''}], // lightens duties for key event handler
    Buffer=()=>({
        // cursor position
        p:0,a:[],changed:false,
        dec(n=1){this.p-=n;if(this.p<0){this.p=0;}},
        inc(n=1){this.p+=n;},
        ins(ch){ // append ch chars to position p
            this.changed=true;
            if(this.p==this.a.length){this.a.push(ch);}
            else{this.a.splice(this.p,0,ch);}
            this.inc();
        },
        del(n){ // delete n chars before (n<0) or after (n>0) cursor
            if(n==0){return;}
            if(n<0){
                if(this.p==this.a.length){for(var i=0;i<-n;++i){this.a.pop();}}
                else{this.a.splice(this.p+n,-n);}
                this.dec(-n);}
            else{
                if(this.p==this.a.length){return;}
                else{for(var i=1;i<=n;++i){this.a.splice(this.p,i);}}}
            this.changed=true;},
    }),

    Cursor=(buf)=>({
        x:0,y:0,width:0,height:0,moved:false,
        home(){this.width=c.measureText('W').width;this.height=this.width*1.5;this.x=this.width;this.y=this.width*1.5;},
        // TODO replace up(char) and dn(char) with prev(char) and next(char),
        // each of which returns an int showing how far char is from the current insert position
        up(ch='\n'){var d=buf.a.lastIndexOf(ch,buf.p-1), dd=buf.a.lastIndexOf('\n',buf.p-1);
                    if(ch==' '){d=dd<0?d:dd;}
                    this.left(buf.p-(d<0?0:d));},

        next(ch){
            var d=buf.a.indexOf(ch,buf.p+1)-(buf.p+0);
            return d<0?0:d;
        },
        prev(ch){
            var d=buf.p-buf.a.lastIndexOf(ch,buf.p-1);
            return d<0?0:d;
        },

        dn(ch='\n'){var d=buf.a.indexOf(ch,buf.p+1), dd=buf.a.indexOf('\n',buf.p+1);
                    if(ch==' '){d=Math.min(d,(dd<0?d:dd));}
                    this.right(d<0?buf.a.length-buf.p:d-buf.p);},

        right(n=1){
            while(n-->0){
                if(buf.p==buf.a.length){return;}
                this.moved=true;
                this.width=c.measureText(buf.a[++buf.p]).width;
                this.x+=this.width;
                if(this.x>c.canvas.width){this.crlf();}}},
        left(n=1){
            while(n-->0){
                if(buf.p==0){return;}
                this.moved=true;
                this.width=c.measureText(buf.a[--buf.p]).width;
                this.x-=this.width;
                if(this.x<this.width){this.x=this.width;}}},

        crlf(){this.x=this.width;this.y+=this.height;},
    }),
    buf=Buffer();
var cur=Cursor(buf); // for drawing text to the screen

var stwrite=(str)=>{for(var i=0;i<str.length;++i){buf.ins(str[i]);}};
//stwrite(img); // test a
stwrite('here are some words for you');
console.log(buf.a.join(''));

var gameloop=(now,resiz)=>{
    update(KEYQUEUE);
    if(cur.moved||buf.changed||resiz){
        cur.moved=false;
        render_text(now,cur);
        buf.changed=false;}
    requestAnimationFrame(gameloop);};

var render_text=(now,cur)=>{
    cur.home();
    c.fillStyle='#222';
    c.fillRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='lightgray';
    for(var i=0;i<buf.a.length;++i){
        if(buf.p==i){c.fillRect(cur.x, cur.y-cur.height, 1, cur.height);} // draw cursor
        var tw=c.measureText(buf.a[i]).width; // non-monospace fix!
        if(cur.y-cur.height>c.canvas.height){break;} // don't render beyond canvas
        if(buf.a[i]=='\t'){if(cur.x+tw*4+cur.width>c.canvas.width){cur.crlf();}else{cur.x+=4*tw;}}
        else if(buf.a[i]=='\n'){cur.crlf();}
        else{c.fillText(buf.a[i],cur.x,cur.y); cur.x+=tw;}
        if(cur.x+tw+cur.width>c.canvas.width){cur.crlf();}}
    if(buf.p==buf.a.length){c.fillRect(cur.x, cur.y-cur.height, 1, cur.height);}};

// udpate : [RawKey] -> BufferAction
var update=(rks)=>{
    while(rks.length){ // consume KEYQUEUE, dispatch event handlers
        var dec=decode(rks.shift()); // behead queue
        if(MODE=='normal'){
            switch(dec.code){
            case'i':MODE='insert';break;
            case'a':MODE='insert';cur.right();break;
            case'A':MODE='insert';if(buf.a[buf.p]!=='\n'){cur.dn();}break;
            case'o':MODE='insert';if(buf.a[buf.p]!=='\n'){cur.dn();}buf.ins('\n');break;
            case'O':MODE='insert';cur.up();buf.ins('\n');if(buf.p==1){cur.left();}break;
            case'b':cur.left([cur.prev(' '),cur.prev('\n')].filter(x=>x>0)[0]);break;
            case'e':
                var sp=cur.next(' ');
                var nl=cur.next('\n');
                var amt=[sp,nl].filter(x=>x>0).sort()[0];
                //console.log([sp,nl]);
                console.log(amt);
                cur.right(amt=0?0:amt);break;
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

window.onload=()=>{
    var rsz=()=>{
        c.canvas.width=c.canvas.clientWidth;
        c.canvas.height=c.canvas.clientHeight;
        c.font='24px Sans-Serif';
        window.requestAnimationFrame((now)=>gameloop(now,true));};
    rsz();
    window.onresize=rsz;
    window.onkeydown=(k)=>{
        if(k.type=='keydown'){
            // push incoming events to a queue as they occur
            k.preventDefault();
            KEYQUEUE.push({mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],k:k.code});}};};
