"use strict";
function stopPropagation(e) {
    e.stopPropagation();
    return e;
}
function asteroids() {
    const svg = document.getElementById("canvas"), keydown = Observable.fromEvent(document, 'keydown'), keyup = Observable.fromEvent(document, 'keyup');
    const AST_SPEED = 1.10;
    const BULLET_SPEED = 20;
    const AST_NUM = 5;
    const astStartPos = [[0, 0], [300, 0], [600, 0], [0, 600], [300, 600], [600, 600]];
    const xAngle = (x) => Math.cos(x * Math.PI / 180);
    const yAngle = (y) => Math.sin(y * Math.PI / 180);
    const modulo = (coord) => coord = ((coord % 600) + 600) % 600;
    const randNum = (x) => Math.floor(Math.random() * Math.floor(x));
    const endScreen = (pos) => pos <= 0 || pos >= 600 ? true : false;
    const mainInterval = Observable.interval(10);
    const initAstArray = () => {
        let pos = randNum(astStartPos.length);
        return new Elem(svg, 'circle').attr("cx", astStartPos[pos][0]).attr("cy", astStartPos[pos][1]).attr("r", 30).attr("style", "fill:lightblue").attr("angle", randNum(361)).attr("collidable", 1).attr("astLvl", 2);
    };
    let astAry = [...Array(AST_NUM)].map(initAstArray);
    let bulletAry = [];
    let x = 300, y = 300, z = 0, unitCircle = 90, SHIP_SPEED = 0;
    let speedUp = false;
    let rightRotate = false;
    let leftRotate = false;
    let shoot = false;
    let bulletAng;
    function asteroidMovement(item, SPEED) {
        item
            .attr('cx', SPEED * xAngle(Number(item.attr('angle'))) + Number(item.attr('cx')))
            .attr('cy', SPEED * yAngle(Number(item.attr('angle'))) + Number(item.attr('cy')))
            .attr('cx', modulo(Number(item.attr('cx'))))
            .attr('cy', modulo(Number(item.attr('cy'))));
    }
    function intersectRect(aShip, asteroid) {
        let a = aShip.elem.getBoundingClientRect();
        let b = asteroid.elem.getBoundingClientRect();
        return !(b.left > a.right ||
            b.right < a.left ||
            b.top > a.bottom ||
            b.bottom < a.top);
    }
    function bulletCollision(bullet) {
        astAry.forEach(ast => {
            const dx = Number(bullet.attr('cx')) - Number(ast.attr('cx'));
            const dy = Number(bullet.attr('cy')) - Number(ast.attr('cy'));
            const distance = Math.sqrt(dx * dx + dy * dy);
            if ((distance < Number(bullet.attr('r')) + Number(ast.attr('r'))) && Number(ast.attr("collidable")) === 1) {
                bullet.elem.remove();
                let resultB = bulletAry.filter(bulletAry => bulletAry != bullet);
                bulletAry = resultB;
                ast.elem.remove();
                ast.attr("collidable", 0);
                let resultA = astAry.filter(astAry => astAry != ast);
                astAry = resultA;
                generateAsteroids(ast);
            }
        });
    }
    function generateAsteroids(ast) {
        let stPos = randNum(astStartPos.length);
        if (Number(ast.attr("astLvl")) === 2) {
            astAry.push(new Elem(svg, 'circle').attr("cx", Number(ast.attr("cx"))).attr("cy", Number(ast.attr("cy"))).attr("r", 15).attr("style", "fill:lightblue").attr("angle", randNum(361)).attr("collidable", 1).attr("astLvl", 1));
        }
        else if (Number(ast.attr("astLvl")) === 1) {
            astAry.push(new Elem(svg, 'circle').attr("cx", Number(ast.attr("cx"))).attr("cy", Number(ast.attr("cy"))).attr("r", 7.5).attr("style", "fill:lightblue").attr("angle", randNum(361)).attr("collidable", 1).attr("astLvl", 0));
        }
        else if (Number(ast.attr("astLvl")) === 0) {
            astAry.push(new Elem(svg, 'circle').attr("cx", astStartPos[stPos][0]).attr("cy", astStartPos[stPos][1]).attr("r", 30).attr("style", "fill:lightblue").attr("angle", randNum(361)).attr("collidable", 1).attr("astLvl", 2));
        }
    }
    function shipCollision(asteroid) {
        if (intersectRect(ship, asteroid)) {
            window.stop();
            document.body.style.background = "black";
            document.write('<div style="text-align:center;background-color:black;font-size:250%;color:white">Game Over...resetting</div>');
            setTimeout(() => location.reload(), 3000);
        }
    }
    function keydownOrkeyup(obser, bool) {
        obser.filter(e => e.key === "ArrowUp")
            .subscribe(() => {
            speedUp = bool;
        });
        obser.filter(e => e.key === "ArrowRight")
            .subscribe(() => {
            rightRotate = bool;
        });
        obser.filter(e => e.key === "ArrowLeft")
            .subscribe(() => {
            leftRotate = bool;
        });
        obser.filter(e => e.key === "x")
            .subscribe(() => {
            shoot = bool;
        });
    }
    let g = new Elem(svg, 'g')
        .attr("transform", `translate(${x} ${y}) rotate(${z})`);
    let ship = new Elem(svg, 'polygon', g.elem)
        .attr("points", "-10,15 10,15 0,-15")
        .attr("style", "fill:yellow;");
    if (keydown) {
        keydownOrkeyup(keydown, true);
    }
    if (keyup) {
        keydownOrkeyup(keyup, false);
    }
    mainInterval
        .subscribe(() => {
        if (speedUp) {
            SHIP_SPEED = 3;
        }
        if (rightRotate) {
            g.attr("transform", `translate(${x} ${y}) rotate(${z += 2})`);
            unitCircle += 2;
        }
        if (leftRotate) {
            g.attr("transform", `translate(${x} ${y}) rotate(${z -= 2})`);
            unitCircle -= 2;
        }
        if (SHIP_SPEED - 0.001 >= 0) {
            SHIP_SPEED -= 0.001;
        }
        g.attr("transform", `translate(${x -= SHIP_SPEED * xAngle(unitCircle)} ${y -= SHIP_SPEED * yAngle(unitCircle)}) rotate(${z})`);
        x = modulo(x), y = modulo(y);
    });
    mainInterval
        .subscribe(() => {
        astAry.forEach(item => {
            asteroidMovement(item, AST_SPEED);
        });
    });
    mainInterval
        .subscribe(() => {
        bulletAry.forEach(item => {
            item.attr("cx", Number(item.attr("cx")) - BULLET_SPEED * xAngle(bulletAng));
            item.attr("cy", Number(item.attr("cy")) - BULLET_SPEED * yAngle(bulletAng));
            bulletCollision(item);
            if (endScreen(Number(item.attr('cx'))) || endScreen(Number(item.attr('cy')))) {
                item.elem.remove();
                let resultB = bulletAry.filter(bulletAry => bulletAry != item);
                bulletAry = resultB;
            }
        });
    });
    Observable.interval(60)
        .subscribe(() => {
        if (shoot) {
            bulletAng = unitCircle;
            bulletAry.push(new Elem(svg, 'circle').attr("cx", x - (BULLET_SPEED * xAngle(bulletAng))).attr("cy", y - (BULLET_SPEED * yAngle(bulletAng))).attr("r", 4).attr("style", "fill:lightgreen"));
        }
    });
}
if (typeof window != 'undefined')
    window.onload = () => {
        asteroids();
    };
//# sourceMappingURL=asteroids.js.map