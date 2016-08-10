"use strict";
/*TODO: file i/o */

/* Buffer -- A line-oriented view of a String, with an insertion point.
   Editing operations (such as insert and delete) automatically update line numbers. */

const Buffer=(s='')=>({/* s refers to a mutable string, such as textarea.value */
    /* STATE */
    pt:0,
    lines:[0],
    /* METHODS */
    getline(n){/* getline : Int -> String -- the Nth line, not including any trailing newline */
        const l=this.lines,len=l.length;
        if(0<n&&n<len){return s.slice(l[n]+1,l[n+1]);}/* line in middle */
        else if(n===0){return s.slice(0,l[1]);}/* first */
        else if(n>=len){return s.slice(1+l[len-1]);}/* last */
        else{return this.getline(Math.max(0,len+n));}/* negative n indexes backwards but doesn't wrap */
    },
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
    /* hue, saturation, lightness */
    color:{
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

/* Globals (includes UX) */
const Keyq=[{k:'',mods:{all:'0000',code:0}}],/* lightens duties for key event handler */
      Mouseq={wheel:[],dtxy:[{dt:0,dx:0,dy:0}]},
      Command={
          p:'', /* previous command string */
          c:'', /* current command string */
          dt:0, /* time delta between current and previous commands */
          valid:false, /* when true, this Command can become an Action */
          macro:'',
      };

/* Instance variables for core program. */
const cfg=Config(),
      buf=Buffer(),
      cur=Cursor(buf);


window.onload=()=>{
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
        /* consume inputs */
        while(Keyq.length){
            /* preventDefault for everything except Cmd+Option+i (Mac) or Ctrl+I (Chrome OS) */
            console.log(Keyq.length);
            console.log(JSON.stringify(Keyq.shift(),null,2));
            /* parse : timestamp -> DecodedKey -> Command -> Action */
            //parse(now,decode(Keyq.shift()),Command);
        }
        while(Mouseq.wheel.length){
            const wheel=Mouseq.wheel.shift();
            if(wheel<0){cur.up(-wheel%win.line_height|0);}
            else{cur.down(wheel%win.line_height|0);}
        }
        /* painting -- render_text(), render_cursor(), etc. */
        /* other ideas: render_minimap(); render_statusline(); render_popups(); */
    };

    const rsz=()=>{
        cfg.init(c);
        requestAnimationFrame(gameloop);
    };

    /* events */
    window.onresize=rsz;
    window.onmousewheel=(ev)=>{
        Mouseq.wheel.push(ev.deltaY);
        requestAnimationFrame(gameloop);
    };
    window.onkeyup=(key)=>{};
    window.onkeydown=(key)=>{
        const all_modifiers=[key.altKey,key.ctrlKey,key.metaKey,key.shiftKey].map(x=>~~x).join(''), /* '0010' === Meta */
              hex_mod_code=parseInt(all_modifiers,2);
        Keyq.push({
            k:key.code,
            mods:{all:all_modifiers,code:hex_mod_code},
        });
        requestAnimationFrame(gameloop);
    };

    document.body.style.backgroundColor=cfg.get('base');
    rsz();
};
