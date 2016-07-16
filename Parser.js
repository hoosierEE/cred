const Parser=(cur)=>{/* Convert keyboard events into Actions */
    const ParserCommand=()=>({c:'',p:''}),

          arrow=(dec)=>{
              switch(dec.code){
              case'D':cur.down(1);break;
              case'U':cur.up(1);break;
              case'R':dec.mods[1]?(cur.move(cur.eow,1)):(cur.right(1));break;
              case'L':dec.mods[1]?(cur.move(cur.bow,1)):(cur.left(1));break;
              default:break;
              }
          },

          insert=(t,dec)=>{
              /* FIXME: the 'fd' sequence is stupidly implemented.  It'd be better to keep track of the
                 previous N characters and, if they occur within the timeout do the <ESC> routine.
                 The current method is alright most of the time, but inflexible.  Fix later. */
              let fd=0;/* 'fd' escape sequence */
              switch(dec.type){
              case'print':
                  cur.ins(dec.code);cur.rowcol();
                  if(dec.code==='f'){this.fd=-t;}
                  if(dec.code==='d'&&this.fd<0&&t+this.fd<200){cur.esc(2);}
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
              const token_types=[modifier,motion,count,object,operator],
                    /* (regex,string) -> [type, match, start, length] */
                    rxmatch=(typed_regex,str)=>{
                        const x=typed_regex.reg.exec(str), y=[typed_regex.type];
                        return y.concat(x?[x[0],x.index,x[0].length]:['',-1,0]);
                    },
                    /* ([],command) -> [[type, match, start, length]] */
                    consume=(arr,str)=>{
                        const tok=token_types.map(x=>rxmatch(x,str)).filter(x=>!x[2]);
                        return(tok.length)?consume(arr.concat(tok),str.slice(tok[0][3])):arr;
                    },
                    has=(str)=>!ts.length?false:ts.reduce((x,y)=>x.concat(y)).includes(str);
              let ts=consume([],cmd).map(x=>[x[0],x[1]]);

              /* is 'w' an object or a motion?  If it has a modifier, then it's an object. */
              if(has('motion')&&has('object')){ts=ts.filter(x=>x[0]!==(has('modifier')?'motion':'object'));}

              /* was tokenizing successful? */
              if(ts.length>0){return ts;}
              else{return [['UNKNOWN TOKEN',cmd]];}/* [['error message','offending token']] */
          },

          /* Given an array of tokens, return a multiplier (mult) and the command to perform (cmd),
             else return an error message and the original string that caused it. */
          lex=(tokens)=>{
              const err={tokens,error:'PARSE ERROR'},
                    cmd={verb:'g',mult:1,original:tokens.map(x=>x[1]).reduce((x,y)=>x.concat(y))},
                    has=(str)=>{err.who=str;return(tokens.map(x=>x.includes(str)).some(x=>x));},
                    fs={
                        count(t){cmd.mult*=parseInt(t,10);},/* safe for ([1-9][0-9]+) */
                        modifier(t){cmd.mod=t;},
                        operator(t){cmd.verb=t;},
                        motion(t){cmd.noun=t;},
                        object(t){cmd.noun=t;},
                    },
                    p=(x,y)=>{
                        const t=tokens[y.i], opt=x.endsWith('?'), z=opt?x.slice(0,-1):x;
                        if(t&&t[0]===z){fs[z](t[1]);++y.i;return true;}
                        else{return opt;}
                    },
                    q=(x)=>{
                        let idx={i:0}, ans=true;
                        x.split(' ').forEach(x=>{
                            const or=x.split('|');
                            if(or.length>1){ans&=or.map(x=>p(x,idx)).some(x=>x);}
                            else{ans&=p(x,idx);}
                        });
                        return ans?cmd:err;
                    };

              /* NOTE: The order of the has('foo') calls determines what type of command gets processed.
                 So we have to check the opt prefixes first (e.g. [modifier] object) */

              /* Tokenizer error, bail out! */
              if(has('UNKNOWN TOKEN')){err.error='TOKENIZER ERROR';return err;}

              /* [count] operator [count] modifier object */
              else if(has('modifier')){return q('count? operator count? modifier object');}

              /* [count] operator [count] (motion|object) */
              else if(has('operator')){return q('count? operator count? motion|object');}

              /* [count] motion */
              else if(has('motion')){return q('count? motion');}

              /* [count] object */
              else if(has('object')){return q('count? object');}

              /* No matching rule, return error. */
              else{err.who='NO MATCH';return err;}
          },

          mode_changer={
              'i':cur.insert_mode,
              'I':cur.insert_bol,
              'a':cur.append_mode,
              'A':cur.append_eol,
          },

          verb={
              'c':cur.change,
              'd':cur.del,
              'g':cur.move,
              'y':cur.yank,
          },

          movement={
              'h':cur.left,
              'j':cur.down,
              'k':cur.up,
              'l':cur.right,
              'e':cur.eow,
              'b':cur.bow,
              '}':cur.eop,
              '{':cur.bop,
              '$':cur.eol,
              '0':cur.bol,
              'G':cur.eob,
              'gg':cur.bob,
          },

          editing_operation={
              // TODO 'yy':cur.yank_line,
              'D':cur.del_to_eol,
              'x':cur.del_at_point,
              'dd':cur.delete_line,
          },

          /* Turn a parsed expression into a function call with arguments. */
          evaluate=(lx)=>{
              if(lx.verb==='g'){verb[lx.verb].call(cur,movement[lx.noun],lx.mult);}
              else{verb[lx.verb].call(cur,lx);}
          };

    return ({
        cmd:ParserCommand(),
        parse(t,dec){
            if(dec.type==='arrow'){arrow(dec);}/* parse arrows in any mode */
            else if(cur.mode==='insert'){insert(t,dec);}/* ignoring '[count] insert [esc esc]' mode */
            else{
                append_char(dec,this.cmd);/* build the command 1 char at a time */
                if(movement[this.cmd.c]){
                    cur.move(movement[this.cmd.c],1);
                    this.cmd.c='';
                }
                else if(mode_changer[this.cmd.c]){
                    mode_changer[this.cmd.c].call(cur);
                    this.cmd.c='';
                }
                else if([motion,object].some(x=>x.reg.test(this.cmd.c))){
                    const lexed=lex(tokenize(this.cmd.c));
                    if(lexed.error){console.log(JSON.stringify(lexed,null,4));}
                    else{evaluate(lexed);}

                    /* keep last command in history; clear current one */
                    this.cmd={c:'',p:this.cmd.c};
                }
            }
        }
    });
};
