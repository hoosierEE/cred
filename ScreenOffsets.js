var ScreenOffsets=()=>({
    bw:20,// border width
    h:0,y:0,b:0,
    lmul(lnum){return this.y+this.h*lnum;},// lower edge of line
    init(ctx){
        var fm=FontMetric(settings.font_name,settings.font_size);
        this.h=fm[1];// total line height
        this.b=fm[2];// lower bound of text such as: jgpq|
        this.y=this.h+this.bw;
    },
});
