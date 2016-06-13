'use strict';
/* examples
   5d2e = (count-five-times (delete (count-two-times (from cursor to end of word))))
   2de = (count-two-times (delete (from cursor to end of word)))
   2e = (count-two-times (move-cursor (from cursor to end of word))) NB. implied "move" function
   2ce = (count-two-times (delete (from cursor to end of word)));(enter-insert-mode)
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
                //case'dd':cur.delete_line();break;
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

        modifier={type:'modifier',reg:/a|i/},
        motion={type:'motion',reg:/[beGhjklw$^]|gg|``|(?:[fFtT].)/},
        count={type:'count',reg:/[1-9][0-9]*/},
        object={type:'object',reg:/[wWps()<>{}\[\]"'`]/},
        operator={type:'operator',reg:/[cdy]/},
        //double_operator={type:'double_operator',reg:/yy|dd|>>|<</},

        /* Given a string (cmd), return an array of tokens (ts). */
        tokenize=(cmd)=>{
            var token_types=[modifier,motion,count,object,operator],
                rxmatch=(typed_regex,str)=>{// (regex,string) -> [type, match, start, length]
                    var x=typed_regex.reg.exec(str), y=[typed_regex.type];
                    return y.concat(x?[x[0],x.index,x[0].length]:['',-1,0]);
                },
                consume=(arr,str)=>{// ([],command) -> [[type, match, start, length]]
                    var tok=token_types.map(x=>rxmatch(x,str)).filter(x=>!x[2]);
                    return(tok.length)?consume(arr.concat(tok),str.slice(tok[0][3])):arr;
                },
                ts=consume([],cmd).map(x=>[x[0],x[1]]),
                has=(str)=>!ts.length?false:ts.reduce((x,y)=>x.concat(y)).includes(str);

            // is 'w' an object or a motion?  If it has a modifier, then it's an object.
            if(has('motion')&&has('object')){ts=ts.filter(x=>x[0]!==(has('modifier')?'motion':'object'));}

            // was tokenizing successful?
            if(ts.length>0){return ts;}// [['tokentype','chars']], in order that they were typed
            else{return [['UNKNOWN TOKEN',cmd]];}// [['error message','offending token']]
        },

        /* Given an array of tokens, return a multiplier (mult) and the command to perform (cmd),
           else return an error message and the original string that caused it.
           The order of the has('foo') calls determines what type of command gets processed.
           So we have to check the optional prefixes first (e.g. [modifier] object)
        */
        lex=(tokens)=>{
            var cmd={verb:'g',mult:1,original:tokens.map(x=>x[1]).reduce((x,y)=>x.concat(y)),},
                err={original:tokens,error:'PARSE ERROR'},// default error message
                has=(str)=>tokens.map(x=>x.includes(str)).some(x=>x);

            // NOTE: this function is sort of hideous

            // error
            if(has('UNKNOWN TOKEN')){err.error='TOKENIZER ERROR';return err;}

            // [count] operator [count] modifier object
            else if(has('modifier')){
                var t=tokens.shift();
                if(t[0]==='count'){cmd.mult*=parseInt(t[1],10);t=tokens.shift();}
                if(t[0]==='operator'){cmd.verb=t[1];t=tokens.shift();}else{return err;}
                if(t[0]==='count'){cmd.mult*=parseInt(t[1],10);t=tokens.shift();}
                if(t[0]==='modifier'){cmd.mod=t[1];t=tokens.shift();}else{return err;}
                if(t[0]==='object'){cmd.noun=t[1];if(t=tokens.shift()){return err;}}else{return err;}
                return cmd;
            }

            // [count] operator [count] (motion|object)
            else if(has('operator')){
                var t=tokens.shift();
                if(t[0]==='count'){cmd.mult*=parseInt(t[1],10);t=tokens.shift();}
                if(t[0]==='operator'){cmd.verb=t[1];t=tokens.shift();}else{return err;}
                if(t[0]==='count'){cmd.mult*=parseInt(t[1],10);t=tokens.shift();}
                if(t[0]==='motion'){cmd.noun=t[1];if(t=tokens.shift()){return err;};}
                else if(t[0]==='object'){cmd.noun=t[1];if(t=tokens.shift()){return err;}}else{return err;}
                return cmd;
            }

            // [count] motion
            else if(has('motion')){
                var t=tokens.shift();
                if(t[0]==='count'){cmd.mult*=parseInt(t[1],10);t=tokens.shift();}
                if(t[0]==='motion'){cmd.noun=t[1];if(t=tokens.shift()){return err;}}else{return err;}
                return cmd;
            }

            // [count] object
            else if(has('object')){
                var t=tokens.shift();
                if(t[0]==='count'){cmd.mult*=parseInt(t[1],10);t=tokens.shift();}
                if(t[0]==='object'){cmd.noun=t[1];if(t=tokens.shift()){return err;}}else{return err;}
                return cmd;
            }
            else{return err;}
        },

        /* Turn a parsed expression into a function call with arguments. */
        evaluate=(tree)=>{
            var verbs={c:'change', d:'delete', y:'copy', g:cur.move},
                nouns={
                    'h':cur.left,
                    'j':cur.down,
                    'k':cur.up,
                    'l':cur.right,
                    'e':cur.forward_word,
                    'b':cur.backward_word,
                    '}':cur.forward_paragraph,
                    '{':cur.backward_paragraph,
                },
                range={
                    mult:tree.mult,
                    noun:nouns[tree.noun],
                    mod:tree.mod
                };
            if(tree.verb==='g'){verbs[tree.verb].call(cur,range.noun,1,range.mult);}
            else{
                // yank: copy range
                // delete, change: then cur.del(range)
                // change: goto insert mode
                verbs[tree.verb].call(cur,range);
            }
            console.log(JSON.stringify({verb:verbs[tree.verb],args:range},null,3));
        };

    return ({
        cmd:ParserCommand(),
        parse(t,dec){
            if(dec.type==='arrow'){arrow(dec);}// parse arrows in any mode
            if(cur.mode==='insert'){insert(t,dec);}// ignoring '[count] insert [esc esc]' mode
            else{
                append_char(dec,this.cmd);// build the command 1 char at a time
                if(exec_one(this.cmd.c)){this.cmd.c='';}// short-circuit if possible
                else{// if the command contains a text object or motion, parse it
                    if([motion,object].some(x=>x.reg.test(this.cmd.c))){
                        var tokens=tokenize(this.cmd.c),
                            lexed=lex(tokens);

                        if(lexed.error){console.log(JSON.stringify(lexed,null,4));}
                        else{
                            //console.log(JSON.stringify(lexed,null,0));
                            //console.log(JSON.stringify(evaluate(lexed),null,4));
                            evaluate(lexed);
                        }

                        // keep last command in history, clear current one
                        this.cmd={c:'',p:this.cmd.c};
                    }
                }
            }
        }
    });
};
