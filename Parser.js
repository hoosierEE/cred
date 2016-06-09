'use strict';
/* examples
   5d2e = (repeat-five-times (delete (repeat-two-times (from cursor to end of word))))
   2de = (repeat-two-times (delete (from cursor to end of word)))
   2e = (repeat-two-times (move-cursor (from cursor to end of word))) NB. implied "move" function
   2ce = (repeat-two-times (delete (from cursor to end of word)));(enter-insert-mode)
   ya) = (copy (from open-paren before cursor, to matching close paren after cursor, including the parens themselves))
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

        insert=(t,dec)=>{
            var fd=0;// 'fd' escape sequence
            switch(dec.type){
            case'print':
                cur.ins(dec.code);cur.rowcol();
                if(dec.code==='f'){this.fd=-t;}
                if(dec.code==='d'&&this.fd<0&&t+this.fd<500){cur.esc(2);}
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

        exec_one=(code)=>{
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

        modifier={type:'modifier',regex:/a|i/},
        motion={type:'motion',regex:/[beGhjklw$^]|gg|([fFtT].)/},
        repeat={type:'repeat',regex:/[1-9][0-9]*/},
        object={type:'object',regex:/[wWps()<>{}\[\]"'`]/},
        operator={type:'operator',regex:/[cdy]/},

        tokenize=(cmd)=>{
            var token_types=[modifier,motion,repeat,object,operator],
                rxmatch=(ro,s)=>{// (regex,string) -> [type, match, start, length]
                    var x=ro.regex.exec(s),y=[ro.type];
                    return y.concat(x?[x[0],x.index,x[0].length]:['',-1,0]);
                },
                bycolumn=(i)=>(x,y)=>x[i]<y[i]?-1:((x[i]>y[i])?1:0),
                consume=(arr,str)=>{/* build array of tokens until no match */
                    var tok=token_types.map(x=>rxmatch(x,str)).filter(x=>!x[2]);// first match
                    return(tok.length)?consume(arr.concat(tok),str.slice(tok[0][3])):arr;
                },
                hastype=(arr,type)=>arr.filter(x=>x[0]===type),
                ts=consume([],cmd).map(x=>[x[0],x[1]]),
                flat=ts.reduce((x,y)=>x.concat(y));
            // if the resulting array has both an object and a motion, remove the (modifier?motion:object)
            if(flat.includes('motion')&&flat.includes('object')){
                ts=ts.filter(x=>x[0]!==(flat.includes('modifier')?'motion':'object'));
            }
            return ts;
        },

        tree=(tokens)=>{
            // example:
            // test example sentence  with some normal words and a a a a a a bunch of short ones
            // 2y3e => test example sentence  with some normal
            //        (test example sentence)(with some normal) // yanked: (2 groups of (3e))
            var stack=[];
            tokens.slice().reverse().forEach(x=>{
                if(/object|motion/.test(x[0])){stack.push(x);}// noun
                if(/operator|modifier|repeat/.test(x[0])){stack.push(x.concat([stack.pop()]));}// verb
            });
            return stack;
        };

    return ({
        cmd:ParserCommand(),
        parse(t,dec){
            if(dec.type==='arrow'){arrow(dec);}// parse arrows in any mode
            if(cur.mode==='insert'){insert(t,dec);}
            else{
                append_char(dec,this.cmd);// build the command 1 char at a time
                if(exec_one(this.cmd.c)){this.cmd.c='';}// short-circuit if possible
                else{/* if the command contains a text object or motion, parse it */
                    if([motion,object].some(x=>x.regex.test(this.cmd.c))){

                        // tokenize
                        var tokens=tokenize(this.cmd.c);
                        console.log(JSON.stringify(tokens,null,2));
                        //console.log(JSON.stringify(tree(tokens),null,2));
                        console.log(JSON.stringify(tokens.slice().reverse().reduce((x,y)=>y.concat([x])),null,2));

                        // TODO: parse the command
                        // NOTE: once we have the tokens, we can apply rules, such as "rule: operator (motion|object)"
                        var times=parseInt(tokens[tokens.length-2][1]||1);
                        for(var i=0;i<times;++i){exec_one(tokens[tokens.length-1][1]);}

                        this.cmd={c:'',p:this.cmd.c};// keep last command in history, clear current one
                    }
                }
            }
        }
    });
};
