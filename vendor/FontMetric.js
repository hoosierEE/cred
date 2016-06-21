// thanks http://stackoverflow.com/a/25355178/2037637
let objOff=(obj)=>{
    let currleft=0,
        currtop=0;
    if(obj.offsetParent){
        do{
            currleft+=obj.offsetLeft;
            currtop+=obj.offsetTop;
        }while(obj=obj.offsetParent);
    }
    else{
        currleft+=obj.offsetLeft;
        currtop+=obj.offsetTop;
    }
    return[currleft,currtop];
};

let FontMetric=(fontName,fontSize)=>{
    let text=document.createElement("span");
    text.style.fontFamily=fontName;
    text.style.fontSize=fontSize;// + "px";
    text.innerHTML="ABCjgq|";
    // if you will use some weird fonts, like handwriting or symbols,
    // then you need to edit this test string for chars that will have most extreme accend/descend values

    let block=document.createElement("div");
    block.style.display="inline-block";
    block.style.width="1px";
    block.style.height="0px";

    let div=document.createElement("div");
    div.appendChild(text);
    div.appendChild(block);

    // this test div must be visible otherwise offsetLeft/offsetTop will return 0
    // but still let's try to avoid any potential glitches in letious browsers
    // by making it's height 0px, and overflow hidden
    div.style.height="0px";
    div.style.overflow="hidden";

    // I tried without adding it to body-won't work. So we gotta do this one.
    document.body.appendChild(div);

    block.style.verticalAlign="baseline";
    let bp=objOff(block);
    let tp=objOff(text);
    let taccent=bp[1]-tp[1];
    block.style.verticalAlign="bottom";
    bp=objOff(block);
    tp=objOff(text);
    let theight=bp[1]-tp[1];
    let tdescent=theight-taccent;

    // now take it off :-)
    document.body.removeChild(div);

    // return text accent, descent and total height
    return [taccent,theight,tdescent];
};
