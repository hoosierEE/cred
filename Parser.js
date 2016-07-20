/* Parser -- Convert keyboard events into cursor-based Actions */
const Parser=(cur)=>{
    const Command=({p:'',c:''}),

          /* arrow : DecodedKey -> Action Move */
          arrow=(dec)=>{
              switch(dec.code){
              case'D':cur.down();break;
              case'U':cur.up();break;
              case'R':dec.mods[1]?(cur.move(cur.eow)):(cur.right());break;
              case'L':dec.mods[1]?(cur.move(cur.bow)):(cur.left());break;
              }
          },

          /* insert : timestamp -> [DecodedKey] -> Action Insert */
          insert=(t,dec)=>{
          },

          append_char=(d,c)=>{if(d.mods.lastIndexOf(true)>1){c.c+=d.code;}},

          /* patterns : Regex */
          patterns={
              verb:/[cdy]/,
              modifier:/(a|i)/,
              motion:/[hjklG^0$]|gg||/,
              text_obj:/[eEwWbp{}()]|([tTfF].)/,
              multiplier:/[1-9][0-9]*/,
          };

    return({
        /* parse : timestamp -> DecodedKey -> Action */
        parse(t,dec){
            if(dec.type==='arrow'){arrow(dec);}
            else if(cur.mode==='insert'){insert(t,dec);}
            else{
                if(dec.mods.lastIndexOf(true)>1){cmd.c+=dec.code}
            }
        },
    })
};

