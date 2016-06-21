let Parser=(cur)=>{/* Convert keyboard events into Actions */
    let ParserCommand=()=>({c:'',p:''}),

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
            let fd=0;/* 'fd' escape sequence */
            switch(dec.type){
            case'print':
                cur.ins(dec.code);cur.rowcol();
                if(dec.code==='f'){this.fd=-t;}
                if(dec.code==='d'&&this.fd<0&&t+this.fd<500){cur.esc(2);}
                if(dec.code==='['&&dec.mods[1]){cur.esc(1);}/* 'C-[' */
                break;
            case'edit':
                if(dec.code==='B'){cur.del_backward();}/* backspace */
                else if(dec.code==='D'){cur.del_forward();}/* forward delete */
                break;
            case'escape':cur.esc();break;
            default:break;
            }
        },

        append_char=(d,c)=>{if(d.mods.lastIndexOf(false)>1){c.c+=d.code;}},/* append non-shifted code */

        modifier={type:'modifier',reg:/a|i/},
        motion={type:'motion',reg:/[beGhjklw$^]|gg|``|(?:[fFtT].)/},
        count={type:'count',reg:/[1-9][0-9]*/},
        object={type:'object',reg:/[wWps()<>{}\[\]"'`]/},
        operator={type:'operator',reg:/[cdy]/},
        /*double_operator={type:'double_operator',reg:/yy|dd|>>|<</}, */

        /* (string) -> [['tokentype','chars']] */
        tokenize=(cmd)=>{
            let token_types=[modifier,motion,count,object,operator],

                /* (regex,string) -> [type, match, start, length] */
                rxmatch=(typed_regex,str)=>{
                    let x=typed_regex.reg.exec(str), y=[typed_regex.type];
                    return y.concat(x?[x[0],x.index,x[0].length]:['',-1,0]);
                },

                /* ([],command) -> [[type, match, start, length]] */
                consume=(arr,str)=>{
                    let tok=token_types.map(x=>rxmatch(x,str)).filter(x=>!x[2]);
                    return(tok.length)?consume(arr.concat(tok),str.slice(tok[0][3])):arr;
                },

                ts=consume([],cmd).map(x=>[x[0],x[1]]),
                has=(str)=>!ts.length?false:ts.reduce((x,y)=>x.concat(y)).includes(str);

            /* is 'w' an object or a motion?  If it has a modifier, then it's an object. */
            if(has('motion')&&has('object')){ts=ts.filter(x=>x[0]!==(has('modifier')?'motion':'object'));}

            /* was tokenizing successful? */
            if(ts.length>0){return ts;}
            else{return [['UNKNOWN TOKEN',cmd]];}/* [['error message','offending token']] */
        },

        /* Given an array of tokens, return a multiplier (mult) and the command to perform (cmd),
           else return an error message and the original string that caused it.

           NOTE: The order of the has('foo') calls determines what type of command gets processed.
           So we have to check the optional prefixes first (e.g. [modifier] object) */
        lex=(tokens)=>{
            let err={tokens:tokens,error:'PARSE ERROR'},/* default error message */
                cmd={verb:'g',mult:1,original:tokens.map(x=>x[1]).reduce((x,y)=>x.concat(y))},
                has=(str)=>{err.who=str;return(tokens.map(x=>x.includes(str)).some(x=>x));},
                fs={
                    count(t){cmd.mult*=parseInt(t,10);},
                    modifier(t){cmd.mod=t;},
                    operator(t){cmd.verb=t;},
                    motion(t){cmd.noun=t;},
                    object(t){cmd.noun=t;},
                },

                p=(x,y)=>{
                    let t=tokens[y.i], optional=x.endsWith('?'), z=optional?x.slice(0,-1):x;
                    if(t&&t[0]===z){fs[z](t[1]);++y.i;return true;}
                    else{return optional;}
                },

                q=(x)=>{
                    let idx={i:0}, ans=true;
                    x.split(' ').forEach(x=>{
                        let or=x.split('|');
                        if(or.length>1){ans&=or.map(x=>p(x,idx)).some(x=>x);}
                        else{ans&=p(x,idx);}
                    });
                    return ans;
                };

            /* Tokenizer error, return early. */
            if(has('UNKNOWN TOKEN')){err.error='TOKENIZER ERROR';return err;}

            /* [count] operator [count] modifier object */
            else if(has('modifier')){return(q('count? operator count? modifier object')?cmd:err);}

            /* [count] operator [count] (motion|object) */
            else if(has('operator')){return q('count? operator count? motion|object')?cmd:err;}

            /* [count] motion */
            else if(has('motion')){return q('count? motion')?cmd:err;}

            /* [count] object */
            else if(has('object')){return q('count? object')?cmd:err;}

            /* No matching rule, return error. */
            else{err.who='NO MATCH';return err;}
        },

        mode_change={
            'i':cur.insert_mode,
            'I':cur.insert_bol,
            'a':cur.append_mode,
            'A':cur.append_eol,
        },

        verbs={
            'c':'change',
            'd':'delete',
            'y':'copy',
            'g':cur.move
        },

        nouns={
            /* move */
            'h':cur.left,
            'j':cur.down,
            'k':cur.up,
            'l':cur.right,
            'e':cur.forward_word,
            'b':cur.backward_word,
            '}':cur.forward_paragraph,
            '{':cur.backward_paragraph,
            '$':cur.to_eol,
            '0':cur.to_bol,
            'gg':cur.to_bob,
            'G':cur.to_eob,
            /* edit */
            /* TODO 'yy':cur.yank_line, */
            'D':cur.del_to_eol,
            'x':cur.del_at_point,
            'dd':cur.delete_line,
        },

        /* Turn a parsed expression into a function call with arguments. */
        evaluate=(tree)=>{
            let range={mult:tree.mult, noun:nouns[tree.noun], mod:tree.mod};
            if(tree.verb==='g'){verbs[tree.verb].call(cur,nouns[tree.noun],tree.mult,1);}
            else{
                /* change: copy, delete, move cursor, insert. */
                /* delete: copy, delete, move cursor. */
                /* yank:   copy. */
                /*verbs[tree.verb].call(cur,range); */
                console.log(JSON.stringify([verbs[tree.verb],range],null,0));
            }
        };

    return ({
        cmd:ParserCommand(),
        parse(t,dec){
            if(dec.type==='arrow'){arrow(dec);}/* parse arrows in any mode */
            else if(cur.mode==='insert'){insert(t,dec);}/* ignoring '[count] insert [esc esc]' mode */
            else{
                append_char(dec,this.cmd);/* build the command 1 char at a time */
                if(nouns[this.cmd.c]){cur.move(nouns[this.cmd.c],1,1); this.cmd.c='';}
                else if(mode_change[this.cmd.c]!==undefined){mode_change[this.cmd.c].call(cur); this.cmd.c='';}
                else if([motion,object].some(x=>x.reg.test(this.cmd.c))){
                    let lexed=lex(tokenize(this.cmd.c));
                    if(lexed.error){console.log(JSON.stringify(lexed,null,4));}
                    else{evaluate(lexed);}
                    this.cmd={c:'',p:this.cmd.c};/* keep last command in history; clear current one */
                }
            }
        }
    });
};
