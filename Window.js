var Window=(c,cur,cfg)=>({
    /* @param c: the target canvas
       @param cur: an already-instantiated Cursor
       @param cfg: an already-instantiated Configuration
    */

    /* STATE */
    bw:20,/* border width */
    line_ascent:5,line_descent:5,line_height:10,
    v:{},/* viewport position and size */

    /* METHODS */
    ln_top(n){return this.bw+this.line_height*(n+1);},/* top pixel of line n */
    co_left(n){return this.bw+c.measureText(buf.getline(cur.cl).slice(0,n)).width;},/* left edge of column n */
    co_right(n){return this.bw+c.measureText(buf.getline(cur.cl).slice(0,n+1)).width;},/* right edge of column n */
    num_visible_lines(){return (c.canvas.height-2*this.bw)/this.line_height|0;},

    scroll(line_offset=5){
        if(line_offset>this.num_visible_lines()){line_offset=this.num_visible_lines()/2|0;}
        else if(line_offset<1){line_offset=1;}/* smallest usable value - 0 is too small */
        var prev_y=this.v.y, prev_x=this.v.x;/* grab current value of x and y */

        /* up/down */
        var ltop=this.ln_top(cur.cl+line_offset), lbot=this.ln_top(cur.cl-line_offset);
        if(ltop>this.v.y+this.v.h){this.v.y+=ltop-(this.v.y+this.v.h);}
        if(lbot<this.v.y){this.v.y-=this.v.y-lbot;}

        /* left/right */
        var crt=this.co_right(cur.co)+this.bw, clt=this.co_left(cur.co)-this.bw;
        if(crt>this.v.x+this.v.w){this.v.x+=crt-this.v.w;}
        if(clt<this.v.x){this.v.x-=this.v.x-clt;}
        if(this.v.y<0){this.v.y=0;}
        if(this.v.x<0){this.v.x=0;}

        /* translate canvas if necessary */
        if(prev_x!=this.v.x||prev_y!=this.v.y){c.setTransform(1,0,0,1,-this.v.x,-this.v.y);}
    },
    init(ctx){/* must be called before using other Window methods, but AFTER the HTML body loads */
        var fm=FontMetric(cfg.font.name,cfg.font.size);
        this.line_ascent=fm[0];/* top of text such as QMEW| */
        this.line_height=fm[1];/* total line height */
        this.line_descent=fm[2];/* lower bound of text such as: jgpq| */
        this.v={x:0,y:0,w:c.canvas.width,h:c.canvas.height};
        this.scroll();
    },
});

