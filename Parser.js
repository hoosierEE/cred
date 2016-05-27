var ParserCommand=()=>({mul:'',verb:'',mod:'',state:[''],current:'',prev_cmd:{}}),
    Parser=(cur)=>({// class
        /* Convert keyboard events into Action Cursor */
        // STATE
        cmd:{},// current and previous command

        // METHODS
        init(){this.cmd=ParserCommand();},

        modifier:/a|i/,
        multiplier:/[1-9][0-9]*/,
        operator:/[cdy]/,
        motion:/[beGhjklw$^]/,

        parse(t,dec){// parse : DecodedKey -> Action Cursor
            /* if(cur.mode!=='insert'){
               if(!(dec.mods[0]||dec.mods[1]||dec.mods[2])){this.cmd.current+=dec.code;}// ignore chords
               var op=this.cmd.current.search(this.operator),
               mo=this.cmd.current.search(this.motion);
               // rule : [multiplier] motion
               // rule : [multiplier] operator
               // rule : [mul] operator [mul] motion  // e.g. 2d5w (twice (delete 5 words forward))
               // terminal commands: motion, text objects
               // IDEA: stack commands blindly until a terminal command appears, then parse!
               if(op<mo){}
               else{this.cmd.current='';}
               console.log('cur: '+this.cmd.current);
               }
               else */if(cur.mode==='normal'){
                   switch(dec.code){
                       // simple (1-argument) motions
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
                       // simple (1-argument) editing actions
                   case'x':cur.del_at_point();break;
                   case'D':cur.del_to_eol();break;
                   case' ':console.log('SPC-');break;// TODO SPC-prefixed functions a-la Spacemacs!
                       // TODO complex (>1 argument) commands
                   default:break;
                   }
               }
            else if(cur.mode==='insert'){
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
                }
            }
            if(dec.type==='arrow'){// all modes support arrows in the same way
                switch(dec.code){
                case'D':cur.down(1);break;
                case'U':cur.up(1);break;
                case'R':cur.right(1,true);break;
                case'L':cur.left(1,true);break;
                }
            }
        },
    });

