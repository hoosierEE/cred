var Parser=(cur)=>{/* Convert keyboard events into Actions */
    var ParserCommand=()=>({current:'',previous:''}),

        parse_arrow=(dec)=>{
            switch(dec.code){
            case'D':cur.down(1);break;
            case'U':cur.up(1);break;
            case'R':cur.right(1,true);break;
            case'L':cur.left(1,true);break;
            default:break;
            }
        },

        parse_insert=(dec,t)=>{
            switch(dec.type){
            case'print':
                cur.ins(dec.code);cur.rowcol();
                // auxiliary escape methods: quickly type 'fd' or use the chord 'C-['
                if(dec.code==='f'){cur.fd=-t;}
                if(dec.code==='d'&&cur.fd<0&&t+cur.fd<500){cur.esc_fd();}
                if(dec.code==='['&&dec.mods[1]){cur.del_backward();cur.mode='normal';cur.left(1);}
                break;
            case'edit':
                if(dec.code==='B'){cur.del_backward();}// backspace
                else if(dec.code==='D'){cur.del_forward();}// forward delete
                break;
            case'escape':cur.normal_mode();break;
            default:break;
            }
        },

        parse_single=(dec,repeats=1)=>{
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

        /* command tokenizers */
        multiplier=/[1-9][0-9]*/g,
        modifier=/a|i/,
        operator=/[cdy]/,
        motion=/[beGhjklw$^]/,
        object=/[wWps(){}\[\]"'`]/,
        find_all=(r,s)=>{var m,res=[];while((m=r.exec(s))!==null){res.push(m)}r.lastIndex=0;return res;},
        tokenize=(cmd,is_motion)=>{/* tokenize a command ending with a motion */
            var t={times:[]};
            var m;
            t.times=find_all(multiplier,cmd).map(a=>parseInt(a,10));
            //while((m=multiplier.exec(cmd))!==null){t.times.push(parseInt(m,10));}multiplier.lastIndex=0;
            t.oper=cmd.search(operator);
            if(is_motion){t.move=cmd.search(motion);}
            else{
                t.modifier=cmd.search(modifier);
                t.object=cmd.search(object);
            }
            return t;
        };

    return ({
        cmd:ParserCommand(),/* current, previous command */
        reset(){this.cmd=ParserCommand();},
        parse(t,dec){/* parse : DecodedKey -> Action Cursor */
            /* motion: [repeat] (h|j|k|l|w|e|b|...)
               operator: [repeat] (c|d|y)
               text_obj: [repeat] modifier (w|W|p|s|(|)|{|}|"|'|`)
               rule: operator (motion|text_obj)
               e.g: 5d2w = (repeat-five-times (delete (repeat-two-times (word-forward))))
            */
            if(cur.mode==='insert'){parse_insert(dec,t);}
            else{
                // only append non-chords
                if(!(dec.mods[0]||dec.mods[1]||dec.mods[2])){this.cmd.current+=dec.code;}

                var mo=this.cmd.current.search(motion),
                    ob=this.cmd.current.search(object);
                if(mo>=0||ob>=0){
                    var tokens=tokenize(this.cmd.current,(mo>=0));
                    console.log(JSON.stringify(tokens));

                    // clean up
                    this.cmd.previous=this.cmd.current;
                    this.cmd.current='';
                }
                if(cur.mode==='normal'){parse_single(dec);}
                // if(cur.mode==='visual'){TODO}
            }
            if(dec.type==='arrow'){parse_arrow(dec);}// parse arrows regardless of Cursor mode
        }
    });
};
