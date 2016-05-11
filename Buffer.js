var Buffer=()=>({
    // STATE
    s:'',
    pt:0,
    lines:[0],

    // METHODS
    getline(n){// Int->String the Nth line, not including any trailing newline
        var l=this.lines,len=l.length;
        if(0<n&&n<len){return this.s.slice(l[n]+1,l[n+1]);}// line in middle
        else if(n===0){return this.s.slice(0,l[1]);}// first
        else if(len<=n){return this.s.slice(1+l[len-1]);}// last
        else{return this.getline(Math.max(0,len+n));}// negative n indexes backwards but doesn't wrap
    },

    // ()->[Int] array of line start indexes
    gen_lines(){return this.s.split('').reduce((a,b,i)=>{b==='\n'&&a.push(i);return a;},[0]);},

    ins(ch){// insert ch chars to right of p
        if(this.pt===this.s.length){this.s=this.s+ch;}
        else{var fst=this.s.slice(0,this.pt),snd=this.s.slice(this.pt);this.s=fst+ch+snd;}
        this.lines=this.gen_lines();// recalc whole table - works, but expensive
        this.pt+=ch.length;
    },

    del(n){// delete n chars to right (n>0) or left (n<0) of point
        if(n===0||n+this.pt<0){return;}
        var leftd=n<0?n:0,rightd=n<0?0:n;
        var fst=this.s.slice(0,this.pt+leftd),snd=this.s.slice(this.pt+rightd);this.s=fst+snd;
        this.lines=this.gen_lines();// recalculate whole table - works, but expensive
    },
});
