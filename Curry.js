/* Curry
   f = (a,b,c) => a+b+c // normal function
   let x=1,y=2,z=3
   C(f)  // curried version of f, awaiting all its arguments

   C(f)(x)  // a function waiting for 2 args
   C(f,x)  // same as above

   C(f)(x)(y)(z)  // returns 6
   C(f,x,y,z)  // same as above
*/
const C=(f,...x)=>f.length>x.length?(...y)=>C(f,...x,...y):f(...x);
