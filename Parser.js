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

        tokenize=(cmd)=>{// assume cmd already contains a motion or object
            var token_types=[modifier,motion,count,object,operator],
                rxmatch=(ro,s)=>{// (regex,string) -> [type, match, start, length]
                    var x=ro.reg.exec(s),y=[ro.type];
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
            // disambiguate between object-w and motion-w
            if(flat.includes('motion')&&flat.includes('object')){
                ts=ts.filter(x=>x[0]!==(flat.includes('modifier')?'motion':'object'));
            }
            return ts;// [['type','chars']]
        },

        modifier={type:'modifier',reg:/a|i/}, // [count] operator [count] modifier object
        motion={type:'motion',reg:/[beGhjklw$^]|gg|``|(?:[fFtT].)/}, // [count] motion
        count={type:'count',reg:/[1-9][0-9]*/},
        object={type:'object',reg:/[wWps()<>{}\[\]"'`]/},// [count] object
        operator={type:'operator',reg:/[cdy]/}, // [count] operator [count] (motion|object)
        double_operator={type:'double_operator',reg:/yy|dd|>>|<</},
        repeated_motion={type:'repeated_motion',reg:RegExp('('+count.reg.source+')('+motion.reg.source+')')},
        repeated_object={type:'repeated_object',reg:RegExp('('+count.reg.source+')('+object.reg.source+')')},

        lex=(raw_tokens)=>{
            var mult=1,cmd=[],tokens=raw_tokens.slice(),
                original=raw_tokens.map(x=>x[1]).reduce((x,y)=>x.concat(y)),
                err={original:original,error:'PARSE ERROR'},
                has=(str)=>tokens.map(x=>x.includes(str)).some(x=>x);

            // [count] operator [count] modifier object
            if(has('modifier')){
                var t=tokens.shift();
                if(t[0]==='count'){mult*=parseInt(t[1],10);t=tokens.shift();}
                if(t[0]==='operator'){cmd.push(t[1]);t=tokens.shift();}else{return err;}
                if(t[0]==='count'){mult*=parseInt(t[1],10);t=tokens.shift();}
                if(t[0]==='modifier'){cmd.push(t[1]);t=tokens.shift();}else{return err;}
                if(t[0]==='object'){cmd.push(t[1]);if(t=tokens.shift()){return err;}}else{return err;}
            }

            // [count] operator [count] (motion|object)
            else if(has('operator')){
                var t=tokens.shift();
                if(t[0]==='count'){mult*=parseInt(t[1],10);t=tokens.shift();}
                if(t[0]==='operator'){cmd.push(t[1]);t=tokens.shift();}else{return err;}
                if(t[0]==='count'){mult*=parseInt(t[1],10);t=tokens.shift();}
                if(t[0]==='motion'){cmd.push(t[1]);if(t=tokens.shift()){return err;};}
                else if(t[0]==='object'){cmd.push(t[1]);if(t=tokens.shift()){return err;}}else{return err;}
            }

            // [count] motion
            else if(has('motion')){
                var t=tokens.shift();
                if(t[0]==='count'){mult*=parseInt(t[1],10);t=tokens.shift();}
                if(t[0]==='motion'){cmd.push(t[1]);if(t=tokens.shift()){return err;}}else{return err;}
            }

            // [count] object
            else if(has('object')){
                var t=tokens.shift();
                if(t[0]==='count'){mult*=parseInt(t[1],10);t=tokens.shift();}
                if(t[0]==='object'){cmd.push(t[1]);if(t=tokens.shift()){return err;}}else{return err;}
            }

            return{
                original:original,
                mult:mult,
                cmd:cmd,
            };
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
                    if([motion,object].some(x=>x.reg.test(this.cmd.c))){

                        // tokenize
                        var tokens=tokenize(this.cmd.c);
                        console.log(JSON.stringify(lex(tokens),null,0));

                        // parse the command
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
