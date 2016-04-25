// decode : RawKey -> DecodedKey
var decode=(rk)=>{
    var k=rk.k, mods=rk.mods; // get the components of the KeyStack
    var dec={type:'',code:'',mods:mods}; // return type (modifiers pass through)
    // printable
    if(k=='Space'){dec.code=' ';}
    else{var shft=mods[3];
         var ma=k.slice(-1); // maybe alphanumeric
         var kd=k.slice(0,-1);
         if(kd=='Key'){dec.code=shft?ma:ma.toLowerCase();}
         else if(kd=='Digit'){dec.code=shft?")!@#$%^&*("[ma]:ma;}
         else if(k=='Tab'){dec.code='\t';}
         else if(k=='Enter'){dec.code='\n';}
         else{var pun=['Comma',',','<','Quote',"'",'"','Equal','=','+','Minus','-','_'
                       ,'Slash','/','?','Period','.','>','Semicolon',';',':','Backslash','\\','|'
                       ,'Backquote','`','~','BracketLeft','[','{','BracketRight',']','}'];
              var pid=pun.indexOf(k);
              if(pid>=0){dec.code=pun[pid+(shft?2:1)];}}}
    // non-printable
    if(dec.code.length>0){dec.type='print';}
    else{if(k=='Backspace'||k=='Delete'){dec.type='edit';dec.code=k[0];} // 'b','d'
        else if(k=='Escape'){dec.type='escape';} // '' (should still be an empty string)
        else if(k.slice(0,5)=='Arrow'){dec.type='arrow';dec.code=k[5];} // 'u','d','l','r'
        else if(k.slice(0,4)=='Page'){dec.type='page';dec.code=k[4];} // 'u','d'
        else if(k=='Home'||k=='End'){dec.type='page';dec.code=k[0];}} // 'h','e'
    return dec;};

// udpate : [RawKey] -> BufferAction
var update=(rks,t)=>{
    while(rks.length){// consume KEYQ, dispatch event handlers
        var dec=decode(rks.shift());// behead queue
        if(MODE=='normal'){
            switch(dec.code){
            case'i':MODE='insert';buf.insert_mode();break;
            case'a':MODE='insert';buf.append_mode();;break;
            case'b':buf.mov(-2);break;
            case'e':buf.mov(2);break;
            case'h':buf.mov(-1);break;
            case'l':buf.mov(1);break;
            case' ':console.log('SPC-');break;// hmm...
            }
        }else if(MODE=='insert'){
            switch(dec.type){
            case'escape':MODE='normal';break;
            case'print':
                buf.ins(dec.code);
                if(dec.code=='f'){ESC_FD=-t;}
                if(dec.code=='d'&&ESC_FD<0&&t+ESC_FD<500){MODE='normal';buf.del(-2);}break;
            case'edit':buf.del(dec.code=='B'?-1:1);break;
            }
        }
        if(dec.type=='arrow'){//all modes support arrows in the same way
            switch(dec.code){
            case'L':buf.mov(-1);break;
            case'R':buf.mov(1);break;
            }
        }
    }
};
