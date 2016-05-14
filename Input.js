// udpate : [RawKey] -> BufferAction
var update=(rks,t)=>{
    while(rks.length){// consume KEYQ, dispatch event handlers
        var dec=decode(rks.shift());// behead queue
        if(cur.mode==='normal'){
            switch(dec.code){
            case'j':cur.down(1);break;
            case'k':cur.up(1);break;
            case'l':cur.right(1);break;
            case'h':cur.left(1);break;
            case'i':cur.insert_mode();break;
            case'a':cur.append_mode();break;
            case'b':cur.backward_search(/\W/);break;
            case'e':cur.forward_search(/\W/);break;
            case'x':buf.del(1);cur.left(1);break;
            case' ':console.log('SPC-');break;// TODO SPC-prefixed functions a-la Spacemacs!
            }
        }
        else if(cur.mode==='insert'){
            switch(dec.type){
            case'print':
                buf.ins(dec.code);cur.rowcol();
                if(dec.code==='f'){cur.fd=-t;}
                if(dec.code==='d'&&cur.fd<0&&t+cur.fd<500){cur.esc_fd();}
                break;
            case'edit':
                if(dec.code==='B'){buf.del(-1);cur.left(1,true);}// backspace
                else if(dec.code==='D'){buf.del(1);}// forward delete
                break;
            case'escape':cur.normal_mode();break;}}
        if(dec.type==='arrow'){//all modes support arrows in the same way
            switch(dec.code){
            case'D':cur.down(1);break;
            case'U':cur.up(1);break;
            case'R':cur.right(1,true);break;
            case'L':cur.left(1,true);break;}}}};


// decode : RawKey -> DecodedKey
var decode=(rk)=>{
    var k=rk.k, mods=rk.mods;// get the components of the RawKey object
    var dec={type:'',code:'',mods:mods};// return type (modifiers pass through)
    // printable
    if(k==='Space'){dec.code=' ';}
    else{var shft=mods[3];
         var ma=k.slice(-1);// maybe alphanumeric
         var kd=k.slice(0,-1);
         if(kd==='Key'){dec.code=shft?ma:ma.toLowerCase();}
         else if(kd==='Digit'){dec.code=shft?")!@#$%^&*("[ma]:ma;}
         else if(k==='Tab'){dec.code='\t';}
         else if(k==='Enter'){dec.code='\n';}
         else{var pun=['Comma',',','<','Quote',"'",'"','Equal','=','+','Minus','-','_'
                       ,'Slash','/','?','Period','.','>','Semicolon',';',':','Backslash','\\','|'
                       ,'Backquote','`','~','BracketLeft','[','{','BracketRight',']','}'];
              var pid=pun.indexOf(k);
              if(pid>=0){dec.code=pun[pid+(shft?2:1)];}}}
    // non-printable
    if(dec.code.length>0){dec.type='print';}
    else{if(k==='Backspace'||k==='Delete'){dec.type='edit';dec.code=k[0];}// 'b','d'
        else if(k==='Escape'){dec.type='escape';}// dec.code should still be an empty string ('')
        else if(k.slice(0,5)==='Arrow'){dec.type='arrow';dec.code=k[5];}// 'u','d','l','r'
        else if(k.slice(0,4)==='Page'){dec.type='page';dec.code=k[4];}// 'u','d'
        else if(k==='Home'||k==='End'){dec.type='page';dec.code=k[0];}}// 'h','e'
    return dec;};
