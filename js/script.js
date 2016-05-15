/**************************/
/*    Config Variables    */
/**************************/

var DEBUG = true;
var WIDTH = 800;
var HEIGHT = 600;
var BGCOLOR = '#FFFFFF';
var FPS = 60;
var PLAYER_H_SPEED = 450;
var PLAYER_JUMP_SPEED = 800;
var GRAVITY = 1800;

var ProjectileTypes = {
    basic: {
        dmg: 10,
        width: 5,
        height: 5,
        speed: 2300,
        color: '#000',
        rate: 0.08
    }
};

/*** DO NOT CHANGE ***/

var lastFrameTime = 0;
var delta = 0;
var timestep = 1000 / FPS;
var canShoot = 0;


/**************************/

window.onload = function() {

    var canvas = document.getElementById('game-canvas');
    var ctx = canvas.getContext('2d');
    resizeCanvas();
    canvas.style.background = BGCOLOR;


    var mouse = {
        x: canvas.width / 2,
        y: canvas.height / 2
    };
    var left = keyboard(65);
    var right = keyboard(68);
    var up = keyboard(87);
    var testKey = keyboard(70);

    /************/
    /*  Player  */
    /************/
    var P1 = new Player();

    function Player() {
        this.height = 100;
        this.width = this.height / 2;
        this.x = 150;
        this.y = canvas.height - this.height;
        this.dx = 0;
        this.dy = 0;
        this.jumping = false;
        this.shooting = false;
        this.projectiles = [];
    };

    Player.prototype.midpoint = function() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height /2
        };
    };

    Player.prototype.draw = function() {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.lineWidth = 0.2;
        ctx.strokeStyle = 'black';
        ctx.beginPath();
        ctx.moveTo(this.midpoint().x, this.midpoint().y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();

        this.projectiles.forEach(function(bullet) {
            ctx.fillStyle = bullet.color;
            ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
        });
    };

    Player.prototype.move = function() {
        this.dy += GRAVITY * delta;
        this.y += this.dy * delta;
        this.x += this.dx * delta;

        // Canvas boundaries collision
        if (this.x > canvas.width - this.width) 
            this.x = canvas.width - this.width;
        if (this.x < 0)
            this.x = 0;
        if (this.y > canvas.height - this.height) {
            this.y = canvas.height - this.height;
            this.dy = 0;
            this.jumping = false;
        } 
        if (this.y < 0) 
            this.y = 0;
    };

    Player.prototype.shoot = function(delta) {
        canShoot += delta;

        if (this.shooting && canShoot >= ProjectileTypes.basic.rate) {
            this.projectiles.push(
                new Bullet(this.midpoint().x,
                           this.midpoint().y,
                           mouse.x, mouse.y,
                           ProjectileTypes.basic)
            );
            canShoot = 0;
        }
    };

    /************/
    /*  Bullet  */
    /************/

    function Bullet(x, y, tX, tY, type) {
        this.x = x;
        this.y = y;
        this.trajectory = {
            x: tX - x,
            y: tY - y
        };
        this.active = true;
        this.outOfBounds = function() {
            return this.x < 0 || 
                   this.x > canvas.width ||
                   this.y < 0 ||
                   this.y > canvas.height;
        }

        this.width = type.width;
        this.height = type.height;
        this.dmg = type.dmg;
        this.speed = type.speed;
        this.color = type.color;
    }

    /******************/
    /**  Game Funcs  **/
    /******************/

    function update(delta) {
        P1.move();
        P1.shoot(delta);

        P1.projectiles.forEach(function(bullet, idx) {
            if (!bullet.active) {
                P1.projectiles.splice(idx, 1);
            }
        });

        P1.projectiles.forEach(function(bullet) {
            if (bullet.outOfBounds()) bullet.active = false;
            var mod = Math.sqrt(bullet.trajectory.x*bullet.trajectory.x + bullet.trajectory.y*bullet.trajectory.y);
            bullet.x += bullet.trajectory.x / mod * bullet.speed * delta;
            bullet.y += bullet.trajectory.y / mod * bullet.speed * delta;
        });

    }

    function draw() {
        resizeCanvas();

        P1.draw();

        debugInfo();
    }

    function gameLoop(timestamp) {
        requestAnimationFrame(gameLoop);
        delta = (timestamp - lastFrameTime) / 1000;
        lastFrameTime = timestamp;

        update(delta);
        draw();
    }


    /*************/
    /**  UTILS  **/
    /*************/


    function debugInfo() {
        if (DEBUG) {
            ctx.rect(2, 5, 120, 175);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.fillText('W: ' + canvas.width, 10, 20);
            ctx.fillText('H: ' + canvas.height, 10, 30);
            ctx.fillText('mX: ' + mouse.x, 10, 40);
            ctx.fillText('mY: ' + mouse.y, 10, 50);
            ctx.fillText('gravity: ' + GRAVITY, 10, 60);
            ctx.fillText('P1.x: ' + Math.ceil(P1.x), 10, 70);
            ctx.fillText('P1.y: ' + Math.ceil(P1.y), 10, 80);
            ctx.fillText('P1.dx: ' + Math.ceil(P1.dx), 10, 90);
            ctx.fillText('P1.dy: ' + Math.ceil(P1.dy), 10, 100);
            ctx.fillText('jumping: ' + P1.jumping, 10, 110);
            ctx.fillText('shooting: ' + P1.shooting, 10, 120);
            ctx.fillText('bullets: ' + P1.projectiles.length, 10, 130);
            ctx.fillText('FPS: ' + Math.ceil(1/delta), 10, 140);

        }
    }

    function initEventHandlers() {
        window.addEventListener('resize', resizeCanvas, false);
        canvas.addEventListener('mousemove', mouseHandler, false);
        canvas.addEventListener('mousedown', mouseHandler, false);
        canvas.addEventListener('mouseup', mouseHandler, false);
    }

    function keyboard(keyCode) {
        var key = {};
        key.code = keyCode;
        key.isDown = false;
        key.isUp = true;
        key.press = undefined;
        key.release = undefined;

        key.downHandler = function(e) {
            if (e.keyCode === key.code) {
                if (key.isUp && key.press) key.press();
                key.isDown = true;
                key.isUp = false;
            }
            e.preventDefault();
        };

        key.upHandler = function(e) {
            if (e.keyCode === key.code) {
                if (key.isDown && key.release) key.release();
                key.isDown = false;
                key.isUp = true;
            }
            e.preventDefault();
        };

        window.addEventListener('keydown', key.downHandler.bind(key), false);
        window.addEventListener('keyup', key.upHandler.bind(key), false);
        return key;
    }

    function controls() {
        left.press = function() {
            P1.dx = -PLAYER_H_SPEED;
        };
        left.release = function() {
            // TODO: Instead of stopping, bring player to a halt.
            if (!right.isDown)
                P1.dx = 0;
        };

        right.press = function() {
            P1.dx = PLAYER_H_SPEED;
        };
        right.release = function() {
            // TODO: Instead of stopping, bring player to a halt.
            if (!left.isDown)
                P1.dx = 0;
        };

        up.press = function() {
            if (!P1.jumping) {
                P1.dy = -PLAYER_JUMP_SPEED;
                P1.jumping = true;
            }
        }
        up.release = function() {
            if (P1.dy < -10)
                P1.dy = -10;
        }

        testKey.press = function() {
            var bul = new Bullet(ProjectileTypes.basic);
            bul.create(P1);
        }
    }

    function mouseHandler(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;

        if (e.type === 'mousedown') {
            P1.shooting = true;
        }

        if (e.type === 'mouseup') {
            P1.shooting = false;
        }
    }

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function pointDistance(p1, p2) {
        var xd = p1.x - p2.x;
        var yd = p1.y - p2.y;
        return Math.sqrt(xd*xd + yd*yd);
    }


    /*************/
    /**  INITS  **/
    /*************/

    initEventHandlers();
    controls();
    requestAnimationFrame(gameLoop);

};