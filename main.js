"use strict";
/*TODO: file i/o */

/* Buffer -- A line-oriented view of a String, with an insertion point.
   Editing operations (such as insert and delete) automatically update line numbers. */
const Buffer=(s='')=>({/* s refers to a mutable string, such as textarea.value */
    pt:0,
    lines:[0],

    getline(n){/* getline : Int -> String -- the Nth line, not including any trailing newline */
        const l=this.lines,len=l.length;
        if(0<n&&n<len){return s.slice(l[n]+1,l[n+1]);}/* line in middle */
        else if(n===0){return s.slice(0,l[1]);}/* first */
        else if(n>=len){return s.slice(1+l[len-1]);}/* last */
        else{return this.getline(Math.max(0,len+n));}/* negative n indexes backwards but doesn't wrap */
    },

    // TODO: This is O(n), but we could pass in a starting index, so that the counting
    // only happens after the insertion/deletion point.
    /* gen_lines : () -> [Int] -- array of line start indexes */
    gen_lines(){return[...s].reduce((x,y,i)=>{y==='\n'&&x.push(i);return x;},[0]);},

    /* insert ch chars to right of p */
    ins(ch){
        if(this.pt===s.length){s=s+ch;} /* optimized append */
        else{const fst=s.slice(0,this.pt), snd=s.slice(this.pt); s=fst+ch+snd;}
        this.pt+=ch.length;
        this.lines=this.gen_lines();
    },

    /* delete n chars to right (n>0) or left (n<0) of point */
    del(n){
        if(n===0||n+this.pt<0){return;} /* no op */
        const leftd=n<0?n:0, rightd=n<0?0:n,
              fst=s.slice(0,this.pt+leftd),
              snd=s.slice(this.pt+rightd);
        s=fst+snd;
        this.lines=this.gen_lines();
    },
});

const Cursor=(b)=>({
    cl:0,/* current line */
    co:0,/* current column */
    cx:0,/* maximum column */
    clipboard:'',
    mode:'normal',/*  TODO visual, various "minor modes" */
    /* status : () -> 'modeline' */
    status(){return this.mode+'  '+this.cl+':'+this.co;},
});

const Config=()=>({
    color:{/* hue, saturation, lightness */
        base:[270,100,98],
        font:[270,50,5],
        cursor:[270,50,80],
        status:[270,100,20],
    },
    // font size
    font:{size:'16px', name:'serif',},
    get(x){return `hsl(${(this.color[x])[0]},${(this.color[x])[1]}%,${(this.color[x])[2]}%)`},
    store(){return JSON.stringify({color:this.color,font:this.font},null,0)},/* localStorage */
    init(c){c.font=this.font.size+' '+this.font.name;},
});

/* Instance variables for core program. */
const cfg=Config(),
      buf=Buffer(),
      cur=Cursor(buf);

/* Functions */
/* decode : RawKey -> DecodedKey */
const decode=({k, mods})=>{
    const dec={type:'',code:'',mods:mods};/* return type (modifiers pass through) */
    /* printable */
    if(k==='Space'){dec.code=' ';}
    else{
        const shft=mods.code===1,
              ma=k.slice(-1),/* maybe alphanumeric */
              kd=k.slice(0,-1);
        if(kd==='Key'){dec.code=shft?ma:ma.toLowerCase();}
        else if(kd==='Digit'){dec.code=shft?")!@#$%^&*("[ma]:ma;}
        else if(k==='Tab'){dec.code='\t';}
        else if(k==='Enter'){dec.code='\n';}
        else{
            const pun=['Comma',',','<','Quote',"'",'"','Equal','=','+','Minus','-','_'
                       ,'Slash','/','?','Period','.','>','Semicolon',';',':','Backslash','\\','|'
                       ,'Backquote','`','~','BracketLeft','[','{','BracketRight',']','}'],
                  pid=pun.indexOf(k);
            if(pid>=0){dec.code=pun[pid+(shft?2:1)];}
        }
    }
    /* non-printable */
    if(dec.code.length>0){dec.type='print';}
    else{
        if(k==='Backspace'||k==='Delete'){dec.type='edit';dec.code=k[0];}/* 'b','d' */
        else if(k==='Escape'){dec.type='escape';}/* dec.code should still be an empty string ('') */
        else if(k.slice(0,5)==='Arrow'){dec.type='arrow';dec.code=k[5];}/* 'u','d','l','r' */
        else if(k.slice(0,4)==='Page'){dec.type='page';dec.code=k[4];}/* 'u','d' */
        else if(k==='Home'||k==='End'){dec.type='page';dec.code=k[0];}/* 'h','e' */
    }
    //console.log(dec);
    return dec;
};

const gameloop=(now)=>{
    /* Keyboard */
    /* preventDefault for everything except Cmd+Option+i (Mac) or Ctrl+I (Chrome OS) */
    //console.log(Keys.length);
    /* parse : timestamp -> DecodedKey -> Command -> Action */
    //parse(now,decode(Keys.shift()),Command);

    /* Mouse */
    while(Mouseq.wheel.length){
        const wheel=Mouseq.wheel.shift();
        if(wheel<0){cur.up(-wheel%win.line_height|0);}
        else{cur.down(wheel%win.line_height|0);}
    }

    /* Render */
    /* painting -- render_text(), render_cursor(), etc. */
    /* other ideas: render_minimap(); render_statusline(); render_popups(); */
};

/* Globals (includes UX) */
const Keys={
    mods:{all:'0000',code:0},
    mod_bits(k){return['altKey','ctrlKey','metaKey','shiftKey'].map(x=>~~k[x]).join('');},
};
const Mouseq={wheel:[],dtxy:[{dt:0,dx:0,dy:0}]};
const Command={
    p:'', /* previous command string */
    c:'', /* current command string */
    dt:0, /* time delta between current and previous commands */
    valid:false, /* when true, this Command can become an Action */
    macro:'',
};

const rsz=()=>{requestAnimationFrame(gameloop)};
window.onload=()=>{
    /* attach event listeners after window loads */
    window.onresize=rsz;
    window.onmousewheel=(ev)=>{
        Mouseq.wheel.push(ev.deltaY);
        requestAnimationFrame(gameloop);
    };

    /* Keyboard event handlers only need to be as fast as human can type (not fast).
       When a key is pressed, set a key's value to true.
       When released, set it false.
       Also keep an array of (timestamp,key).
    */
    window.onkeyup=(key)=>{remove_key(key)};
    window.onkeydown=(key)=>{add_key(key)};
    //    Keys.push({
    //        k:key.code,
    //        mods:{all:mod_bits,code:hex_mod_code},
    //    });
    //    requestAnimationFrame(gameloop);
    //};

    document.body.style.backgroundColor=cfg.get('base');
    cfg.init(c);
    rsz();
};
