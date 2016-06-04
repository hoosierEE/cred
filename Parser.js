/* motion: [repeat] (h|j|k|l|w|e|b|...)
   operator: [repeat] (c|d|y)
   text_obj: [repeat] modifier (w|W|p|s|(|)|{|}|"|'|`)
   rule: operator (motion|text_obj)
   e.g: 5d2w = (repeat-five-times (delete (repeat-two-times (word-forward))))
*/
var Parser=(cur)=>{/* Convert keyboard events into Actions */
    var ParserCommand=()=>({c:'',p:''}),// current, previous

        arrow=(dec)=>{
            switch(dec.code){
            case'D':cur.down(1);break;
            case'U':cur.up(1);break;
            case'R':cur.right(1,true);break;
            case'L':cur.left(1,true);break;
            default:break;
            }
        },

        insert=(dec,t)=>{
            switch(dec.type){
            case'print':
                cur.ins(dec.code);cur.rowcol();
                // auxiliary escape methods: quickly type 'fd', or use the chord 'C-['
                if(dec.code==='f'){cur.fd=-t;}if(dec.code==='d'&&cur.fd<0&&t+cur.fd<500){cur.esc(2);}
                if(dec.code==='['&&dec.mods[1]){cur.esc(1);}//del_backward();cur.mode='normal';cur.left(1);}
                break;
            case'edit':
                if(dec.code==='B'){cur.del_backward();}// backspace
                else if(dec.code==='D'){cur.del_forward();}// forward delete
                break;
            case'escape':cur.esc();break;
            default:break;
            }
        },

        single_token=(dec,repeats=1)=>{
            for(var i=0;i<repeats;++i){
                switch(dec.code){
                    // motions
                case'j':cur.down(1);break;
                case'k':cur.up(1);break;
                case'l':cur.right(1);break;
                case'h':cur.left(1);break;
                case'0':cur.to_bol();break;
                case'$':cur.to_eol();break;
                case'{':cur.backward_paragraph();break;
                case'}':cur.forward_paragraph();break;
                case'G':cur.to_eob();break;
                case'b':cur.backward_word();break;
                case'e':cur.forward_word();break;
                    // mode changers
                case'i':cur.insert_mode();break;
                case'a':cur.append_mode();break;
                    // editing actions
                case'x':cur.del_at_point();break;
                case'D':cur.del_to_eol();break;
                default:break;
                }
            }
            //case' ':console.log('SPC-');break;// TODO SPC-prefixed functions a-la Spacemacs!
        },

        append_non_chord=(d,c)=>{if(!(d.mods[0]||d.mods[1]||d.mods[2])){c.c+=d.code;}},

        /* command tokenizers */
        modifier=/a|i/,
        motion=/[beGhjklw$0^]/,
        multiplier=/[1-9][0-9]*/g,
        object=/[wWps(){}\[\]"'`]/,
        operator=/[cdy]/,

        tokenize=(cmd,is_obj)=>{
            var t={};
            t.times=cmd.match(multiplier)||[1];
            t.oper=cmd.search(operator);
            if(is_obj){t.modifier=cmd.search(modifier);t.txt_obj=cmd.search(object);}
            return t;
        };

    return ({
        cmd:ParserCommand(),
        parse(t,dec){
            if(dec.type==='arrow'){arrow(dec);}// parse arrows in any mode
            if(cur.mode==='insert'){insert(dec,t);}
            else{
                append_non_chord(dec,this.cmd);// build the command 1 char at a time
                console.log(this.cmd);

                // if the command ends in a text object or motion, parse the command
                if(this.cmd.c==='i'){cur.insert_mode(); this.cmd={c:'',p:this.cmd.c};}
                else if(this.cmd.c==='a'){cur.append_mode(); this.cmd={c:'',p:this.cmd.c}; 
                }
                else{
                    var [mo,ob]=[motion,object].map(a=>!!(this.cmd.c.match(a)));
                    if(mo||ob){

                        // tokenize
                        var tokens=tokenize(this.cmd.c,ob);
                        console.log(JSON.stringify(tokens));

                        // parse the command, consume the cmd string
                        if(tokens.times.length<2){single_token(dec,tokens.times.pop())}
                    }
                    // clean up
                    this.cmd={c:'',p:this.cmd.c};
                }
            }
        }
    });
};
