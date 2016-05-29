var Parser=(cur)=>{/* Convert keyboard events into Actions */
    var modifier=/a|i/,
        multiplier=/[1-9][0-9]*/,
        operator=/[cdy]/,
        motion=/[beGhjklw$^]/,

        parse_arrow=(dec)=>{
            switch(dec.code){
            case'D':cur.down(1);break;
            case'U':cur.up(1);break;
            case'R':cur.right(1,true);break;
            case'L':cur.left(1,true);break;
            default:break;
            }
        },

        parse_insert=(dec)=>{
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
        ParserCommand=()=>({current:'',previous:['']});

    return ({
        cmd:ParserCommand(),// current and previous command
        parse(t,dec){// parse : DecodedKey -> Action Cursor
            if(cur.mode==='insert'){parse_insert(dec);}
            else{
                /* rule: [multiplier] motion
                   rule: [multiplier] operator
                   rule: [mul] operator [mul] motion  // 2d5w = (repeat twice (delete (5 (words forward))))
                   // 5d2w = (repeat five times (delete (2 (words forward))))
                   Use implicit `g` (go) when `operator` is absent.
                   terminal commands: motion, text objects
                   IDEA: stack commands blindly until a terminal command (e.g. motion) appears,
                   then parse!
                */
                if(!(dec.mods[0]||dec.mods[1]||dec.mods[2])){this.cmd.current+=dec.code;}//append non-chords

                //console.log('cur: '+this.cmd.current);
                var mo=motion.exec(this.cmd.current),op,mu,md;;
                console.log('motion.exec: '+mo+', motion.lastIndex: '+motion.lastIndex);
                mo=this.cmd.current.search(motion)
                if(mo>=0){
                    op=this.cmd.current.search(operator);
                    mu=this.cmd.current.search(multiplier);
                    md=this.cmd.current.search(modifier);
                    // lastly, clear 'current' and push it to 'previous'
                    this.cmd.previous.push(this.cmd.current);
                    this.cmd.current='';
                }
                if(cur.mode==='normal'){parse_single(dec);}
                // if(cur.mode==='visual'){TODO}
            }
            if(dec.type==='arrow'){parse_arrow(dec);}// parse arrows regardless of Cursor mode
        }
    });
};
