"use strict";

//register a service worker

if ('serviceWorker' in navigator) {

  // sw.js can literally be empty, but must exist

  navigator.serviceWorker.register('/sw.js');

}

//globals

const resistance = 0.98;

const particleDespawnThreshold = 2;

let particleCounter = 0;

let particleMaxLimit = 200;

let spawnClearance = false;

let TOUCH;

let walls = {w: 0, h: 0};

//helpers

const pickRandom = (arr) => {

  return arr[~~(Math.random() * arr.length)];

};

const randInt = (min, max) => {

  return ~~ min + Math.random() * (max - min);

};

const randFloat = (min, max) => {

  return min + Math.random() * (max - min);

};

const randHSL = () => {

  return `hsl(${randInt(0, 360)}, 100%, 50%)`;

};

//classes

class ticker {

  constructor(fps){

    //fps control

    this.frameRate = fps ? fps : 60;

    this.frameInterval = 1000 / this.frameRate;

    this.time = 1; //speed of flow of time 

    let timeElapsed, Now,

    Then = (performance || Date).now();

    //for getting delta based on time

    let last = (performance || Date).now();

    let now, delta;

    

    this.callback = () => {};

    

    const mainLoop = () => {

      requestAnimationFrame(mainLoop);

      Now = (performance || Date).now();

      timeElapsed = Now - Then;

      if (timeElapsed > this.frameInterval) {

        Then = Now - (timeElapsed % this.frameRate);

       

        now = (performance || Date).now();

        delta = (now - last) * this.time;

        last = now;

        this.callback(delta);

      }

    };

    mainLoop();

  }

  

  onTick(callback){

    this.callback = callback;

  }

  

  setFrameRate(fps) {

    this.frameRate = fps;

    this.frameInterval = 1000 / fps;

  }

}

class scene {

  constructor(){

    this.children = [];

    this.count = 0;

  }

  

  add(...entities){

    this.count ++;

    for(let entity of entities) {

      if(!('type' in entity)) return;

      this.children.push(entity);

    }

  }

}

class renderer {

  constructor({ height, width, alpha, pixelRatio }){

    this.height = (height / window.innerHeight) * 100;

    this.width = (width / window.innerWidth) * 100;

    this.h = height;

    this.w = width;

    this.alpha = alpha ? alpha : false;

    this.pixelRatio = pixelRatio ? pixelRatio : 1;

    const canvas = document.createElement('canvas');

    Object.assign(canvas.style, {

      height: `${this.height}vh`,

      width:   `${this.width}vw`,

      background: '#000',

    });

    Object.assign(canvas, {

      height: this.pixelRatio * this.h,

      width:  this.pixelRatio * this.w,

      h: this.h,

      w: this.w,

    });

    this.domElement = canvas;

    this.context = canvas.getContext('2d');

  }

  

  clrScr(ctx){

    ctx.clearRect(

      0,

      0,

      this.domElement.width,

      this.domElement.height

    );

  }

  

  render(scene, delta){

    let ctx = this.context;

    this.clrScr(ctx);

    for (let [i, entity] of scene.children.entries()){

      //remove redundant entities 

      if (entity.redundant) {

        scene.children.splice(i, 1);

        scene.count --;

        continue;

      }

      const { x, y } = entity.position;

      const { color } = entity;

      switch(entity.type){

        case 'particle':

          ctx.beginPath();

          ctx.arc(x, y, entity.radius, 0, 2 * Math.PI);

          //ctx.shadowColor = color;

          //ctx.shadowBlur = 30;

          ctx.fillStyle = color;

          ctx.fill();

          ctx.closePath();

          entity.update(delta);

          break;

        case 'polygon':

          let { vertices, rotation } = entity;

          

          break;

        default:

          console.error(

            'Error: Unknown entity of type ${entity.type} detected'

          );

          break;

      }

    }

  }

}

class vec2 {

  constructor(X, Y){

    vec2.prototype.isVector2 = true;

    const x = X ? X : 0;

    const y = Y ? Y : 0;

    return {x , y};

  }

}

class particle {

