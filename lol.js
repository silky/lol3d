/*-----------------------------------------------------------------------------.
|                 /\______  /\______  ____/\______     __                      |
|                 \____   \/  \__   \/  _ \____   \ __/  \____                 |
|                  / _/  _/    \/   /   /  / _/  _// / / / / /                 |
|                 /  \   \  /\ /   /\  /  /  \   \/ /\  / / /                  |
|                 \__/\   \/RTX______\___/\__/\   \/ / /_/_/                   |
|                      \___)   \__)            \___) \/                        |
|------------------------------------------------------------------------------|
|################################### LOL 3D ###################################|
`-----------------------------------------------------------------------------*/

/*jslint white,this,maxlen:80*/
/*global window,jslint*/

Number.prototype.clamp=function(min,max)
  {
  'use strict';
  return Math.max(min,Math.min(this,max));
  };

var LOL=function(id,mesh)
{
'use strict';
id=id||'lol';
mesh=mesh||{};

var lol={id:id};

lol.timer=0;
lol.rid=false; /* frame request id */
lol.cvs=false; /* canvas */
lol.ctx=false; /* 2d context */
lol.data={vtx:[],tri:[]};
lol.axis={x:-2,y:0,z:-2};
lol.light={x:0,y:0,z:-32768};
lol.norm={x:0.75,y:0.75,z:0.75};
lol.vec={x:0,y:0,z:0};
lol.hzn={l:32768,n:0}; /* horizon */
lol.star=[];
lol.sand=[];
lol.ar=Math.PI/180;
lol.m=4; /* margin */

lol.i=function(id){return window.document.getElementById(String(id));};
lol.el=function(el){return window.document.createElement(String(el));};
lol.tn=function(txt){return window.document.createTextNode(String(txt));};

lol.version=
  {
  maj:0,min:5,build:9,beta:true, /* u03b1=alpha,u03b2=beta */
  get:function()
    {
    var v=lol.version;
    return v.maj+'.'+v.min+'.'+v.build+(v.beta?'\u03b2':'');
    }
  };

lol.init=function()
  {
  var i=0,j=0,n,x,y,z,r,a,vec,scale,obj,handler;
  lol.config=lol.localstorage.get();
  if(lol.config.version!==lol.version.get())
    {
    lol.localstorage.reset();
    lol.config={};
    }
  if(lol.util.isempty(lol.config))
    {
    lol.config=
      {
      version:lol.version.get(),
      flag:lol.flag.list,
      anim:false,
      console:true,
      color:{n:6,stop:[0.2,0.4,0.7]},
      pr:{w:3,h:3},         /* pixel ratio */
      zr:128,               /* focale */
      np:0,                 /* nearplane (from camera) */
      p:{x:0,y:-2.5,z:0},   /* position vector */
      r:{x:0,y:0,z:0},      /* rotation vector */
      cam:{x:0,y:-4,z:-12}, /* camera position vector */
      co:{x:0,y:0,z:0},     /* camera origin vector */
      cr:{x:6,y:0,z:0},     /* camera rotation vector */
      lr:{x:45,y:45,z:0}    /* light rotation vector */
      };
    lol.localstorage.save();
    }
  lol.pr={w:lol.config.pr.w,h:lol.config.pr.h};
  lol.pr.r=lol.pr.h/lol.pr.w;
  lol.zr=lol.config.zr;
  lol.np=lol.config.np;
  lol.color.n=lol.config.color.n;
  lol.color.stop=lol.config.color.stop;
  lol.p=lol.config.p;
  lol.r=lol.config.r;
  lol.cam=lol.config.cam;
  lol.co=lol.config.co;
  lol.cr=lol.config.cr;
  lol.lr=lol.config.lr;
  /* star */
  n=256;
  while(i<n)
    {
    r=0;
    while(r<0.25||r>0.3)
      {
      vec={x:Math.random()-0.5,y:-Math.random(),z:Math.random()-0.5};
      r=Math.sqrt(vec.x*vec.x+vec.y*vec.y+vec.z*vec.z);
      }
    lol.star.push(lol.vector.mul(vec,{x:lol.hzn.l,y:lol.hzn.l,z:lol.hzn.l}));
    i+=1;
    }
  /* sand */
  i=0;
  n=256;
  while(i<n)
    {
    a=360/n*i*lol.ar;
    r=2+Math.random()*510;
    lol.sand.push({x:r*Math.sin(a),y:lol.axis.y,z:r*Math.cos(a)});
    i+=1;
    }
  /* mountains */
  mesh.mountain={vtx:[],tri:[],col:[]};
  i=0;
  n=64;
  lol.hzn.n+=n*2;
  while(i<n)
    {
    x=4096+256*Math.random()*32;
    y=1024+256*Math.random()*8;
    a=360/n*i+(135-Math.random()*270)/n;
    x=lol.hzn.l*Math.cos(a*lol.ar);
    z=lol.hzn.l*Math.sin(a*lol.ar);
    mesh.mountain.vtx.push(x);
    mesh.mountain.vtx.push(lol.axis.y);
    mesh.mountain.vtx.push(z);
    a=360/n*i-(135-Math.random()*270)/n;
    x=lol.hzn.l*Math.cos(a*lol.ar);
    z=lol.hzn.l*Math.sin(a*lol.ar);
    mesh.mountain.vtx.push(x);
    mesh.mountain.vtx.push(-y);
    mesh.mountain.vtx.push(z);
    mesh.mountain.col.push(1);
    mesh.mountain.col.push(1);
    i+=1;
    }
  i=0;
  while(i<n*2-2)
    {
    mesh.mountain.tri.push(i+2);
    mesh.mountain.tri.push(i+1);
    mesh.mountain.tri.push(i+3);
    mesh.mountain.tri.push(i+2);
    mesh.mountain.tri.push(i);
    mesh.mountain.tri.push(i+1);
    i+=2;
    }
  mesh.mountain.tri.push(0);
  mesh.mountain.tri.push(i+1);
  mesh.mountain.tri.push(1);
  mesh.mountain.tri.push(0);
  mesh.mountain.tri.push(i);
  mesh.mountain.tri.push(i+1);
  lol.mesh.format(mesh.mountain,{type:1,col:0,idx:1});
  /* laser pyramid */
  i=0;
  n=16;
  y=512/lol.color.n;
  while(i<n)
    {
    r=(i>0)?256+(2048-256)*Math.sin(Math.PI*4/n*i):256;
    a=360/n*i+90;
    x=Math.round(r*Math.cos(a*lol.ar));
    z=Math.round(r*Math.sin(a*lol.ar));
    lol.mesh.format(mesh.trapezoid,
      {
      type:0,
      col:1,
      idx:1,
      s:{x:64,y:48,z:64},
      p:{x:x,y:-24,z:z}
      });
    j=0;
    while(j<lol.color.n)
      {
      lol.mesh.format({vtx:[0,-y,0,0,0,0,0,0,0],tri:[0,1,2]},
        {
        type:2,
        col:7,
        idx:lol.color.n-1-j,
        p:{x:x,y:-48-y*j,z:z}
        });
      j+=1;
      }
    i+=1;
    }
  lol.mesh.format(mesh.cube,{col:1,p:{x:-3.5,y:-0.5,z:-3.5}});
  lol.mesh.format(mesh.icosahedron,{grp:0,col:2,s:{x:1.5,y:1.5,z:1.5},p:{x:3.5,y:-1,z:-3.5}});
  lol.mesh.format(mesh.cube,{col:5,s:{x:0.5,y:2,z:0.5},p:{x:-3.5,y:-1,z:3.5}});
  lol.mesh.format(mesh.pyramid,{col:4,s:{x:2,y:1,z:2},p:{x:3.5,y:-0.5,z:3.5}});
  obj=lol.mesh.norm(mesh.dodecahedron);
  lol.mesh.format(obj,{grp:1,col:3,s:{x:2,y:2,z:2},r:{x:32,y:0,z:0}});
  /*obj=lol.mesh.load('mesh/totodile.json');
  scale={x:0.05,y:0.05,z:0.05};
  lol.mesh.format(obj,{col:2,s:scale,p:{x:-3,y:0,z:-3},r:{x:90,y:180,z:180}});*/
  lol.viewport();
  lol.color.init();
  lol.icon();
  lol.css();
  lol.console.init();
  lol.console.log('version',lol.version.get());
  lol.console.hr(0);
  handler=function(e)
    {
    lol.pr.w+=e.target.param;
    if(lol.pr.w<1){lol.pr.w=1;}
    lol.pr.r=lol.pr.h/lol.pr.w;
    lol.console.log('pixel w',lol.pr.w,handler,1);
    lol.config.pr.w=lol.pr.w;
    lol.localstorage.save();
    lol.resize();
    };
  lol.console.log('pixel w',lol.pr.w,handler,1);
  handler=function(e)
    {
    lol.pr.h+=e.target.param;
    if(lol.pr.h<1){lol.pr.h=1;}
    lol.pr.r=lol.pr.h/lol.pr.w;
    lol.console.log('pixel h',lol.pr.h,handler,1);
    lol.config.pr.h=lol.pr.h;
    lol.localstorage.save();
    lol.resize();
    };
  lol.console.log('pixel h',lol.pr.h,handler,1);
  lol.console.log('size');
  handler=function(e)
    {
    lol.zr+=e.target.param;
    lol.console.log('focale',lol.zr,handler,16);
    lol.config.zr=lol.zr;
    lol.localstorage.save();
    lol.resize();
    };
  lol.console.log('focale',lol.zr,handler,16);
  handler=function(e)
    {
    lol.np+=e.target.param;
    lol.console.log('nearplane',lol.np,handler,0.1);
    lol.config.np=lol.np;
    lol.localstorage.save();
    lol.resize();
    };
  lol.console.log('nearplane',lol.np,handler,0.1);
  lol.console.hr(1);
  lol.color.update(1);
  lol.console.hr(2);
  lol.console.log('vertex n',lol.data.vtx.length);
  lol.console.log('face n',lol.data.tri.length);
  lol.console.hr(3);
  window.Object.keys(lol.flag.list).forEach(function(v){lol.flag.set(v);});
  lol.console.hr(4);
  window.document.body.style.backgroundColor=lol.color.format(lol.color.bgd);
  window.addEventListener('resize',lol.resize,false);
  window.addEventListener('keydown',lol.key.down,false);
  window.addEventListener('keyup',lol.key.up, false);
  window.addEventListener('mousedown',lol.mouse.down,false);
  window.addEventListener('mouseup',lol.mouse.up,false);
  window.addEventListener('mousemove',lol.mouse.move,false);
  var evt=lol.util.isffx()?'DOMMouseScroll':'mousewheel';
  window.addEventListener(evt,lol.mouse.wheel,false);
  lol.scanline.init();
  lol.resize();
  lol.timer=lol.util.time();
  lol.fps.init();
  lol.anim[lol.config.anim?'start':'stop']();
  lol.console.hr(8);
  lol.console.log('validate',null,lol.validate);
  lol.console.log('reset',null,function()
    {
    lol.localstorage.reset();
    window.location.reload();
    });
  lol.console.hr(6);
  lol.key.log();
  };

lol.viewport=function()
  {
  lol.cvs=lol.el('canvas');
  lol.cvs.id=lol.id+'-viewport';
  lol.cvs.style.position='absolute';
  lol.cvs.style.zIndex=1;
  window.document.body.appendChild(lol.cvs);
  lol.ctx=lol.cvs.getContext('2d');
  };

lol.resize=function()
  {
  var w=window.innerWidth,h=window.innerHeight,el;
  lol.w=(w+lol.pr.w-w%lol.pr.w)/lol.pr.w;lol.w-=lol.w%2;
  lol.h=(h+lol.pr.h-h%lol.pr.h)/lol.pr.h;lol.h-=lol.h%2;
  lol.cvs.width=lol.w*lol.pr.w;
  lol.cvs.height=lol.h*lol.pr.h;
  lol.ctx.scale(lol.pr.w,lol.pr.h);
  el=lol.i(lol.id+'-scanline');
  el.style.width=lol.cvs.width+'px';
  el.style.height=lol.cvs.height+'px';
  lol.console.log('size',lol.w+'*'+lol.h);
  lol.anim.update();
  };

lol.matrix=
  {
  id:function()
    {
    return [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
    },
  mul:function(v,m)
    {
    return {
      x:v.x*m[0][0]+v.y*m[0][1]+v.z*m[0][2]+m[0][3],
      y:v.x*m[1][0]+v.y*m[1][1]+v.z*m[1][2]+m[1][3],
      z:v.x*m[2][0]+v.y*m[2][1]+v.z*m[2][2]+m[2][3]
      };
    },
  rotate:function(a)
    {
    var m,sin1,cos1,sin2,cos2,sin3,cos3;
    sin1=Math.sin(a.y*lol.ar);
    cos1=Math.cos(a.y*lol.ar);
    sin2=Math.sin(a.x*lol.ar);
    cos2=Math.cos(a.x*lol.ar);
    sin3=Math.sin(a.z*lol.ar);
    cos3=Math.cos(a.z*lol.ar);
    m=lol.matrix.id();
    m[0][0]=cos1*cos3+sin1*sin2*sin3;
    m[0][1]=-cos1*sin3+cos3*sin1*sin2;
    m[0][2]=cos2*sin1;
    m[1][0]=cos2*sin3;
    m[1][1]=cos2*cos3;
    m[1][2]=-sin2;
    m[2][0]=-cos3*sin1+cos1*sin2*sin3;
    m[2][1]=sin1*sin3+cos1*cos3*sin2;
    m[2][2]=cos1*cos2;
    return m;
    },
  shadow:function(a)
    {
    var m=lol.matrix.id();
    m[0][1]=-a.x/a.y;
    m[1][1]=0;
    m[2][1]=-a.z/a.y;
    return m;
    }
  };

lol.vector=
  {
  o:{x:0,y:0,z:0},
  add:function(a,b) /* add (a+b) */
    {
    return {x:a.x+b.x,y:a.y+b.y,z:a.z+b.z};
    },
  sub:function(a,b) /* subtract (a-b) */
    {
    return {x:a.x-b.x,y:a.y-b.y,z:a.z-b.z};
    },
  neg:function(a) /* negative (-a) */
    {
    return {x:-a.x,y:-a.y,z:-a.z};
    },
  mul:function(a,b) /* mul (a*b) */
    {
    return {x:a.x*b.x,y:a.y*b.y,z:a.z*b.z};
    },
  cmp:function(a,b) /* compare (a!==b) */
    {
    if(a.x!==b.x){return false;}
    if(a.y!==b.y){return false;}
    if(a.z!==b.z){return false;}
    return true;
    },
  dot:function(a,b) /* dot (scalar) product (a.b) */
    {
    return a.x*b.x+a.y*b.y+a.z+b.z;
    },
  cross:function(a,b) /* cross product (give normal) */
    {
    return {x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x};
    },
  length:function(a,b)
    {
    var vec={x:b.x-a.x,y:b.y-a.y,z:b.z-a.z};
    return Math.sqrt((vec.x*vec.x)+(vec.y*vec.y)+(vec.z*vec.z));
    },
  ortho:function(a)
    {
    return Math.abs(a.x)>Math.abs(a.z)?{x:-a.y,y:a.x,z:0}:{x:0,y:-a.z,z:a.y};
    },
  norm:function(vec) /* normalize */
    {
    var l=lol.vector.length(lol.vector.o,vec);
    if(l===0){return lol.vector.o;}
    return {x:vec.x/l,y:vec.y/l,z:vec.z/l};
    },
  inter2d:function(v1,v2,v3,v4) /* intersection point */
    {
    var vec={},a1,b1,c1,a2,b2,c2,delta;
    a1=v2.y-v1.y;
    b1=v1.x-v2.x;
    c1=a1*v1.x+b1*v1.y;
    a2=v4.y-v3.y;
    b2=v3.x-v4.x;
    c2=a2*v3.x+b2*v3.y;
    delta=a1*b2-a2*b1;
    if(delta===0){return v2;}
    vec.x=(b2*c1-b1*c2)/delta;
    vec.y=(a1*c2-a2*c1)/delta;
    return vec;
    },
  inter3d:function(a,b)
    {
    var vec={x:0,y:0,z:0},n,t,c,u,w;
    n={x:0,y:0,z:-lol.np-0.001};
    c={x:0,y:0,z:-lol.np};
    u=lol.vector.sub(c,a);
    w=lol.vector.sub(b,a);
    t=lol.vector.dot(n,u)/lol.vector.dot(n,w);
    if(t>0&&t<1)
      {
      vec=lol.vector.add(a,{x:w.x*t,y:w.y*t,z:w.z*t});
      }
    else
      {
      vec=(t<0)?a:b;
      }
    if(lol.flag.get('vertex'))
      {
      c=lol.color.get();
      lol.color.set(lol.color.pal[0][10]);
      lol.plot.cross(lol.vector.transform(vec));
      lol.color.set(lol.color.format(c));
      }
    return vec;
    },
  normal:function(v)
    {
    var a={},b={},n;
    a.x=v[1].x-v[0].x;
    a.y=v[1].y-v[0].y;
    a.z=v[1].z-v[0].z;
    b.x=v[2].x-v[0].x;
    b.y=v[2].y-v[0].y;
    b.z=v[2].z-v[0].z;
    n=lol.vector.cross(a,b);
    return lol.vector.norm(n);
    },
  normal2d:function(v)
    {
    var a={},b={},n;
    a.x=v[1].x-v[0].x;
    a.y=v[1].y-v[0].y;
    a.z=-1;
    b.x=v[2].x-v[0].x;
    b.y=v[2].y-v[0].y;
    b.z=-1;
    n=lol.vector.cross(a,b);
    return lol.vector.norm(n);
    },
  project:function(vec)
    {
    var mtx=lol.matrix.rotate(lol.cr);
    vec=lol.matrix.mul(vec,mtx);
    vec=lol.vector.sub(lol.cam,vec);
    return vec;
    },
  transform:function(vec)
    {
    var z=(vec.z-lol.co.z)/lol.zr;
    if(z>0){z=0;}
    return {
      x:Math.round(lol.w/2+(vec.x-lol.co.x)*lol.pr.r/z),
      y:Math.round(lol.h/2+(vec.y-lol.co.y)/z)};
    }
  };

lol.color=
  {
  n:0,
  d:12, /* dither step */
  w:13,
  h:12,
  pal:[[]],
  list:[
    [128,128,128],
    [160,144,96],
    [192,96,48],
    //[160,112,128],
    //[128,112,160],
    [96,128,160],
    [96,128,96]
    ],
  bgd:[72,56,48],
  format:function(col)
    {
    col=(typeof col==='object')?col:[0,0,0];
    return '#'+col.map(function(v)
      {
      return String('0'+Number(v).clamp(0,255).toString(16)).slice(-2);
      }).join('');
    },
  parse:function(col)
    {
    col=(typeof col==='string')?col:'#000';
    var i=0,c=[0,0,0];
    if(col.charAt(0)==='#'){col=col.slice(1);}
    if(col.length===3){while(i<3){c[i]=parseInt(col[i]+col[i],16);i+=1;}}
    if(col.length===6){while(i<3){c[i]=parseInt(col.substr(i*2,2),16);i+=1;}}
    return c;
    },
  set:function(col){lol.ctx.fillStyle=col;},
  get:function(){return lol.color.parse(lol.ctx.fillStyle);},
  init:function()
    {
    var el=lol.el('div');
    el.id=lol.id+'-palette';
    el.style.position='absolute';
    el.style.left=lol.m+'px';
    el.style.top=lol.m+'px';
    el.style.font='bold 9px/9px sans-serif';
    el.style.letterSpacing='-1px';
    el.style.textAlign='right';
    el.style.cursor='default';
    el.style.zIndex=2;
    el.style.display=lol.config.console?'block':'none';
    el.className='sel';
    el.addEventListener('selectstart',function(){return false;},false);
    el.addEventListener('dragstart',function(){return false;},false);
    window.document.body.appendChild(el);
    lol.color.palette();
    },
  update:function()
    {
    var i=1,n=1,t=0,el=lol.i(lol.id+'-palette'),col=[];
    while(el.firstChild){el.removeChild(el.firstChild);}
    t=lol.color.pal[0].length;
    lol.color.pal[0].forEach(function(v,i){lol.color.square(v,i);});
    lol.color.list.forEach(function(v,i){lol.color.generate(v,i+1);});
    n=lol.color.list.length+1;
    lol.color.pal[n]=[];
    while(i<=lol.color.n)
      {
      lol.color.pal[n][i]=lol.color.format([
        Math.round(lol.color.bgd[0]+i*(248-lol.color.bgd[0])/lol.color.n),
        Math.round(lol.color.bgd[1]+i*(248-lol.color.bgd[1])/lol.color.n),
        Math.round(lol.color.bgd[2]+i*(224-lol.color.bgd[2])/lol.color.n)
        ]);
      lol.color.square(lol.color.pal[n][i],t+i);
      i+=1;
      }
    i=0;
    n=lol.color.list.length+2;
    lol.color.pal[n]=[];
    while(i<lol.color.n)
      {
      lol.color.pal[n][i]=lol.color.format([
        Math.round(lol.color.bgd[0]+(i+1)*(248-lol.color.bgd[0])/lol.color.n),
        Math.round(lol.color.bgd[1]+(i+1)*(64-lol.color.bgd[1])/lol.color.n),
        Math.round(lol.color.bgd[2]+(i+1)*(48-lol.color.bgd[2])/lol.color.n)
        ]);
      lol.color.square(lol.color.pal[n][i],t+1+n*lol.color.n+i);
      i+=1;
      }
    lol.config.color.n=lol.color.n;
    lol.config.color.stop=lol.color.stop;
    lol.localstorage.save();
    lol.console.log('color',lol.color.n,function(e)
      {
      lol.color.n+=e.target.param;
      lol.color.n=lol.color.n.clamp(1,64);
      lol.color.update();
      lol.anim.update();
      },1);
    lol.console.log('shadow',lol.color.stop[0],function(e)
      {
      lol.color.stop[0]+=e.target.param;
      lol.color.stop[0]=lol.color.stop[0].clamp(0,lol.color.stop[1]);
      lol.color.update();
      lol.anim.update();
      },0.05);
    lol.console.log('medium',lol.color.stop[1],function(e)
      {
      lol.color.stop[1]+=e.target.param;
      var param=lol.color.stop[1].clamp(lol.color.stop[0],lol.color.stop[2]);
      lol.color.stop[1]=param;
      lol.color.update();
      lol.anim.update();
      },0.05);
    lol.console.log('specular',lol.color.stop[2],function(e)
      {
      lol.color.stop[2]+=e.target.param;
      lol.color.stop[2]=lol.color.stop[2].clamp(lol.color.stop[1],1);
      lol.color.update();
      lol.anim.update();
      },0.05);
    col=lol.color.stop.map(function(v){return Math.round(lol.color.n*v);});
    lol.console.log('gradient',col.join(','));
    },
  palette:function()
    {
    var col=[
      lol.color.bgd.map(function(v){return v-16;}),
      lol.color.bgd.map(function(v){return v-8;}),
      lol.color.bgd.map(function(v){return v+16;}),
      lol.color.bgd.map(function(v){return v+64;}),
      [0,192,248],
      [248,0,0],
      [0,248,0],
      [0,128,248],
      [224,144,0],
      [248,224,0],
      [128,64,192]
      ];
    lol.color.pal[0]=col.map(function(c){return lol.color.format(c);});
    },
  generate:function(c,p)
    {
    var i=0,n=lol.color.n,s,e,l,col=[],r=c[0],g=c[1],b=c[2];
    lol.color.stop[1]=lol.color.stop[1].clamp(lol.color.stop[0],1);
    lol.color.stop[2]=lol.color.stop[2].clamp(lol.color.stop[1],1);
    s=Math.round(n*lol.color.stop[0]);
    e=Math.round(n*lol.color.stop[1]);
    l=Math.round(n*lol.color.stop[2]);
    while(i<s)
      {
      col[i]=[
        Math.round(r*lol.util.interpolate(0.4,0.6,s,i)),
        Math.round(g*lol.util.interpolate(0.3,0.5,s,i)),
        Math.round(b*lol.util.interpolate(0.2,0.4,s,i))
        ];
      i+=1;
      }
    while(i<e)
      {
      col[i]=[
        Math.round(r*lol.util.interpolate(0.6,0.8,e-s,i-s)),
        Math.round(g*lol.util.interpolate(0.5,0.7,e-s,i-s)),
        Math.round(b*lol.util.interpolate(0.4,0.8,e-s,i-s))
        ];
      i+=1;
      }
    while(i<l)
      {
      col[i]=[
        Math.round(r*lol.util.interpolate(0.8,1.5,l-e,i-e)),
        Math.round(g*lol.util.interpolate(0.7,1.3,l-e,i-e)),
        Math.round(b*lol.util.interpolate(0.8,1.2,l-e,i-e))
        ];
      i+=1;
      }
    while(i<n)
      {
      col[i]=[
        Math.round(r*lol.util.interpolate(1.5,2.6,n-l,i-l)),
        Math.round(g*lol.util.interpolate(1.3,2.4,n-l,i-l)),
        Math.round(b*lol.util.interpolate(1.2,2.2,n-l,i-l))
        ];
      i+=1;
      }
    lol.color.pal[p]=col.map(function(c){return lol.color.format(c);});
    lol.color.pal[p].forEach(function(v,i)
      {
      lol.color.square(v,lol.color.pal[0].length+1+p*lol.color.n+i);
      });
    },
  square:function(col,n)
    {
    var e1=lol.el('div'),e2=lol.el('div'),c;
    c=lol.color.parse(col);
    e1.style.clear='both';
    e1.style.float='left';
    e2.style.width=(lol.color.w-3)+'px';
    e2.style.height=(lol.color.h-2)+'px';
    e2.style.padding='2px 3px 0px 0px';
    e2.style.margin='0px 1px 0px 0px';
    e2.style.backgroundColor=col;
    e2.title=c.join()+'\n'+col;
    e2.style.color=lol.color.format(c.map(function(v){return v+32;}));
    e2.appendChild(lol.tn(n));
    e1.appendChild(e2);
    lol.i(lol.id+'-palette').appendChild(e1);
    }
  };

lol.plot=
  {
  pixel:function(p)
    {
    if(p.x<0||p.x-1>lol.w||p.y<0||p.y-1>lol.h){return false;}
    lol.ctx.rect(p.x,p.y,1,1);
    },
  line:function(a,b,fill)
    {
    var i=0,x,y,w=lol.w-1,h=lol.h-1,d1,d2,dx,dy,xi1,xi2,yi1,yi2,nbr,c;
    if((a.x<0&&b.x<0)||(a.x>w&&b.x>w)){return false;}
    if((a.y<0&&b.y<0)||(a.y>h&&b.y>h)){return false;}
    if(a.x<0){a=lol.vector.inter2d(a,b,{x:0,y:0},{x:0,y:h});}
    else if(a.x>w){a=lol.vector.inter2d(a,b,{x:w,y:0},{x:w,y:h});}
    if(b.x<0){b=lol.vector.inter2d(a,b,{x:0,y:0},{x:0,y:h});}
    else if(b.x>w){b=lol.vector.inter2d(a,b,{x:w,y:0},{x:w,y:h});}
    if(a.y<0){a=lol.vector.inter2d(a,b,{x:0,y:0},{x:w,y:0});}
    else if(a.y>h){a=lol.vector.inter2d(a,b,{x:0,y:h},{x:w,y:h});}
    if(b.y<0){b=lol.vector.inter2d(a,b,{x:0,y:0},{x:w,y:0});}
    else if(b.y>h){b=lol.vector.inter2d(a,b,{x:0,y:h},{x:w,y:h});}
    dx=Math.abs(b.x-a.x);
    dy=Math.abs(b.y-a.y);
    a.x=Math.round(a.x);a.y=Math.round(a.y);
    b.x=Math.round(b.x);b.y=Math.round(b.y);
    x=a.x;
    y=a.y;
    xi1=(b.x>=a.x)?1:-1;xi2=xi1;
    yi1=(b.y>=a.y)?1:-1;yi2=yi1;
    if(dx>=dy)
      {
      xi1=0;
      yi2=0;
      d1=dx;
      d2=dy;
      }
    else
      {
      xi2=0;
      yi1=0;
      d1=dy;
      d2=dx;
      }
    nbr=d1/2;
    lol.ctx.beginPath();
    if(!fill)
      {
      while(i<=d1)
        {
        lol.plot.pixel({x:x,y:y});
        nbr+=d2;
        if(nbr>=d1)
          {
          nbr-=d1;
          x+=xi1;
          y+=yi1;
          }
        x+=xi2;
        y+=yi2;
        i+=1;
        }
      }
    else
      {
      while(i<=d1)
        {
        lol.ctx.rect(x,y,1,h-y);
        nbr+=d2;
        if(nbr>=d1)
          {
          nbr-=d1;
          x+=xi1;
          y+=yi1;
          }
        x+=xi2;
        y+=yi2;
        i+=1;
        }
      }
    lol.ctx.closePath();
    lol.ctx.fill();
    if(lol.flag.get('vertex'))
      {
      c=lol.color.get();
      lol.color.set(lol.color.format(c.map(function(v){return v+96;})));
      lol.ctx.beginPath();
      lol.plot.pixel(a);
      lol.plot.pixel(b);
      lol.ctx.closePath();
      lol.ctx.fill();
      lol.color.set(lol.color.format(c));
      }
    },
  dot:function(p)
    {
    lol.ctx.beginPath();
    lol.plot.pixel({x:p.x  ,y:p.y  });
    lol.plot.pixel({x:p.x+1,y:p.y  });
    lol.plot.pixel({x:p.x  ,y:p.y+1});
    lol.plot.pixel({x:p.x+1,y:p.y+1});
    lol.ctx.closePath();
    lol.ctx.fill();
    },
  square:function(p)
    {
    lol.ctx.beginPath();
    lol.plot.pixel({x:p.x-1,y:p.y-1});
    lol.plot.pixel({x:p.x  ,y:p.y-1});
    lol.plot.pixel({x:p.x-1,y:p.y  });
    lol.plot.pixel({x:p.x+1,y:p.y  });
    lol.plot.pixel({x:p.x+1,y:p.y-1});
    lol.plot.pixel({x:p.x-1,y:p.y+1});
    lol.plot.pixel({x:p.x  ,y:p.y+1});
    lol.plot.pixel({x:p.x+1,y:p.y+1});
    lol.ctx.closePath();
    lol.ctx.fill();
    },
  cross:function(p)
    {
    lol.ctx.beginPath();
    //lol.plot.pixel({x:p.x-2,y:p.y-2});
    lol.plot.pixel({x:p.x-1,y:p.y-1});
    lol.plot.pixel({x:p.x  ,y:p.y  });
    lol.plot.pixel({x:p.x+1,y:p.y+1});
    //lol.plot.pixel({x:p.x+2,y:p.y+2});
    //lol.plot.pixel({x:p.x+2,y:p.y-2});
    lol.plot.pixel({x:p.x+1,y:p.y-1});
    lol.plot.pixel({x:p.x-1,y:p.y+1});
    //lol.plot.pixel({x:p.x-2,y:p.y+2});
    lol.ctx.closePath();
    lol.ctx.fill();
    },
  circle:function(v,r,n,s)
    {
    s=lol.util.isnumber(s)?s:0;
    var i=s,k=360/n,mtx,vec,a,b;
    v.z+=r;
    while(i<360+s)
      {
      mtx=lol.matrix.rotate({x:0,y:i,z:0});
      a=lol.vector.project(lol.matrix.mul(v,mtx));
      i+=k;
      mtx=lol.matrix.rotate({x:0,y:i,z:0});
      b=lol.vector.project(lol.matrix.mul(v,mtx));
      if(a.z!==b.z){vec=lol.vector.inter3d(a,b);if(a.z>b.z){a=vec;}else{b=vec;}}
      lol.plot.line(lol.vector.transform(a),lol.vector.transform(b));
      }
    },
  arrow:function(l,r,p,o)
    {
    var mtx,vec,a,b,c,d;
    mtx=lol.matrix.rotate(o);
    a=lol.vector.add(lol.matrix.mul({x:0,y:0,z:0},mtx),p);
    a=lol.vector.project(a);
    b=lol.vector.add(lol.matrix.mul({x:0,y:0,z:l},mtx),p);
    b=lol.vector.project(b);
    c=lol.vector.add(lol.matrix.mul({x:-r/2,y:0,z:l-r},mtx),p);
    c=lol.vector.project(c);
    d=lol.vector.add(lol.matrix.mul({x:r/2,y:0,z:l-r},mtx),p);
    d=lol.vector.project(d);
    if(a.z!==b.z){vec=lol.vector.inter3d(a,b);if(a.z>b.z){a=vec;}else{b=vec;}}
    lol.plot.line(lol.vector.transform(a),lol.vector.transform(b));
    if(b.z!==c.z){vec=lol.vector.inter3d(b,c);if(b.z>c.z){b=vec;}else{c=vec;}}
    lol.plot.line(lol.vector.transform(b),lol.vector.transform(c));
    if(b.z!==d.z){vec=lol.vector.inter3d(b,d);if(b.z>d.z){b=vec;}else{d=vec;}}
    lol.plot.line(lol.vector.transform(b),lol.vector.transform(d));
    if(c.z!==d.z){vec=lol.vector.inter3d(c,d);if(c.z>d.z){c=vec;}else{d=vec;}}
    lol.plot.line(lol.vector.transform(c),lol.vector.transform(d));
    }
  };

lol.fill=
  {
  triangle:function(v1,v2,v3,p,c,n)
    {
    var v,v4;
    if(v1.y>v2.y){v=v1;v1=v2;v2=v;}
    if(v2.y>v3.y){v=v2;v2=v3;v3=v;}
    if(v1.y>v2.y){v=v1;v1=v2;v2=v;}
    if((v3.y-v1.y)!==0)
      {
      v4={x:Math.round(v1.x+((v2.y-v1.y)/(v3.y-v1.y))*(v3.x-v1.x)),y:v2.y};
      }
    else
      {
      v4={x:v1.x,y:v2.y};
      }
    lol.fill.tri_low(v1,v2,v4,p,c,n);
    lol.fill.tri_top(v2,v4,v3,p,c,n);
    if(lol.flag.get('vertex'))
      {
      c=lol.color.get();
      lol.color.set(lol.color.format(c.map(function(v){return v+96;})));
      lol.ctx.beginPath();
      lol.plot.pixel(v1);
      lol.plot.pixel(v2);
      lol.plot.pixel(v3);
      lol.ctx.closePath();
      lol.ctx.fill();
      lol.color.set(lol.color.format(c));
      }
    },
  tri_low:function(v1,v2,v3,p,c,n)
    {
    var i,x,y,w=lol.w-1,h=lol.h-1,m,xi1,xi2,x1,x2,a,b;
    if(v1.x<0&&v2.x<0&&v3.x<0){return false;}
    if(v1.x>w&&v2.x>w&&v3.x>w){return false;}
    if(v1.y<0&&v2.y<0&&v3.y<0){return false;}
    if(v1.y>h&&v2.y>h&&v3.y>h){return false;}
    if((v2.y-v1.y)===0||(v3.y-v1.y)===0){return false;}
    xi1=(v2.x-v1.x)/(v2.y-v1.y);
    xi2=(v3.x-v1.x)/(v3.y-v1.y);
    x1=v1.x;
    x2=v1.x;
    y=v1.y;
    lol.color.set(lol.color.pal[p][c]);
    while(y<=v2.y)
      {
      if(y>-1&&y<lol.h)
        {
        if(x1<x2){a=x1;b=x2;}else{a=x2;b=x1;}
        a=Math.round(a).clamp(0,lol.w);
        b=Math.round(b+1).clamp(0,lol.w);
        i=y%2;
        x=a;
        switch(n)
          {
          case 0:
            lol.ctx.fillRect(a,y,b-a,1);
            break;
          case 1: case 11:
            lol.color.set(lol.color.pal[p][c]);
            lol.ctx.fillRect(a,y,b-a,1);
            if(y%4===0)
              {
              lol.color.set(lol.color.pal[p][c+((n===1)?1:-1)]);
              lol.ctx.beginPath();
              while(x<b){if(x%4===0){lol.plot.pixel({x:x,y:y});}x+=1;}
              lol.ctx.closePath();
              lol.ctx.fill();
              }
            break;
          case 2: case 10:
            lol.color.set(lol.color.pal[p][c]);
            lol.ctx.fillRect(a,y,b-a,1);
            if(i===0)
              {
              lol.color.set(lol.color.pal[p][c+((n===2)?1:-1)]);
              lol.ctx.beginPath();
              m=(y%4===0)?2:4;
              while(x<b){if(x%m===0){lol.plot.pixel({x:x,y:y});}x+=1;}
              lol.ctx.closePath();
              lol.ctx.fill();
              }
            break;
          case 3: case 9:
            if(i===0)
              {
              lol.color.set(lol.color.pal[p][c+((n===3)?1:-1)]);
              lol.ctx.fillRect(a,y,b-a,1);
              lol.color.set(lol.color.pal[p][c]);
              lol.ctx.beginPath();
              while(x<b){if(x%2===1){lol.plot.pixel({x:x,y:y});}x+=1;}
              lol.ctx.closePath();
              lol.ctx.fill();
              }
            else
              {
              lol.color.set(lol.color.pal[p][c]);
              lol.ctx.fillRect(a,y,b-a,1);
              }
            break;
          case 4: case 8:
            if(i===0)
              {
              lol.color.set(lol.color.pal[p][c+((n===4)?1:-1)]);
              lol.ctx.fillRect(a,y,b-a,1);
              lol.color.set(lol.color.pal[p][c]);
              lol.ctx.beginPath();
              while(x<b){if(x%2===1){lol.plot.pixel({x:x,y:y});}x+=1;}
              lol.ctx.closePath();
              lol.ctx.fill();
              }
            else
              {
              lol.color.set(lol.color.pal[p][c]);
              lol.ctx.fillRect(a,y,b-a,1);
              if(y%4===1)
                {
                lol.color.set(lol.color.pal[p][c+((n===4)?1:-1)]);
                lol.ctx.beginPath();
                while(x<b){if((x+i)%4===2){lol.plot.pixel({x:x,y:y});}x+=1;}
                lol.ctx.closePath();
                lol.ctx.fill();
                }
              }
            break;
          case 5: case 7:
            lol.color.set(lol.color.pal[p][c]);
            lol.ctx.fillRect(a,y,b-a,1);
            lol.color.set(lol.color.pal[p][c+((n===5)?1:-1)]);
            lol.ctx.beginPath();
            if(i===0)
              {
              while(x<b){if(x%2===0){lol.plot.pixel({x:x,y:y});}x+=1;}
              }
            else
              {
              m=(y%4===1)?1:3;
              while(x<b){if(x%4===m){lol.plot.pixel({x:x,y:y});}x+=1;}
              }
            lol.ctx.closePath();
            lol.ctx.fill();
            break;
          case 6:
            lol.color.set(lol.color.pal[p][c-1]);
            lol.ctx.fillRect(a,y,b-a,1);
            lol.color.set(lol.color.pal[p][c]);
            lol.ctx.beginPath();
            while(x<b){if((x+i)%2===1){lol.plot.pixel({x:x,y:y});}x+=1;}
            lol.ctx.closePath();
            lol.ctx.fill();
            break;
          }
        }
      x1+=xi1;
      x2+=xi2;
      y+=1;
      }
    },
  tri_top:function(v1,v2,v3,p,c,n)
    {
    var i,x,y,w=lol.w-1,h=lol.h-1,m,xi1,xi2,x1,x2,a,b;
    if(v1.x<0&&v2.x<0&&v3.x<0){return false;}
    if(v1.x>w&&v2.x>w&&v3.x>w){return false;}
    if(v1.y<0&&v2.y<0&&v3.y<0){return false;}
    if(v1.y>h&&v2.y>h&&v3.y>h){return false;}
    if((v3.y-v1.y)===0||(v3.y-v2.y)===0){return false;}
    xi1=(v3.x-v1.x)/(v3.y-v1.y);
    xi2=(v3.x-v2.x)/(v3.y-v2.y);
    x1=v3.x;
    x2=v3.x;
    y=v3.y-1;
    lol.color.set(lol.color.pal[p][c]);
    while(y>=v1.y)
      {
      x1-=xi1;
      x2-=xi2;
      if(y>-1&&y<lol.h)
        {
        if(x1<x2){a=x1;b=x2;}else{a=x2;b=x1;}
        a=Math.round(a).clamp(0,lol.w);
        b=Math.round(b+1).clamp(0,lol.w);
        i=y%2;
        x=a;
        switch(n)
          {
          case 0:
            lol.ctx.fillRect(a,y,b-a,1);
            break;
          case 1: case 11:
            lol.color.set(lol.color.pal[p][c]);
            lol.ctx.fillRect(a,y,b-a,1);
            if(y%4===0)
              {
              lol.color.set(lol.color.pal[p][c+((n===1)?1:-1)]);
              lol.ctx.beginPath();
              while(x<b){if(x%4===0){lol.plot.pixel({x:x,y:y});}x+=1;}
              lol.ctx.closePath();
              lol.ctx.fill();
              }
            break;
          case 2: case 10:
            lol.color.set(lol.color.pal[p][c]);
            lol.ctx.fillRect(a,y,b-a,1);
            if(i===0)
              {
              lol.color.set(lol.color.pal[p][c+((n===2)?1:-1)]);
              lol.ctx.beginPath();
              m=(y%4===0)?2:4;
              while(x<b){if(x%m===0){lol.plot.pixel({x:x,y:y});}x+=1;}
              lol.ctx.closePath();
              lol.ctx.fill();
              }
            break;
          case 3: case 9:
            if(i===0)
              {
              lol.color.set(lol.color.pal[p][c+((n===3)?1:-1)]);
              lol.ctx.fillRect(a,y,b-a,1);
              lol.color.set(lol.color.pal[p][c]);
              lol.ctx.beginPath();
              while(x<b){if(x%2===1){lol.plot.pixel({x:x,y:y});}x+=1;}
              lol.ctx.closePath();
              lol.ctx.fill();
              }
            else
              {
              lol.color.set(lol.color.pal[p][c]);
              lol.ctx.fillRect(a,y,b-a,1);
              }
            break;
          case 4: case 8:
            if(i===0)
              {
              lol.color.set(lol.color.pal[p][c+((n===4)?1:-1)]);
              lol.ctx.fillRect(a,y,b-a,1);
              lol.color.set(lol.color.pal[p][c]);
              lol.ctx.beginPath();
              while(x<b){if(x%2===1){lol.plot.pixel({x:x,y:y});}x+=1;}
              lol.ctx.closePath();
              lol.ctx.fill();
              }
            else
              {
              lol.color.set(lol.color.pal[p][c]);
              lol.ctx.fillRect(a,y,b-a,1);
              if(y%4===1)
                {
                lol.color.set(lol.color.pal[p][c+((n===4)?1:-1)]);
                lol.ctx.beginPath();
                while(x<b){if((x+i)%4===2){lol.plot.pixel({x:x,y:y});}x+=1;}
                lol.ctx.closePath();
                lol.ctx.fill();
                }
              }
            break;
          case 5: case 7:
            lol.color.set(lol.color.pal[p][c]);
            lol.ctx.fillRect(a,y,b-a,1);
            lol.color.set(lol.color.pal[p][c+((n===5)?1:-1)]);
            lol.ctx.beginPath();
            if(i===0)
              {
              while(x<b){if(x%2===0){lol.plot.pixel({x:x,y:y});}x+=1;}
              }
            else
              {
              m=(y%4===1)?1:3;
              while(x<b){if(x%4===m){lol.plot.pixel({x:x,y:y});}x+=1;}
              }
            lol.ctx.closePath();
            lol.ctx.fill();
            break;
          case 6:
            lol.color.set(lol.color.pal[p][c-1]);
            lol.ctx.fillRect(a,y,b-a,1);
            lol.color.set(lol.color.pal[p][c]);
            lol.ctx.beginPath();
            while(x<b){if((x+i)%2===1){lol.plot.pixel({x:x,y:y});}x+=1;}
            lol.ctx.closePath();
            lol.ctx.fill();
            break;
          }
        }
      y-=1;
      }
    },
  disc:function(p,r)
    {
    var i=0,rx=r/lol.pr.w,ry=r/lol.pr.h,x,y,py=0;
    lol.ctx.beginPath();
    while(i<90)
      {
      x=Math.round(rx*Math.sin(i*lol.ar));
      y=Math.round(ry*Math.cos(i*lol.ar));
      if(y!==py&&p.y+y>-1&&p.y-y<lol.h)
        {
        lol.ctx.rect(p.x+x,p.y-y,-x*2,1+(py-y));
        lol.ctx.rect(p.x+x,p.y+y,-x*2,1+(py-y));
        }
      py=y;
      i+=1;
      }
    lol.ctx.closePath();
    lol.ctx.fill();
    }
  };

lol.render=function()
  {
  var i,k,l,n,test=true,max,vec,mtx,x,y,a,b,c,d,v,t,lm,ln,ls,sm,
  vr=[],vp=[],vt=[],vs=[],tri=lol.data.tri;
  lol.co=lol.matrix.mul(lol.vector.o,lol.matrix.rotate(lol.cr));
  lm=lol.matrix.rotate(lol.vector.neg(lol.lr));
  ls=lol.vector.norm(lol.matrix.mul(lol.light,lm));
  ln=lol.vector.norm(lol.matrix.mul(lol.light,lol.matrix.rotate(lol.lr)));
  sm=lol.matrix.shadow(ls);
  mtx=[lol.matrix.rotate(lol.r)];//,lol.matrix.rotate({x:0,y:lol.r.y,z:0})];
  lol.data.vtx.forEach(function(v,i)
    {
    vr[i]=v.dat;
    if(v.grp!==0)
      {
      vr[i]=lol.matrix.mul(v.dat,mtx[v.grp-1]);
      if(v.grp===1){vr[i]=lol.vector.add(vr[i],lol.p);}
      }
    vp[i]=lol.vector.project(vr[i]);
    vt[i]=lol.vector.transform(vp[i]);
    vs[i]=lol.vector.transform(lol.vector.project(lol.matrix.mul(vr[i],sm)));
    });
  tri.forEach(function(v,i)
    {
    v.raw=[vr[v.dat[0]],vr[v.dat[1]],vr[v.dat[2]]]; /* raw positions */
    v.prj=[vp[v.dat[0]],vp[v.dat[1]],vp[v.dat[2]]]; /* world projection */
    v.t2d=[vt[v.dat[0]],vt[v.dat[1]],vt[v.dat[2]]]; /* 2d transformation */
    v.cull=lol.vector.normal2d(v.t2d).z;
    if(i>=lol.hzn.n)
      {
      v.fct=
        {
        x:(v.prj[0].x+v.prj[1].x+v.prj[2].x)/3,
        y:(v.prj[0].y+v.prj[1].y+v.prj[2].y)/3,
        z:(v.prj[0].z+v.prj[1].z+v.prj[2].z)/3
        };
      v.norm=lol.vector.normal(v.prj);
      v.lgt=-lol.vector.dot(lol.vector.normal(v.raw),ln)/2;
      v.sdw=[vs[v.dat[0]],vs[v.dat[1]],vs[v.dat[2]]];
      v.sdc=lol.vector.normal2d(v.sdw).z;
      }
    });
  n=tri.length;
  while(test) /* bubble sort */
    {
    test=false;
    i=1+lol.hzn.n; /* skip horizon polygons */
    while(i<n)
      {
      if(tri[i-1].fct.z>tri[i].fct.z)
        {
        t=tri[i-1];tri[i-1]=tri[i];tri[i]=t;
        test=true;
        }
      i+=1;
      }
    n-=1;
    }
  n=tri.length;
  lol.ctx.clearRect(0,0,lol.w,lol.h); /* clear viewport */
  //lol.ctx.fillStyle='rgba('+lol.color.bgd.join(',')+','+',0.5)';
  //lol.ctx.fillRect(0,0,lol.w,lol.h);
  if(lol.flag.get('light')&&lol.lr.x>0&&lol.lr.x<180)
    {
    ls=lol.vector.norm(lol.matrix.mul(lol.light,lm));
    vec=lol.vector.mul(ls,{x:lol.hzn.l,y:lol.hzn.l,z:lol.hzn.l});
    lol.color.set(lol.color.pal[0][2]);
    lol.fill.disc(lol.vector.transform(lol.vector.project(vec)),42);
    lol.color.set(lol.color.pal[6][Math.round(lol.color.n/4)]);
    lol.fill.disc(lol.vector.transform(lol.vector.project(vec)),24);
    }
  if(lol.flag.get('star'))
    {
    v=Math.floor(lol.star.length/lol.color.n);
    i=0;
    k=0;
    while(i<lol.color.n)
      {
      lol.color.set(lol.color.pal[6][i]);
      lol.ctx.beginPath();
      k=v*i;
      while(k<v*i+v)
        {
        lol.plot.pixel(lol.vector.transform(lol.vector.project(lol.star[k])));
        k+=1;
        }
      lol.ctx.closePath();
      lol.ctx.fill();
      i+=1;
      }
    }
  if(lol.flag.get('light')&&lol.lr.x>0&&lol.lr.x<180)
    {
    lol.color.set(lol.color.pal[6][Math.round(lol.color.n/4*3)]);
    lol.fill.disc(lol.vector.transform(lol.vector.project(vec)),18);
    }
  if(lol.flag.get('face'))
    {
    i=0;
    while(i<lol.hzn.n)
      {
      t=tri[i];
      if(t.cull<0)
        {
        lol.fill.triangle(t.t2d[0],t.t2d[1],t.t2d[2],t.col,t.idx,0);
        }
      i+=1;
      }
    }
  if(lol.flag.get('star'))
    {
    lol.color.set(lol.color.pal[0][0]);
    lol.ctx.beginPath();
    lol.sand.forEach(function(v)
      {
      vec=lol.vector.project(v);
      var p=lol.vector.transform(vec);
      lol.plot.pixel(p);
      if(vec.z>-48)
        {
        lol.plot.pixel({x:p.x+1,y:p.y});
        lol.plot.pixel({x:p.x,y:p.y-1});
        lol.plot.pixel({x:p.x+1,y:p.y-1});
        }
      else if(vec.z>-192)
        {
        lol.plot.pixel({x:p.x+1,y:p.y});
        }
      });
    lol.ctx.closePath();
    lol.ctx.fill();
    }
  if(lol.flag.get('horizon'))
    {
    lol.color.set(lol.color.pal[0][1]);
    lol.plot.circle({x:0,y:lol.axis.y,z:0},lol.hzn.l,4,45);
    lol.plot.circle({x:0,y:lol.axis.y,z:0},1024,8,360/16);
    lol.plot.circle({x:0,y:lol.axis.y,z:0},256,16,360/32);
    lol.plot.circle({x:0,y:lol.axis.y,z:0},64,16,360/32);
    lol.plot.circle({x:0,y:lol.axis.y,z:0},16,24,360/48);
    lol.plot.circle({x:0,y:lol.axis.y,z:0},8,4,45);
    }
  if(lol.flag.get('axis'))
    {
    lol.color.set(lol.color.pal[0][2]);
    a=lol.vector.project({x:0,y:lol.axis.y,z:lol.hzn.l});
    b=lol.vector.project({x:0,y:lol.axis.y,z:-lol.hzn.l});
    if(a.z!==b.z){v=lol.vector.inter3d(a,b);if(a.z>b.z){a=v;}else{b=v;}}
    lol.plot.line(lol.vector.transform(a),lol.vector.transform(b));
    a=lol.vector.project({x:-lol.hzn.l,y:lol.axis.y,z:0});
    b=lol.vector.project({x:lol.hzn.l,y:lol.axis.y,z:0});
    if(a.z!==b.z){v=lol.vector.inter3d(a,b);if(a.z>b.z){a=v;}else{b=v;}}
    lol.plot.line(lol.vector.transform(a),lol.vector.transform(b));
    lol.color.set(lol.color.pal[0][1]);
    a=lol.vector.project({x:-lol.hzn.l,y:lol.axis.y,z:-lol.hzn.l});
    b=lol.vector.project({x:lol.hzn.l,y:lol.axis.y,z:lol.hzn.l});
    if(a.z!==b.z){v=lol.vector.inter3d(a,b);if(a.z>b.z){a=v;}else{b=v;}}
    lol.plot.line(lol.vector.transform(a),lol.vector.transform(b));
    a=lol.vector.project({x:lol.hzn.l,y:lol.axis.y,z:-lol.hzn.l});
    b=lol.vector.project({x:-lol.hzn.l,y:lol.axis.y,z:lol.hzn.l});
    if(a.z!==b.z){v=lol.vector.inter3d(a,b);if(a.z>b.z){a=v;}else{b=v;}}
    lol.plot.line(lol.vector.transform(a),lol.vector.transform(b));
    /* circle */
    lol.plot.circle({x:0,y:lol.axis.y,z:0},10,4);
    /* grid */
    l=1;
    k=10;
    vec=lol.vector.o;vec.y=lol.axis.y;
    i=0;
    lol.color.set(lol.color.pal[0][2]);
    while(i<=k)
      {
      if(i!==Math.round(k*0.5)) /* skip middle line */
        {
        x=k*l/2;
        y=-x+i*l;
        a=lol.vector.project(lol.vector.add(vec,{x:x,y:0,z:y}));
        b=lol.vector.project(lol.vector.add(vec,{x:-x,y:0,z:y}));
        if(a.z!==b.z){v=lol.vector.inter3d(a,b);if(a.z>b.z){a=v;}else{b=v;}}
        lol.plot.line(lol.vector.transform(a),lol.vector.transform(b));
        a=lol.vector.project(lol.vector.add(vec,{x:y,y:0,z:x}));
        b=lol.vector.project(lol.vector.add(vec,{x:y,y:0,z:-x}));
        if(a.z!==b.z){v=lol.vector.inter3d(a,b);if(a.z>b.z){a=v;}else{b=v;}}
        lol.plot.line(lol.vector.transform(a),lol.vector.transform(b));
        }
      i+=1;
      }
    }
  if(lol.flag.get('light')&&lol.lr.x>0&&lol.lr.x<180)
    {
    i=lol.hzn.n;
    while(i<n)
      {
      t=tri[i];
      if(t.type===0&&t.sdc<0)
        {
        lol.fill.triangle(t.sdw[0],t.sdw[1],t.sdw[2],0,1,0);
        }
      i+=1;
      }
    if(lol.flag.get('wireframe'))
      {
      lol.color.set(lol.color.pal[0][0]);
      i=lol.hzn.n;
      while(i<n)
        {
        t=tri[i];
        if(t.type===0)
          {
          lol.plot.line(t.sdw[0],t.sdw[1]);
          lol.plot.line(t.sdw[1],t.sdw[2]);
          lol.plot.line(t.sdw[2],t.sdw[0]);
          }
        i+=1;
        }
      }
    }
  if(lol.flag.get('normal'))
    {
    i=lol.hzn.n;
    while(i<n)
      {
      t=tri[i];
      if(t.cull<0||t.type!==0){i+=1;continue;}
      lol.color.set(lol.color.pal[0][5]);
      a=t.fct;
      b=lol.vector.sub(t.fct,lol.vector.mul(t.norm,lol.norm));
      //c=lol.vector.add(a,lol.vector.mul(t.prj[0],{x:0.2,y:0.2,z:0.2}));
      //d=lol.vector.add(a,lol.vector.mul(t.prj[1],{x:0.2,y:0.2,z:0.2}));
      //e=lol.vector.add(a,lol.vector.mul(t.prj[2],{x:0.2,y:0.2,z:0.2}));
      if(a.z!==b.z){v=lol.vector.inter3d(a,b);if(a.z>b.z){a=v;}else{b=v;}}
      a=lol.vector.transform(a);
      lol.plot.line(a,lol.vector.transform(b));
      //lol.plot.line(a,lol.vector.transform(c));
      //lol.plot.line(a,lol.vector.transform(d));
      //lol.plot.line(a,lol.vector.transform(e));
      lol.color.set(lol.color.pal[0][6]);
      lol.ctx.beginPath();
      lol.plot.pixel(a);
      lol.ctx.closePath();
      lol.ctx.fill();
      i+=1;
      }
    }
  if(lol.flag.get('wireframe')&&!lol.flag.get('face'))
    {
    lol.color.set(lol.color.pal[0][1]);
    i=0;
    while(i<n)
      {
      t=tri[i];
      if(t.cull>=0)
        {
        lol.plot.line(t.t2d[0],t.t2d[1]);
        lol.plot.line(t.t2d[1],t.t2d[2]);
        lol.plot.line(t.t2d[2],t.t2d[0]);
        }
      i+=1;
      }
    }
  if(lol.flag.get('face'))
    {
    max=(lol.color.n-1)*lol.color.d;
    i=lol.hzn.n;
    while(i<n)
      {
      t=tri[i];
      if(t.cull<0)
        {
        d=0;
        if(lol.flag.get('light'))
          {
          if(t.idx===null)
            {
            c=Math.round(t.lgt*max).clamp(0,max);
            if(lol.flag.get('dither')){d=c%lol.color.d;}
            }
          else
            {
            c=t.idx;
            }
          }
        else
          {
          c=(t.idx===null)?lol.color.n*lol.color.d/2:t.idx;
          }
        c=Math.round(c/lol.color.d);
        lol.fill.triangle(t.t2d[0],t.t2d[1],t.t2d[2],t.col,c,d);
        }
      else
        {
        if(t.type===2)
          {
          a=t.prj[0];
          b=t.prj[1];
          if(a.z!==b.z){v=lol.vector.inter3d(a,b);if(a.z>b.z){a=v;}else{b=v;}}
          lol.color.set(lol.color.pal[t.col][t.idx]);
          lol.plot.line(lol.vector.transform(a),lol.vector.transform(b));
          }
        }
      i+=1;
      }
    }
  if(lol.flag.get('axis'))
    {
    vec=lol.vector.o;vec.y=lol.axis.y;
    lol.color.set(lol.color.pal[0][4]);
    lol.plot.square(lol.vector.transform(lol.vector.project(vec)));
    }
  if(lol.flag.get('wireframe'))
    {
    lol.color.set(lol.color.pal[0][0]);
    i=0;
    while(i<n)
      {
      t=tri[i];
      if(t.cull<0)
        {
        lol.plot.line(t.t2d[0],t.t2d[1]);
        lol.plot.line(t.t2d[1],t.t2d[2]);
        lol.plot.line(t.t2d[2],t.t2d[0]);
        }
      i+=1;
      }
    }
  if(lol.flag.get('vertex')&&!lol.flag.get('face')&&!lol.flag.get('wireframe'))
    {
    lol.color.set(lol.color.pal[6][lol.color.n-1]);
    lol.ctx.beginPath();
    tri.forEach(function(v,i)
      {
      lol.plot.pixel(v.t2d[0]);
      lol.plot.pixel(v.t2d[1]);
      lol.plot.pixel(v.t2d[2]);
    /*if(i>=lol.hzn.n)
        {
        lol.plot.pixel(v.sdw[0]);
        lol.plot.pixel(v.sdw[1]);
        lol.plot.pixel(v.sdw[2]);
        }*/
      });
    lol.ctx.closePath();
    lol.ctx.fill();
    }
  if(lol.flag.get('normal'))
    {
    i=lol.hzn.n;
    while(i<n)
      {
      t=tri[i];
      if(t.cull>=0||t.type!==0){i+=1;continue;}
      lol.color.set(lol.color.pal[0][5]);
      a=t.fct;
      b=lol.vector.sub(t.fct,lol.vector.mul(t.norm,lol.norm));
      //c=lol.vector.add(a,lol.vector.mul(t.prj[0],{x:0.2,y:0.2,z:0.2}));
      //d=lol.vector.add(a,lol.vector.mul(t.prj[1],{x:0.2,y:0.2,z:0.2}));
      //e=lol.vector.add(a,lol.vector.mul(t.prj[2],{x:0.2,y:0.2,z:0.2}));
      if(a.z!==b.z){v=lol.vector.inter3d(a,b);if(a.z>b.z){a=v;}else{b=v;}}
      a=lol.vector.transform(a);
      lol.plot.line(a,lol.vector.transform(b));
      //lol.plot.line(a,lol.vector.transform(c));
      //lol.plot.line(a,lol.vector.transform(d));
      //lol.plot.line(a,lol.vector.transform(e));
      lol.color.set(lol.color.pal[0][6]);
      lol.ctx.beginPath();
      lol.plot.pixel(a);
      lol.ctx.closePath();
      lol.ctx.fill();
      i+=1;
      }
    }
  if(lol.flag.get('axis'))
    {
    lol.color.set(lol.color.pal[0][5]);
    lol.plot.arrow(2,0.25,lol.axis,{x:0,y:-90,z:0});
    lol.color.set(lol.color.pal[0][7]);
    lol.plot.arrow(2,0.25,lol.axis,{x:90,y:0,z:0});
    lol.color.set(lol.color.pal[0][6]);
    lol.plot.arrow(2,0.25,lol.axis,{x:0,y:180,z:0});
    lol.color.set(lol.color.pal[1][lol.color.n-1]);
    lol.plot.square(lol.vector.transform(lol.vector.project(lol.axis)));
    }
  if(lol.flag.get('axis')&&lol.flag.get('light'))
    {
    vec=lol.vector.add(lol.vector.mul(ls,{x:6,y:6,z:6}),lol.p);
    a=lol.vector.project(vec);
    v=lol.matrix.mul({x:0,y:0,z:2},lm);
    b=lol.vector.project(lol.vector.add(v,vec));
    v=lol.matrix.mul({x:-0.125,y:0,z:1.75},lm);
    c=lol.vector.project(lol.vector.add(v,vec));
    v=lol.matrix.mul({x:0.125,y:0,z:1.75},lm);
    d=lol.vector.project(lol.vector.add(v,vec));
    lol.color.set(lol.color.pal[0][8]);
    if(a.z!==b.z){v=lol.vector.inter3d(a,b);if(a.z>b.z){a=v;}else{b=v;}}
    lol.plot.line(lol.vector.transform(a),lol.vector.transform(b));
    if(b.z!==c.z){v=lol.vector.inter3d(b,c);if(b.z>c.z){b=v;}else{c=v;}}
    lol.plot.line(lol.vector.transform(b),lol.vector.transform(c));
    if(b.z!==d.z){v=lol.vector.inter3d(b,d);if(b.z>d.z){b=v;}else{d=v;}}
    lol.plot.line(lol.vector.transform(b),lol.vector.transform(d));
    if(c.z!==d.z){v=lol.vector.inter3d(c,d);if(c.z>d.z){c=v;}else{d=v;}}
    lol.plot.line(lol.vector.transform(c),lol.vector.transform(d));
    lol.color.set(lol.color.pal[0][9]);
    lol.plot.square(lol.vector.transform(lol.vector.project(lol.p)));
    lol.plot.square(lol.vector.transform(lol.vector.project(vec)));
    }
  };

lol.anim=
  {
  timer:0,
  update:function()
    {
    var vec;
    lol.render();
    vec=lol.r;
    lol.console.log('mesh rx',lol.util.sign(vec.x)+vec.x.toFixed(1)+'°');
    lol.console.log('mesh ry',lol.util.sign(vec.y)+vec.y.toFixed(1)+'°');
    lol.console.log('mesh rz',lol.util.sign(vec.z)+vec.z.toFixed(1)+'°');
    lol.console.hr(5);
    vec=lol.lr;
    lol.console.log('light rx',lol.util.sign(vec.x)+vec.x.toFixed(1)+'°');
    lol.console.log('light ry',lol.util.sign(vec.y)+vec.y.toFixed(1)+'°');
    lol.console.log('light rz',lol.util.sign(vec.z)+vec.z.toFixed(1)+'°');
    lol.console.hr(6);
    vec=lol.cam;
    lol.console.log('cam px',lol.util.sign(vec.x)+vec.x.toFixed(1));
    lol.console.log('cam py',lol.util.sign(vec.y)+vec.y.toFixed(1));
    lol.console.log('cam pz',lol.util.sign(vec.z)+vec.z.toFixed(1));
    vec=lol.cr;
    lol.console.log('cam rx',lol.util.sign(vec.x)+vec.x.toFixed(1)+'°');
    lol.console.log('cam ry',lol.util.sign(vec.y)+vec.y.toFixed(1)+'°');
    lol.console.log('cam rz',lol.util.sign(vec.z)+vec.z.toFixed(1)+'°');
    lol.console.log('reset cam',null,function()
      {
      lol.cam={x:0,y:0,z:-16};
      lol.cr={x:0,y:0,z:0};
      lol.config.cam=lol.cam;
      lol.config.cr=lol.cr;
      lol.localstorage.save();
      lol.anim.update();
      });
    lol.console.hr(7);
    lol.fps.update();
    lol.anim.timer=lol.util.time();
    },
  loop:function()
    {
    lol.anim.rotate();
    lol.anim.update();
    lol.rid=window.requestAnimationFrame(lol.anim.loop);
    },
  rotate:function()
    {
    var a=(lol.util.time()-lol.timer)/16;
    lol.r.x=(lol.cr.x+a/2)%360;
    lol.r.y=(lol.cr.y+a)%360;
    lol.r.z=(lol.cr.z+a/2)%360;
    },
  start:function()
    {
    lol.timer=lol.util.time();
    lol.config.anim=true;
    lol.localstorage.save();
    lol.console.log('anim',true,function(){lol.anim.pause();});
    lol.i('anim-cb').className='cb2';
    lol.anim.loop();
    },
  stop:function()
    {
    window.cancelAnimationFrame(lol.rid);
    lol.rid=false;
    lol.config.anim=false;
    lol.localstorage.save();
    lol.console.log('anim',false,function(){lol.anim.pause();});
    lol.i('anim-cb').className='cb1';
    lol.fps.reset();
    },
  pause:function(){lol.anim[lol.config.anim?'stop':'start']();}
  };

lol.fps=
  {
  unit:60,
  h:40,
  ds:2,
  col:{},
  el:false,
  iid:false,
  init:function()
    {
    lol.fps.col.bar=lol.color.pal[0][2];
    lol.fps.col.dot=lol.color.pal[0][3];
    lol.fps.reset();
    lol.console.log('fps','---');
    var i=0,el=lol.el('div');
    el.id=lol.id+'-fps';
    el.style.width=lol.console.w+'px';
    el.style.height=lol.fps.h+'px';
    el.style.margin='2px 0px 2px 0px';
    el.style.backgroundColor=lol.color.pal[0][0];
    lol.i(lol.id+'-console').appendChild(el);
    lol.fps.el=lol.i(lol.id+'-fps');
    while(i<Math.round(lol.console.w/lol.fps.ds)){lol.fps.dot(0);i+=1;}
    lol.fps[lol.config.console?'start':'stop']();
    },
  update:function()
    {
    var fps=1000/(lol.util.time()-lol.anim.timer);
    lol.fps.n+=1;
    lol.fps.min=Math.min(lol.fps.min,fps);
    lol.fps.max=Math.max(lol.fps.max,fps);
    lol.fps.total+=fps;
    },
  start:function()
    {
    if(lol.fps.iid){window.clearInterval(lol.fps.iid);}
    lol.fps.iid=window.setInterval(lol.fps.trace,1000);
    },
  stop:function()
    {
    window.clearInterval(lol.fps.iid);
    lol.fps.iid=false;
    },
  trace:function()
    {
    var fps=Math.round(lol.fps.total/lol.fps.n);
    if(Number.isNaN(fps)){fps=0;}
    lol.console.log('fps',(fps>0)?('000'+fps).slice(-3):'---');
    lol.fps.del();
    lol.fps.dot(fps);
    lol.fps.reset();
    },
  dot:function(fps)
    {
    var h,e1,e2;
    h=Math.round((lol.fps.h/lol.fps.unit)*fps).clamp(0,lol.fps.h);
    e1=lol.el('div');
    e1.style.width=lol.fps.ds+'px';
    e1.style.height=lol.fps.h+'px';
    e1.style.float='left';
    if(fps>0)
      {
      e2=lol.el('div');
      e2.style.width=lol.fps.ds+'px';
      e2.style.height=(h-1)+'px';
      e2.style.marginTop=(lol.fps.h-h)+'px';
      e2.style.backgroundColor=lol.fps.col.bar;
      e2.style.borderTop='1px solid '+lol.fps.col.dot;
      e1.appendChild(e2);
      }
    lol.fps.el.appendChild(e1);
    },
  del:function()
    {
    var el=lol.fps.el.firstChild;
    if(lol.util.isobject(el)){lol.fps.el.removeChild(el);}
    },
  reset:function()
    {
    lol.fps.n=0;
    lol.fps.min=0;
    lol.fps.max=0;
    lol.fps.total=0;
    }
  };

lol.mouse=
  {
  o:{x:0,y:0},
  click:false,
  log:function(e)
    {
    e=e||window.event;
    var log=(e.pageX-lol.mouse.o.x)+'*'+(e.pageY-lol.mouse.o.y);
    //log+=' ('+(lol.mouse.click?'d':'u')+')';
    lol.console.log('csr',log);
    },
  move:function(e)
    {
    e=e||window.event;
    var x,y;
    y=-((e.pageX-lol.mouse.o.x)/window.innerWidth)*180;
    x=((e.pageY-lol.mouse.o.y)/window.innerHeight)*180;
    if(lol.mouse.click)
      {
      if(!lol.key.shift&&!lol.key.ctrl&&!lol.key.alt)
        {
        lol.cam.x=lol.vec.x+y/10;
        lol.cam.z=lol.vec.z+x/10;
        }
      if(lol.key.shift)
        {
        lol.r.y=(lol.vec.y+y)%360;
        lol.r.x=(lol.vec.x+x)%360;
        }
      if(lol.key.ctrl)
        {
        lol.cr.y=(lol.vec.y+y)%360;
        lol.cr.x=(lol.vec.x+x)%360;
        }
      if(lol.key.alt)
        {
        lol.lr.y=(lol.vec.y-y)%360;
        lol.lr.x=(lol.vec.x-x)%360;
        }
      if(!lol.config.anim){lol.anim.update();}
      }
    e.preventDefault();
    lol.mouse.log(e);
    },
  down:function(e)
    {
    e=e||window.event;
    lol.mouse.o={x:e.pageX,y:e.pageY};
    if(!lol.key.shift&&!lol.key.ctrl&&!lol.key.alt)
      {
      lol.vec=lol.util.clone(lol.cam);
      lol.config.cam=lol.cam;
      }
    if(lol.key.shift)
      {
      lol.vec=lol.util.clone(lol.r);
      lol.config.r=lol.r;
      }
    if(lol.key.ctrl)
      {
      lol.vec=lol.util.clone(lol.cr);
      lol.config.cr=lol.cr;
      }
    if(lol.key.alt)
      {
      lol.vec=lol.util.clone(lol.lr);
      lol.config.lr=lol.lr;
      }
    lol.mouse.click=true;
    lol.mouse.log(e);
    },
  up:function(e)
    {
    e=e||window.event;
    lol.vec=lol.util.clone(lol.vector.o);
    lol.mouse.click=false;
    lol.mouse.log(e);
    lol.localstorage.save();
    },
  wheel:function(e)
    {
    e=e||window.event;
    var delta=e.wheelDelta/120;
    lol.cam.y+=delta*0.5;
    lol.localstorage.save();
    if(!lol.config.anim){lol.anim.update();}
    e.preventDefault();
    }
  };

lol.key=
  {
  shift:false,
  alt:false,
  ctrl:false,
  log:function(e)
    {
    e=e||{};
    var log='',test=false;
    log=(e.type==='keydown')?String('00'+e.keyCode).slice(-3):'---';
    lol.key.shift=e.shiftKey;
    lol.key.alt=e.altKey;
    lol.key.ctrl=e.ctrlKey;
    if(lol.key.shift){log+=' (shift';test=true;}
    if(lol.key.alt){log+=(test?'+':' (')+'alt';test=true;}
    if(lol.key.ctrl){log+=(test?'+':' (')+'ctrl';test=true;}
    if(test){log+=')';}
    lol.console.log('key',log);
    },
  down:function(e)
    {
    e=e||window.event;
    lol.key.log(e);
    },
  up:function(e)
    {
    e=e||window.event;
    lol.key.log(e);
    switch(e.keyCode)
      {
      case 27:lol.console.swap();break; /* esc */
      case 32:lol.anim.pause();break;   /* space */
      case 13:lol.flag.swap('scanline');break;  /* return */
      case 37:lol.cr.y=(lol.cr.y-22.5)%360;lol.anim.update();break; /* left  */
      case 39:lol.cr.y=(lol.cr.y+22.5)%360;lol.anim.update();break; /* right */
      case 38:lol.cr.x=(lol.cr.x-22.5)%360;lol.anim.update();break; /* up    */
      case 40:lol.cr.x=(lol.cr.x+22.5)%360;lol.anim.update();break; /* down  */
      case 72:lol.flag.swap('horizon');break;   /* h */
      case 65:lol.flag.swap('axis');break;      /* a */
      case 86:lol.flag.swap('vertex');break;    /* v */
      case 70:lol.flag.swap('face');break;      /* f */
      case 87:lol.flag.swap('wireframe');break; /* w */
      case 78:lol.flag.swap('normal');break;    /* n */
      case 76:lol.flag.swap('light');break;     /* l */
      case 83:lol.flag.swap('star');break;      /* s */
      case 68:lol.flag.swap('dither');break;    /* d */
      }
    }
  };

lol.mesh=
  {
  load:function(file)
    {
    var n=0,type,xhr,dat={},vtx=[],tri=[],col=[];
    type=file.substr(file.lastIndexOf('.')+1,file.length-1);
    xhr=new window.XMLHttpRequest();
    xhr.open('GET',file,false);
    xhr.setRequestHeader('Content-Type','application/'+type);
    xhr.send();
    dat=(xhr.status===200)?window.JSON.parse(xhr.responseText):{};
    vtx=vtx.concat(dat.meshes[n].vertices);
    dat.meshes[n].faces.forEach(function(v,i)
      {
      tri=tri.concat(v);
      col[i]=3;//((i%4)<2)?0:2;
      });
    return lol.mesh.norm({vtx:vtx,tri:tri,col:col});
    },
  format:function(mesh,cfg)//c,g,p,s,o)
    {
    mesh=mesh||{vtx:[],tri:[]};
    cfg=cfg||{};
    cfg.type=lol.util.isnumber(cfg.type)?cfg.type:0;
    cfg.col=lol.util.isnumber(cfg.col)?cfg.col:1;
    cfg.idx=lol.util.isnumber(cfg.idx)?cfg.idx:null;
    cfg.grp=lol.util.isnumber(cfg.grp)?cfg.grp:0;
    cfg.s=cfg.s||{x:1,y:1,z:1};
    cfg.r=cfg.r||{x:0,y:0,z:0};
    cfg.p=cfg.p||lol.vector.o;
    var i=0,k,n=0,vtx=[],tri=[],dat=[],tmp=[],mtx;
    while(i<mesh.vtx.length/3)
      {
      k=i*3;
      vtx[i]={x:mesh.vtx[k],y:mesh.vtx[k+1],z:mesh.vtx[k+2]};
      i+=1;
      }
    n=lol.data.vtx.length;
    tmp=mesh.tri.map(function(v){return v+n;});
    mtx=lol.matrix.rotate(lol.vector.add(lol.vector.o,cfg.r));
    vtx.forEach(function(v,i,a)
      {
      v=lol.vector.mul(v,cfg.s); /* scale */
      v=lol.matrix.mul(v,mtx);   /* rotation */
      v=lol.vector.add(v,cfg.p); /* position */
      a[i]={grp:cfg.grp,dat:v};
      });
    i=0;
    while(i<mesh.tri.length/3)
      {
      k=i*3;
      dat=[tmp[k],tmp[k+1],tmp[k+2]];
      tri[i]={type:cfg.type,dat:dat,col:cfg.col,idx:cfg.idx};
      i+=1;
      }
    lol.data.vtx=lol.data.vtx.concat(vtx);
    lol.data.tri=lol.data.tri.concat(tri);
    },
  norm:function(mesh)
    {
    var i=0,j=0,k=0,a,b,vtx=[],v=0;
    //console.log('vtx='+(mesh.vtx.length/3));
    while(i<mesh.vtx.length)
      {
      a={x:mesh.vtx[i],y:mesh.vtx[i+1],z:mesh.vtx[i+2]};
      if(a.x===null&&a.y===null&&a.z===null){i+=3;continue;}
      k=0;
      while(k<mesh.tri.length){if(mesh.tri[k]===i/3){mesh.tri[k]=v;}k+=1;}
      j=i+3;
      while(j<mesh.vtx.length)
        {
        b={x:mesh.vtx[j],y:mesh.vtx[j+1],z:mesh.vtx[j+2]};
        if(b.x===a.x&&b.y===a.y&&b.z===a.z)
          {
          mesh.vtx[j]=null;
          mesh.vtx[j+1]=null;
          mesh.vtx[j+2]=null;
          k=0;
          while(k<mesh.tri.length){if(mesh.tri[k]===j/3){mesh.tri[k]=v;}k+=1;}
          }
        j+=3;
        }
      v+=1;
      i+=3;
      }
    i=0;
    mesh.vtx.forEach(function(v){if(v!==null){vtx.push(v);}});
    mesh.vtx=vtx;
    //console.log('vtx='+(mesh.vtx.length/3));
    return mesh;
    }
  };

lol.flag=
  {
  list:
    {
    horizon:true,
    axis:true,
    vertex:false,
    face:true,
    wireframe:false,
    normal:false,
    light:true,
    dither:true,
    star:true,
    scanline:false
    },
  set:function(name,value)
    {
    if(!lol.util.isstring(name)){return false;}
    value=lol.util.isboolean(value)?value:Boolean(lol.config.flag[name]);
    lol.flag.list[name]=value;
    lol.config.flag[name]=value;
    lol.localstorage.save();
    lol.anim.update();
    lol.console.log(name,value,function(){lol.flag.swap(name);});
    lol.i(name+'-cb').className='cb'+(value?'2':'1');
    },
  get:function(name)
    {
    return (lol.flag.list[name]!=='undefined')?lol.flag.list[name]:false;
    },
  swap:function(name)
    {
    lol.flag.set(name,!lol.flag.get(name));
    if(!lol.util.isobject(lol[name])){return false;}
    if(lol.util.isfunction(lol[name].swap)){lol[name].swap();}
    }
  };

lol.util=
  {
  isboolean:function(v){if(typeof v==='boolean'){return true;}return false;},
  isnumber:function(v){if(typeof v==='number'){return true;}return false;},
  isstring:function(v){if(typeof v==='string'){return true;}return false;},
  isobject:function(v){if(typeof v==='object'){return true;}return false;},
  isfunction:function(v){if(typeof v==='function'){return true;}return false;},
  isempty:function(obj)
    {
    if(window.Object.getOwnPropertyNames(obj).length===0){return true;}
    return false;
    },
  isffx:function(){return (/firefox/i).test(window.navigator.userAgent);},
  copy:function(v){return v.slice(0);},
  clone:function(v){return Object.create({x:v.x,y:v.y,z:v.z});},
  sign:function(v)
    {
    v=parseFloat(Number(v).toFixed(1));
    if(v===0){return '&nbsp;';}
    if(v<0){return '';}
    if(v>0){return '+';}
    },
  random:function(n)
    {
    var i=0,type,start,len,rnd='';
    while(i<n)
      {
      type=Math.round(Math.random()*2);
      if(type===0)
        {
        start=48;
        len=10;
        }
      else
        {
        start=(Math.round(Math.random()*2)%2===0)?65:97;
        len=26;
        }
      rnd+=String.fromCharCode(start+Math.floor(Math.random()*len));
      i+=1;
      }
    return rnd;
    },
  interpolate:function(from,to,n,i){return from+(to-from)/n*i;},
  time:function(){return (new Date()).getTime();}
  };

lol.localstorage=
  {
  available:function()
    {
    if(window.hasOwnProperty('localStorage')){return true;}
    return false;
    },
  get:function()
    {
    var dat={};
    if(lol.localstorage.available())
      {
      dat=window.JSON.parse(window.localStorage.getItem(lol.id));
      }
    return (dat!==null)?dat:{};
    },
  save:function()
    {
    if(lol.localstorage.available())
      {
      window.localStorage.setItem(lol.id,window.JSON.stringify(lol.config));
      }
    },
  reset:function()
    {
    if(lol.localstorage.available()){delete window.localStorage[lol.id];}
    }
  };

lol.console=
  {
  w:116,
  list:{},
  init:function()
    {
    var el=lol.i(lol.id+'-console');
    if(el!==null){return false;}
    el=lol.el('div');
    el.id=lol.id+'-console';
    el.style.position='absolute';
    el.style.left=(lol.color.w+lol.m*2)+'px';
    el.style.top=lol.m+'px';
    el.style.width=lol.console.w+'px';
    el.style.font='normal 11px/11px monospace';
    el.style.color=lol.color.pal[0][3];
    el.style.cursor='default';
    el.style.display=lol.config.console?'block':'none';
    el.style.overflow='hidden';
    el.style.zIndex=2;
    el.className='sel';
    el.addEventListener('selectstart',function(){return false;},false);
    el.addEventListener('dragstart',function(){return false;},false);
    window.document.body.appendChild(el);
    },
  log:function(name,value,handler,param)
    {
    lol.console.list[name]=value;
    var el=lol.i(lol.id+'-console-'+name),v,log=name;
    if(el===null){lol.console.add(name,value,handler,param);}
    v=lol.i(lol.id+'-console-'+name+'-value');
    if(lol.util.isboolean(value)){log='<u>'+name[0]+'</u>'+name.slice(1);}
    if(lol.util.isstring(value)){log+=':<a style="float:right">'+value+'</a>';}
    if(lol.util.isnumber(value)){log+='='+(Math.round(value*100)/100);}
    v.innerHTML=log;
    },
  add:function(name,value,handler,param)
    {
    var el=lol.el('div'),v,fn,btn;
    el.id=lol.id+'-console-'+name;
    el.style.width=lol.console.w+'px';
    v=lol.el('a');
    v.id=el.id+'-value';
    el.appendChild(v);
    if(lol.util.isfunction(handler)&&value===null)
      {
      btn=lol.el('div');
      btn.className='arrow';
      el.appendChild(btn);
      el.addEventListener('click',handler,false);
      fn=function(){lol.i(el.id).style.backgroundColor=lol.color.pal[0][0];};
      el.addEventListener('mouseover',fn,false);
      fn=function(){lol.i(el.id).style.backgroundColor='transparent';};
      el.addEventListener('mouseout',fn,false);
      el.style.cursor='pointer';
      }
    if(lol.util.isfunction(handler)&&lol.util.isboolean(value))
      {
      btn=lol.el('div');
      btn.id=name+'-cb';
      btn.className='cb'+(value?'2':'1');
      el.appendChild(btn);
      el.addEventListener('click',handler,false);
      fn=function(){lol.i(el.id).style.backgroundColor=lol.color.pal[0][0];};
      el.addEventListener('mouseover',fn,false);
      fn=function(){lol.i(el.id).style.backgroundColor='transparent';};
      el.addEventListener('mouseout',fn,false);
      el.style.cursor='pointer';
      }
    if(lol.util.isfunction(handler)&&lol.util.isnumber(value))
      {
      btn=lol.el('div');
      btn.className='more';
      btn.style.cursor='pointer';
      btn.param=param;
      btn.addEventListener('click',handler,false);
      el.appendChild(btn);
      btn=lol.el('div');
      btn.className='less';
      btn.style.cursor='pointer';
      btn.param=-param;
      btn.addEventListener('click',handler,false);
      el.appendChild(btn);
      }
    lol.i(lol.id+'-console').appendChild(el);
    },
  hr:function(id)
    {
    var el=lol.i(lol.id+'-console-'+id);
    if(el!==null){return false;}
    el=lol.el('div');
    el.id=lol.id+'-console-'+id;
    el.style.clear='both';
    el.style.backgroundColor=lol.color.pal[0][2];
    el.style.width=lol.console.w+'px';
    el.style.height='1px';
    el.style.margin='2px 0px 2px 0px';
    lol.i(lol.id+'-console').appendChild(el);
    },
  show:function()
    {
    lol.i(lol.id+'-console').style.display='block';
    lol.i(lol.id+'-palette').style.display='block';
    lol.fps.start();
    lol.config.console=true;
    lol.localstorage.save();
    },
  hide:function()
    {
    lol.i(lol.id+'-console').style.display='none';
    lol.i(lol.id+'-palette').style.display='none';
    lol.fps.stop();
    lol.config.console=false;
    lol.localstorage.save();
    },
  swap:function()
    {
    var el=lol.i(lol.id+'-console');
    lol.console[(el.style.display==='none')?'show':'hide']();
    }
  };

lol.validate=function()
  {
  var xhr=new window.XMLHttpRequest();
  xhr.open('GET',lol.i('code').src+'?lol='+lol.util.random(64),true);
  xhr.setRequestHeader('Content-Type','application/javascript');
  xhr.onreadystatechange=function()
    {
    if(xhr.readyState===4&&xhr.status===200)
      {
      var n,lint,err,txt='',el;
      lint=jslint(xhr.responseText);
      err=lint.warnings;
      n=err.length;
      txt=n+' error'+((n>0)?'s':'')+' found '+((n===0)?'\\:D/':':(');
      txt+='<table cellpadding="0" cellspacing="0">';
      err.forEach(function(v)
        {
        txt+='<tr><td>[</td>';
        txt+='<td align="right">'+(v.line+1)+',&nbsp;</td>';
        txt+='<td align="right">'+v.column+']&nbsp;</td>';
        txt+='<td>'+v.message+'</td></tr>';
        });
      txt+='</table>';
      el=lol.i(lol.id+'-validate');
      if(el===null)
        {
        el=lol.el('div');
        el.id=lol.id+'-validate';
        el.style.position='absolute';
        el.style.left=(lol.color.w+lol.console.w+lol.m*3)+'px';
        el.style.top=lol.m+'px';
        el.style.font='normal 11px/11px monospace';
        el.style.color=lol.color.pal[0][3];
        el.style.zIndex=2;
        el.className='sel';
        el.addEventListener('selectstart',function(){return false;},false);
        el.addEventListener('dragstart',function(){return false;},false);
        }
      el.innerHTML=txt;
      window.document.body.appendChild(el);
      }
    };
  xhr.send();
  };

lol.scanline=
  {
  init:function()
    {
    var i=0,j=0,a=0.1,cvs=lol.el('canvas'),ctx,el=lol.el('div');
    cvs.width=12;
    cvs.height=12;
    ctx=cvs.getContext('2d');
    while(j<cvs.height)
      {
      i=0;
      while(i<cvs.width)
        {
        ctx.fillStyle='rgba(248,64,32,'+a+')';
        ctx.fillRect(i+j%2,j,1,3);
        ctx.fillStyle='rgba(64,224,32,'+a+')';
        ctx.fillRect(i+j%2+1,j,1,3);
        ctx.fillStyle='rgba(64,64,224,'+a+')';
        ctx.fillRect(i+((j%2===0)?2:0),j,1,3);
        ctx.fillStyle='rgba(0,0,0,0.25)';
        ctx.fillRect(i,j+1,3,1);
        ctx.fillStyle='rgba(0,0,0,0.625)';
        ctx.fillRect(i,j+2,3,1);
        i+=3;
        }
      j+=3;
      }
    el.id=lol.id+'-scanline';
    el.style.position='absolute';
    el.style.display=lol.flag.get('scanline')?'block':'none';
    el.style.backgroundImage='url('+cvs.toDataURL()+')';
    el.style.zIndex=1;
    window.document.body.appendChild(el);
    },
  show:function()
    {
    lol.i(lol.id+'-scanline').style.display='block';
    lol.flag.set('scanline',true);
    },
  hide:function()
    {
    lol.i(lol.id+'-scanline').style.display='none';
    lol.flag.set('scanline',false);
    },
  swap:function()
    {
    var el=lol.i(lol.id+'-scanline');
    lol.scanline[(el.style.display==='none')?'show':'hide']();
    }
  };

lol.css=function()
  {
  var w,data,style,rule,n,cvs=lol.el('canvas'),ctx,map=[ /* 50*10 */
  '_XXXXXXXX__XXXXXXXX_____________XXXXXX____XXXXXX__',
  'XXXXXXXXXXXXXXXXXXXX___________X______X__X______X_',
  'XXXXXXXXXXXXXX__XXXX_____X____X________XX__XXXX__X',
  'XXXXXXXXXXXXXX__XXXX_____XX___X________XX_XXXXXX_X',
  'XX______XXXX______XX_XXXXXXX__X________XX_XXXXXX_X',
  'XX______XXXX______XX_XXXXXXXX_X________XX_XXXXXX_X',
  'XXXXXXXXXXXXXX__XXXX_XXXXXXX__X________XX_XXXXXX_X',
  'XXXXXXXXXXXXXX__XXXX_____XX___X________XX__XXXX__X',
  'XXXXXXXXXXXXXXXXXXXX_____X_____X______X__X______X_',
  '_XXXXXXXX__XXXXXXXX_____________XXXXXX____XXXXXX__'];
  cvs.width=map[0].length;
  cvs.height=map.length;
  ctx=cvs.getContext('2d');
  ctx.fillStyle=lol.color.pal[0][3];
  ctx.beginPath();
  map.forEach(function(v,y)
    {
    v.split('').forEach(function(v,x){if(v==='X'){ctx.rect(x,y,1,1);}});
    });
  ctx.closePath();
  ctx.fill();
  style=window.document.styleSheets[0];
  if(style.cssRules)
    {
    data=cvs.toDataURL();
    w=cvs.width/5;
    n=style.cssRules.length;
    rule='float:right;margin-left:1px;';
    rule+='width:'+w+'px;height:'+cvs.height+'px;';
    rule+='background-image:url(\''+data+'\')';
    style.insertRule('.less {'+rule+'}',n);
    rule='float:right;margin-left:1px;';
    rule+='width:'+w+'px;height:'+cvs.height+'px;';
    rule+='background-image:url(\''+data+'\');';
    rule+='background-position:-'+w+'px 0px';
    style.insertRule('.more {'+rule+'}',n+1);
    rule='float:left;margin-right:1px;';
    rule+='width:'+w+'px;height:'+cvs.height+'px;';
    rule+='background-image:url(\''+data+'\');';
    rule+='background-position:-'+(w*2)+'px 0px';
    style.insertRule('.arrow {'+rule+'}',n+2);
    rule='float:right;margin-left:1px;';
    rule+='width:'+w+'px;height:'+cvs.height+'px;';
    rule+='background-image:url(\''+data+'\');';
    rule+='background-position:-'+(w*3)+'px 0px';
    style.insertRule('.cb1 {'+rule+'}',n+3);
    rule='float:right;margin-left:1px;';
    rule+='width:'+w+'px;height:'+cvs.height+'px;';
    rule+='background-image:url(\''+data+'\');';
    rule+='background-position:-'+(w*4)+'px 0px';
    style.insertRule('.cb2 {'+rule+'}',n+4);
    }
  };

lol.icon=function()
  {
  var icon,img,cvs=lol.el('canvas'),ctx,map=[ /* 16*16 */
  '________________',
  '________________',
  '____XXXXXXXXXX__',
  '___XXXXXXXXXX___',
  '__XXXXXXXXXX_X__',
  '_XXXXXXXXXX_X___',
  'XXXXXXXXXX_X_X__',
  '__________X_X___',
  '_X_X_X_X_X_X_X__',
  '__________X_X___',
  '_X_X_X_X_X_X_X__',
  '__________X_X___',
  '_X_X_X_X_X_X____',
  '__________X_____',
  '_X_X_X_X_X______',
  '________________'];
  cvs.width=map[0].length;
  cvs.height=map.length;
  ctx=cvs.getContext('2d');
  ctx.fillStyle='rgba(0,0,0,0.6)';
  ctx.beginPath();
  map.forEach(function(v,y)
    {
    v.split('').forEach(function(v,x){if(v==='X'){ctx.rect(x,y,1,1);}});
    });
  ctx.closePath();
  ctx.fill();
  icon=lol.el('link');
  icon.rel='icon';
  icon.type='image/png';
  icon.href=cvs.toDataURL();
  window.document.head.appendChild(icon);
  img=lol.el('img');
  img.src=icon.href;
  img.width=cvs.width*lol.pr.w;
  img.height=cvs.height*lol.pr.h;
  img.style.float='right';
  img.style.imageRendering='pixelated';
  img.style.zIndex=1024;
  img.className='sel';
  window.document.body.appendChild(img);
  };

lol.init();
};
