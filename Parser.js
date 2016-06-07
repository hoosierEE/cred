/* motion: [repeat] (h|j|k|l|w|e|b|...)
   operator: [repeat] (c|d|y)
   text_obj: [repeat] modifier (w|W|p|s|(|)|{|}|"|'|`)
   rule: operator (motion|text_obj)
   e.g: 5d2w = (repeat-five-times (delete (repeat-two-times (word-forward))))
*/
var Parser=(cur)=>{/* Convert keyboard events into Actions */
    var ParserCommand=()=>({c:'',p:''}),

        arrow=(dec)=>{
            switch(dec.code){
            case'D':cur.down(1);break;
            case'U':cur.up(1);break;
            case'R':cur.right(1,true);break;
            case'L':cur.left(1,true);break;
            default:break;
            }
        },

        fd=0,// 'fd' escape sequence
        insert=(t,dec)=>{
            switch(dec.type){
            case'print':
                cur.ins(dec.code);cur.rowcol();
                if(dec.code==='f'){fd=-t;}if(dec.code==='d'&&fd<0&&t+fd<500){cur.esc(2);}// 'fd'
                if(dec.code==='['&&dec.mods[1]){cur.esc(1);}// 'C-['
                break;
            case'edit':
                if(dec.code==='B'){cur.del_backward();}// backspace
                else if(dec.code==='D'){cur.del_forward();}// forward delete
                break;
            case'escape':cur.esc();break;
            default:break;
            }
        },

        exec_atomic=(code)=>{
            var result=true;
            switch(code){
                // motions
            case'j':cur.down(1);break;
            case'k':cur.up(1);break;
            case'l':cur.right(1);break;
            case'h':cur.left(1);break;
            case'$':cur.to_eol();break;
            case'0':cur.to_bol();break;
            case'{':cur.backward_paragraph();break;
            case'}':cur.forward_paragraph();break;
            case'gg':cur.to_bob();break;
            case'G':cur.to_eob();break;
            case'b':cur.backward_word();break;
            case'e':cur.forward_word();break;
                // editing actions
            case'i':cur.insert_mode();break;
            case'a':cur.append_mode();break;
            case'x':cur.del_at_point();break;
            case'D':cur.del_to_eol();break;
                // leader key
            case' ':console.log('SPC-');break;// TODO SPC-prefixed functions a-la Spacemacs!
            default:result=false;break;
            }
            return result;
        },

        append_char=(d,c)=>{if(!(d.mods[0]||d.mods[1]||d.mods[2])){c.c+=d.code;}},// append non-shifted code

        rx=(r,s)=>{
            var res=r.exec(s);
            return res?{val:res[0],idx:res.index}:{val:-1,idx:-1};
        },

        rxall=(regex,str)=>{
            var arr,result=[];
            while((arr=regex.exec(str))!==null){result.push({val:arr[0],idx:arr.index});}
            if(!result.length){result=[{val:1,idx:-1}];}
            return result;
        },

        modifier=/a|i/,
        motion=/[beGhjklw$^]|gg/,
        multiplier=/[1-9][0-9]*/g,
        object=/[wWps(){}\[\]"'`]/,
        operator=/[cdy]/,

        /* get the tokens, not necessarily in order */
        tokenize=(cmd)=>{
            var result={
                original:cmd,
                modifier:rx(modifier,cmd),
                motion:rx(motion,cmd),
                multiplier:rxall(multiplier,cmd),
                object:rx(object,cmd),
                opeerator:rx(operator,cmd)
            };
            return result;
        };

    return ({
        cmd:ParserCommand(),
        parse(t,dec){
            if(dec.type==='arrow'){arrow(dec);}// parse arrows in any mode
            if(cur.mode==='insert'){insert(t,dec);}
            else{
                append_char(dec,this.cmd);// build the command 1 char at a time
                if(exec_atomic(this.cmd.c)){this.cmd.c='';}// short-circuit if possible
                else{/* if the command ends with a text object or motion, parse it */
                    if([motion,object].some(x=>x.test(this.cmd.c))){
                        // tokenize
                        var tokens=tokenize(this.cmd.c);
                        console.log(JSON.stringify(tokens,null,4));

                        // parse the command, consume the cmd string
                        var times=parseInt(tokens.multiplier.pop().val)||1;
                        for(var i=0;i<times;++i){exec_atomic(dec.code);}
                        this.cmd={c:'',p:this.cmd.c};// keep last command in history, clear current one
                    }
                }
            }
        }
    });
};
