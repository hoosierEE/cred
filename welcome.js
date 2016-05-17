var welcome=
    "Welcome to CRED\n"+
    "\n"+
    "Cred is a text editor rendered in HTML5 Canvas, which aims to capture some of Spacemacs' UI,\n"+
    "but also work natively on Chromebooks or possibly web browsers.\n"+
    "\n"+
    "Currently Cred supports basic Vim motions, such as 'hjkl', '0', '$', and a few others.\n"+
    "\n"+
    "Cred does not yet open files or write files, and in its current state might only be useful as an\n"+
    "alternative method for editing in-memory strings.\n"+
    "\n"+
    "However, some more features are planned...\n"+
    "\n"+
    "\n"+
    "\n"+
    "An incomplete to-do list includes:\n"+
    "\n"+
    "* numemric-prefixed commands\n"+
    "* multi-character command parsing\n"+
    "* mouse scrolling\n"+
    "* file i/o\n"+
    "* git[hub] integration\n"+
    "* syntax highlighting\n"+
    "* different font styling in the same document\n"+
    "* popup UI menus like the SPC-* interface from Spacemacs\n"+
    "* persistent, live-customizable theme\n"+
    "* inline images\n";

buf.ins(welcome);
cur.rowcol();
cur.up(11);
