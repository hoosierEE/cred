const Buffer=()=>({
    /* Buffer
       A line-oriented view of a String, with an insertion point.
       Editing operations automatically update line numbers. */

    /* STATE */
    s:'',
    pt:0,
    lines:[0],

    /* METHODS */
    getline(n){/* getline : Int -> String -- the Nth line, not including any trailing newline */
        const l=this.lines,len=l.length;
        if(0<n&&n<len){return this.s.slice(l[n]+1,l[n+1]);}/* line in middle */
        else if(n===0){return this.s.slice(0,l[1]);}/* first */
        else if(n>=len){return this.s.slice(1+l[len-1]);}/* last */
        else{return this.getline(Math.max(0,len+n));}/* negative n indexes backwards but doesn't wrap */
    },

    /* gen_lines : () -> [Int] -- array of line start indexes */
    gen_lines(){return[...this.s].reduce((x,y,i)=>{y==='\n'&&x.push(i);return x;},[0]);},

    /* insert ch chars to right of p */
    ins(ch){
        if(this.pt===this.s.length){this.s=this.s+ch;}
        else{const fst=this.s.slice(0,this.pt),snd=this.s.slice(this.pt);this.s=fst+ch+snd;}
        this.lines=this.gen_lines();
        this.pt+=ch.length;
    },

    /* delete n chars to right (n>0) or left (n<0) of point */
    del(n){
        if(n===0||n+this.pt<0){return;}
        const leftd=n<0?n:0,rightd=n<0?0:n;
        const fst=this.s.slice(0,this.pt+leftd),snd=this.s.slice(this.pt+rightd);this.s=fst+snd;
        this.lines=this.gen_lines();
    },
});