  constructor(position, radius, color){

    this.type = 'particle'; //read only

    this.redundant = false;

    this.position = position;

    this.color = color ? color : '#ffffff';

    this.radius = radius ? radius : 10;

    this.velocity = new vec2(

      randFloat(0.8, 2.4),

      randFloat(0.8, 2.4)

    );

    this.rotation = randFloat(0, Math.PI * 2);

    this.collisions = {

      lt: false,

      rt: false,

      up: false,

      dw: false,

    };

  }

  

  collision(){

    let r = this.radius;

    let a = this.rotation;

    let cX = walls.w;

    let cY = walls.h;

    let { x, y } = this.position;

    let { lt, rt, up, dw } = this.collisions;

    if(y < r && !up) {

      this.rotation = -a;

      this.collisions.up = true;

      this.collisions.dw = false;

    }

    if(y > cY - r && !dw) {

      this.rotation = -a;

      this.collisions.up = false;

      this.collisions.dw = true;

    }

    if(x < r && !lt) {

      this.rotation = Math.PI - a;

      this.collisions.lt = true;

      this.collisions.rt = false;

    }

    if(x > cX - r && !rt) {

      this.rotation = Math.PI - a;

      this.collisions.rt = true;

      this.collisions.lt = false;

    }

  }

  

  update(delta){

    let vx = this.velocity.x;

    let vy = this.velocity.y;

    const rad = this.rotation;

    this.position.x += (vx * delta) * Math.cos(rad);

    this.position.y += (vy * delta) * Math.sin(rad);

    //apply friction 

    this.velocity.x *= resistance;

    this.velocity.y *= resistance;

    this.radius *= resistance;

    //collision with walls 

    this.collision();

    if(this.radius < particleDespawnThreshold) this.redundant = true;

  }

}

class polygon {

  constructor(){

    

  }

}

const Renderer = new renderer({

  height: window.innerHeight,

  width: window.innerWidth,

  alpha: false,

  pixelRatio: window.devicePixelRatio

});

walls.h = Renderer.domElement.height;

walls.w = Renderer.domElement.width;

document.body.appendChild(Renderer.domElement);

const Scene = new scene();

let dx = Renderer.domElement.width / window.innerWidth;

let dy = Renderer.domElement.height / window.innerHeight;

const spawn = (touches) => {

  for(let touch of touches){

    if(particleCounter > particleMaxLimit) break;

    const x = touch.clientX * dx;

    const y = touch.clientY * dy;

    const Particle = new particle(

      new vec2(x, y),

      randFloat(25, 35)

    );

    Particle.color = randHSL();

    Scene.add(Particle);

  }

};

const Ticker = new ticker(120);

Ticker.onTick((delta) => {

  particleCounter = Scene.count;

  if(spawnClearance) {

    spawn(TOUCH);

  }

  Renderer.render(Scene, delta);

});

//Event listeners

const instructions = document.querySelector('#instructions');

let sessionStarted = false;

//for touch devices

const target = Renderer.domElement;

target.addEventListener('touchstart', (e) => {

  if(!sessionStarted) {

    instructions.remove();

    sessionStarted = true;

  }

  TOUCH = e.touches;

  spawnClearance = true;

});

target.addEventListener('touchmove', (e) => {

  TOUCH = e.touches;

});

target.addEventListener('touchend', () => {

  spawnClearance = false;

});

//for mouse devices

target.addEventListener('mousedown', (e) => {

  if(!sessionStarted) {

    instructions.remove();

    sessionStarted = true;

  }

  spawnClearance = true;

  TOUCH = [{

    clientX: e.clientX,

    clientY: e.clientY,

  }];

});

target.addEventListener('mousemove', (e) => {

  TOUCH = [{

    clientX: e.clientX,

    clientY: e.clientY,

  }];

});

target.addEventListener('mouseup', () => {

  spawnClearance = false;

});

window.addEventListener('resize', () => {

  target.height = window.innerHeight * window.devicePixelRatio;

  target.width = window.innerWidth * window.devicePixelRatio;

  dx = Renderer.domElement.width / window.innerWidth;

  dy = Renderer.domElement.height / window.innerHeight;

  walls.h = Renderer.domElement.height;

  walls.w = Renderer.domElement.width;

});

//remove the instructions

setTimeout(() => {

  if (sessionStarted) return;

  document.querySelector('#instructions').remove();

}, 4000);
