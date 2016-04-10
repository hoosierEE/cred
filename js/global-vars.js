'use strict';
var c=document.getElementById('c').getContext('2d'),
    grid={width:25,height:50}, // monospace grid width/height
    cursor={x:25,y:75}, // cursor position on grid
    pressed_codes=new Set(); // keys that are down right now
