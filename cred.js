'use strict';
var c=document.getElementById('c').getContext('2d'),
    p=document.getElementById('p').getContext('2d'),
    MODE='normal', // Vim modes include
    ESC_FD=0, // 'fd' escape sequence
    KEYQ=[{mods:[false,false,false,false],k:''}], // lightens duties for key event handler

    // a string with a cursor
    Buffer=()=>({
        // cursor position
        p:0,a:'',changed:false,
        ins(ch){// insert ch at p then move p ch spaces to right
            this.changed=true;
            if(this.p==this.a.length){this.a=this.a+ch;}
            else{
                var fst=this.a.slice(0,this.p);// upto p, exclusive
                var snd=this.a.slice(this.p);// from p to end
                this.a=fst+ch+snd; // this.a.substr(0,this.p)+ch+this.a.substr(this.p);
            }
            this.mov(ch.length);
        },

        del(n){// starting at point, remove n chars to its right
            if(n==0){return;}
            this.changed=true;
            var fst,snd;
            if(n<0){//delete left
                fst=this.a.slice(0,this.p-1);
                snd=this.a.slice(this.p-n-1);
            }
            else{//delete right
                fst=this.a.slice(0,this.p);
                snd=this.a.slice(this.p+n);
            }
            this.a=fst+snd;
            this.mov(n<0?n:0);
        },

        mov(n=1){// move the cursor
            //console.log('before mov: '+this.p);
            this.p=this.p+n;
            if(this.p<0){this.p=0;}
            if(this.p>this.a.length){this.p=this.a.length;}
            //console.log('after mov: '+this.p);
        },

    }),
    buf=Buffer();

// udpate : [RawKey] -> BufferAction
var update=(rks)=>{
    while(rks.length){ // consume KEYQ, dispatch event handlers
        var dec=decode(rks.shift()); // behead queue
        if(MODE=='normal'){
            switch(dec.code){
            case'i':MODE='insert';break;
            case'a':MODE='insert';buf.mov(1);break;
            case'h':buf.mov(-1);break;
            case'l':buf.mov(1);break;
            }
        }else if(MODE=='insert'){
            switch(dec.type){
            case'escape':MODE='normal';break;
            case'print':buf.ins(dec.code);break;
            case'edit':buf.del(dec.code=='B'?-1:1);break;
            }
        }
        if(dec.type=='arrow'){
            switch(dec.code){
            case'L':buf.mov(-1);break;
            case'R':buf.mov(1);break;
            }
        }
    }
};

var spot={x:0,y:0};

var render_cursor=(t)=>{
    p.clearRect(0,0,p.canvas.width,p.canvas.height);
    var clr=1-Math.abs(Math.cos(t/300))/2;
    p.fillStyle='rgba(20,255,255,'+clr+')';
    var ht=p.measureText('W').width;// cursor height
    var wd=p.measureText(buf.a.slice(0,buf.p)).width;// string width upto cursor
    var xt=p.measureText(buf.a[buf.p]).width;
    p.fillRect(wd+spot.x,spot.y-ht,1,ht);
};

var render_text=(t)=>{
    c.clearRect(0,0,c.canvas.width,c.canvas.height);
    c.fillStyle='#cadaba';
    var w=c.measureText(buf.a).width;
    spot.x=(c.canvas.width-w)/2;
    spot.y=c.canvas.height/2;
    c.fillText(buf.a,spot.x,spot.y);
};

var gameloop=(now,resiz)=>{
    requestAnimationFrame((now)=>gameloop(now,true));
    render_cursor(now);
    update(KEYQ);
    if(buf.changed||resiz){
        render_text(now);
        buf.changed=false;
    }
};
requestAnimationFrame((now)=>gameloop(now,true));

var rsz=()=>{
    c.canvas.width=c.canvas.clientWidth;
    c.canvas.height=c.canvas.clientHeight;
    c.font='24px Sans-Serif';
    p.canvas.width=p.canvas.clientWidth;
    p.canvas.height=p.canvas.clientHeight;
    p.font='24px Sans-Serif';
};

window.onload=()=>{
    rsz();
};

window.onresize=rsz;
window.onkeydown=(k)=>{
    if(k.type=='keydown'){// push incoming events to a queue as they occur
        k.preventDefault();
        KEYQ.push({
            mods:[k.altKey,k.ctrlKey,k.metaKey,k.shiftKey],
            k:k.code
        });
    }
};

buf.ins('cred: canvas rendered editor');

