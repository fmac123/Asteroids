// FIT2102 2019 Assignment 1
// https://docs.google.com/document/d/1Gr-M6LTU-tfm4yabqZWJYg-zTjEVqHKKTCvePGCYsUA/edit?usp=sharing

/**
 * applied to a mouse event, such as mousedown, this function will prevent the event
 * from propagating down to other underlying elements at the same position of the mouse cursor.
 * @param e an event
 * @returns the event so it can be used in a chain
 */
function stopPropagation<E extends Event>(e: E) {
  e.stopPropagation();
  return e;
}


function asteroids() {

  /*
  FEATURES IMPLEMENTED:
  -all minimum requirements
  -Big asteroids break down into smaller asteroids
  -Ship thrust

  CONTROLS:
  -Left arrowkey/right arrowkey to change angle ship is pointed in
  -Up arrowkey to introduce thrust
  -x to shoot out bullets

  SIDE EFFECTS AND STATE MUTATION:
  Due to the nature of the translation attribute of Elem I needed to have mutable variables for x,y and rotation(z). 
  Additionally I created mutable variables to allow multiple movements. 
  Code was split up into functions using pure functions like filter() to stop state change.
  */
   
  const 
    svg = document.getElementById("canvas")!,
    keydown = Observable.fromEvent<KeyboardEvent>(document, 'keydown'),
    keyup = Observable.fromEvent<KeyboardEvent>(document, 'keyup');

  const AST_SPEED = 1.10;
  const BULLET_SPEED = 20;
  //AST_NUM is taking into account smaller asteroids too which is why it stops breaking down after a certain time
  const AST_NUM = 5;
  

  const astStartPos:number[][] =[[0,0],[300,0],[600,0],[0,600],[300,600],[600,600]]
  
  const xAngle = (x:number) => Math.cos(x*Math.PI/180); 
  const yAngle = (y:number) => Math.sin(y*Math.PI/180);
  const modulo = (coord:number) => coord = ((coord%600)+600)%600;
  const randNum = (x:number):number =>  Math.floor(Math.random() * Math.floor(x));
  const endScreen = (pos:number) => pos <= 0 || pos >= 600 ? true:false;
  const mainInterval = Observable.interval(10);
  
  const initAstArray = () => {
    let pos = randNum(astStartPos.length);
    return new Elem(svg, 'circle').attr("cx", astStartPos[pos][0]).attr("cy", astStartPos[pos][1] ).attr("r", 30).attr("style","fill:lightblue").attr("angle",randNum(361)).attr("collidable", 1).attr("astLvl",2);
  }
  let astAry:Elem[] = [...Array(AST_NUM)].map(initAstArray);
  let bulletAry:Elem[] = [];
  
  let x: number = 300, y: number = 300, z:number = 0, unitCircle:number = 90, SHIP_SPEED = 0;
  
  let speedUp:boolean = false;
  let rightRotate:boolean = false;
  let leftRotate:boolean = false;
  let shoot:boolean = false;
  let bulletAng:number;
  
  //moves the an asteroid
  function asteroidMovement(item:Elem, SPEED:number){
    item
      .attr('cx',SPEED*xAngle(Number(item.attr('angle')))+Number(item.attr('cx')))
      .attr('cy',SPEED*yAngle(Number(item.attr('angle')))+Number(item.attr('cy')))
      .attr('cx', modulo(Number(item.attr('cx'))))
      .attr('cy', modulo(Number(item.attr('cy'))))
  }

  
  //checks if ship intersects with an asteroid by using smallest surrounding rectangle
  function intersectRect(aShip:Elem, asteroid:Elem) {
    let a = aShip.elem.getBoundingClientRect();
    let b = asteroid.elem.getBoundingClientRect();
    return !(b.left > a.right || 
      b.right < a.left || 
      b.top > a.bottom ||
      b.bottom < a.top);
  }

  //checks if there's a collision between a bullet and an asteroid
  //removes the colliding bullet and asteroid
  function bulletCollision(bullet:Elem){
    astAry.forEach(ast => {
    const dx = Number(bullet.attr('cx')) - Number(ast.attr('cx'));
    const dy = Number(bullet.attr('cy')) - Number(ast.attr('cy'));
    const distance = Math.sqrt(dx * dx + dy * dy);

    if ((distance < Number(bullet.attr('r')) + Number(ast.attr('r'))) && Number(ast.attr("collidable")) === 1 ){
      
      bullet.elem.remove();
      let resultB = bulletAry.filter(bulletAry => bulletAry != bullet);
      bulletAry = resultB;

      ast.elem.remove();
      ast.attr("collidable", 0);
      let resultA = astAry.filter(astAry => astAry != ast);
      astAry = resultA;

      generateAsteroids(ast);
    
      }
  })
  }

  //generates a smaller asteroid if possible, else respawns a new full sized one
  function generateAsteroids(ast:Elem){
    let stPos = randNum(astStartPos.length);
    if(Number(ast.attr("astLvl")) === 2 ){
      astAry.push(new Elem(svg, 'circle').attr("cx", Number(ast.attr("cx"))).attr("cy",Number(ast.attr("cy"))).attr("r", 15).attr("style","fill:lightblue").attr("angle",randNum(361)).attr("collidable", 1).attr("astLvl",1))
    }
    else if(Number(ast.attr("astLvl")) === 1 ){
      astAry.push(new Elem(svg, 'circle').attr("cx", Number(ast.attr("cx"))).attr("cy", Number(ast.attr("cy")) ).attr("r", 7.5).attr("style","fill:lightblue").attr("angle",randNum(361)).attr("collidable", 1).attr("astLvl",0))
    }
    else if(Number(ast.attr("astLvl")) === 0){
      astAry.push(new Elem(svg, 'circle').attr("cx", astStartPos[stPos][0]).attr("cy", astStartPos[stPos][1] ).attr("r",30).attr("style","fill:lightblue").attr("angle",randNum(361)).attr("collidable", 1).attr("astLvl",2))
    }
    
  }
  
  //Checks if ship has collided with asteroid and ends game if it has
  function shipCollision(asteroid:Elem){
    if(intersectRect(ship,asteroid)){
      window.stop();
      document.body.style.background = "black"
      document.write('<div style="text-align:center;background-color:black;font-size:250%;color:white">Game Over...resetting</div>');
      setTimeout(()=>location.reload(),3000)}
    }
  

  
  //filters all keydown observables so we only subscribe to keys we use for game actions  
  //and then sets a boolean to true to allow multiple actions at once (eg turning, moving and shooting)
  //Also resets the boolean variables on keyup so we don't continuously subscribe to observables  
  function keydownOrkeyup(obser:Observable<KeyboardEvent>, bool:boolean){
    obser.filter(e => e.key === "ArrowUp")
      .subscribe(() => {
      speedUp = bool;
     })
  
    obser.filter(e => e.key === "ArrowRight")
      .subscribe(() => {
      rightRotate = bool;
      })
  
    obser.filter(e => e.key === "ArrowLeft")  
    .subscribe(() => {
      leftRotate = bool;
      })
  
    obser.filter(e => e.key === "x")
    .subscribe(() => {
      shoot = bool;
    })
  }
  
  
  
  //make a group for the spaceship and a transform to move it and rotate it
  //to animate the spaceship you will update the transform property
  let g = new Elem(svg,'g')
    .attr("transform",`translate(${x} ${y}) rotate(${z})`)

  //create a polygon shape for the space ship as a child of the transform group
  let ship = new Elem(svg, 'polygon', g.elem) 
    .attr("points","-10,15 10,15 0,-15")
    .attr("style","fill:yellow;")

  
  if(keydown){
    keydownOrkeyup(keydown, true);
  }

  if(keyup){
    keydownOrkeyup(keyup, false);
  }
  
  //continuously subscribes over an interval to allow multiple actions at once (eg turning, moving and shooting)  
  mainInterval
    .subscribe(()=>{
      if(speedUp){
        SHIP_SPEED=3;
      }
    
      if(rightRotate){
        g.attr("transform" , `translate(${x} ${y}) rotate(${z+=2})`)
        unitCircle+=2;}
      
      if(leftRotate){
        g.attr("transform" , `translate(${x} ${y}) rotate(${z-=2})`)
        unitCircle-=2;}
      
      if(SHIP_SPEED-0.001>=0){SHIP_SPEED-=0.001}
      g.attr("transform" , `translate(${x-=SHIP_SPEED*xAngle(unitCircle)} ${y-=SHIP_SPEED*yAngle(unitCircle)}) rotate(${z})`)
      x = modulo(x),y=modulo(y);
})
  
  //at each game tick, runs through an array of asteroids and update their movement and check if they've collided with the ship
  mainInterval  
  .subscribe(()=>{astAry.forEach(item => { 
      asteroidMovement(item,AST_SPEED);
      //shipCollision(item);
      })
    })
  //at each game tick, runs through an array of bullets and pdate their movement and check if they've collided with an asteroid 
  //also checks if bullets have gone off screen and removes them from the game if they have
  mainInterval  
    .subscribe(()=>{bulletAry.forEach(item => { 
        item.attr("cx", Number(item.attr("cx"))-BULLET_SPEED*xAngle(bulletAng))
        item.attr("cy", Number(item.attr("cy"))-BULLET_SPEED*yAngle(bulletAng))
        bulletCollision(item)
        if(endScreen(Number(item.attr('cx'))) || endScreen(Number(item.attr('cy')))){
          item.elem.remove();
          let resultB = bulletAry.filter(bulletAry => bulletAry != item);
          bulletAry = resultB;
        
        }
         })
      })
  
  //a delay separate from mainInterval to make a nice gap between each bullet that appears on screen 
  Observable.interval(60)
      .subscribe(()=>{
        if(shoot){
          bulletAng = unitCircle;
          bulletAry.push(new Elem(svg, 'circle').attr("cx", x - (BULLET_SPEED*xAngle(bulletAng))).attr("cy", y - (BULLET_SPEED*yAngle(bulletAng))).attr("r", 4).attr("style","fill:lightgreen"))}
  })

  
}


// the following simply runs your asteroids function on window load.  Make sure to leave it in place.
if (typeof window != 'undefined')
  window.onload = ()=>{
    asteroids();
  }