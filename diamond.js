
let canvas = document.getElementById("diamond");
let ctx = canvas.getContext("2d");

const WIDTH = 1280;
const HEIGHT = 720;
const BACKGROUND_COLOR = "#2c0f22";
const FOREGROUND_COLOR = "#5f7992";

const WALL_LEFT = 100;
const WALL_RIGHT = WIDTH - 100;
const WALL_TOP = 100;
const WALL_BOTTOM = HEIGHT - 100;
let CAT_FOLLOWING = false;
const SPRITE_SQUARE = 10;

const Resources = {
    PLAYER: {
        "1": {
            walk: loadImageGroup("char/right/", 9, "png"),
            idle: loadImageGroup("char/idle_right/", 1, "png"),
            jump: loadImageGroup("char/jump_right/", 1, "png"),
        },
        "-1": {
            walk: loadImageGroup("char/left/", 9, "png"),
            idle: loadImageGroup("char/idle_left/", 1, "png"),
            jump: loadImageGroup("char/jump_left/", 1, "png"),
        },
        frameRate: 60,
    },

    Cat: {
        "1": {
            idle: loadImageGroup("cat/idle_right/", 1, "png"),
            look: loadImageGroup("cat/look_right/", 4, "png"),
            wake: loadImageGroup("cat/wake_right/", 3, "png"),
            walk: loadImageGroup("cat/walk_right/", 7, "png"),
        },
        "-1": {
            idle: loadImageGroup("cat/idle_left/", 1, "png"),
            look: loadImageGroup("cat/look_left/", 4, "png"),
            wake: loadImageGroup("cat/wake_left/", 3, "png"),
            walk: loadImageGroup("cat/walk_left/", 7, "png"),
        },
        frameRate: 80,
    }
}

function loadImage(src) {
    img = new Image();
    img.src = src;
    return img;
}

function loadImageGroup(src, elements, extension = "png") {
    imgs = []
    let i = 0;
    for (let i = 0; i < elements; i++) {
        let num = "" + i;
        while (num.length < 3) num = "0" + num;
        imgs.push(loadImage(src + num + "." + extension));
    }
    return imgs
}

function drawForeground() {
    ctx.fillStyle = FOREGROUND_COLOR;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawLeftRightWalls() {
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, WALL_LEFT, HEIGHT);
    ctx.fillRect(WALL_RIGHT, 0, WIDTH, HEIGHT);
}

function drawTopBottomWalls() {
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, WIDTH, WALL_TOP);
    ctx.fillRect(0, WALL_BOTTOM, WIDTH, HEIGHT);    
}

class GameObject {
    constructor(x = WIDTH / 2, y = WALL_BOTTOM - 50) {
        this.x = x;
        this.y = y;
        this.turn = 1;
        this.state = "idle";
        this.animation = 0;
        this.animationUpdate = 0;
        this.animation = 0;
    }

    getRoundX() {
        if (this.x % 10 < 5) 
            return this.x - this.x % 10;
        else 
            return this.x + 10 - this.x % 10;
    }

    getRoundY() {
        if (this.y % 10 < 5) 
            return this.y - this.y % 10;
        else 
            return this.y + 10 - this.y % 10;
    }
}

class Cat extends GameObject {
    constructor(x, y){
        super(x, y);
        this.resource = "Cat";
        this.animationLoop = false;
    }

    update(elapsed, total, eventQueue) {
        // Animation
        if (total > this.animationUpdate && this.state == "look" && this.animationLoop) {
            this.state = "idle";
            this.animation = 0;
            this.animationLoop = false;
        }

        // Animation
        if (total > this.animationUpdate) {
            this.animationUpdate = total + Resources[this.resource].frameRate;
            if (this.animation + 2 == Resources[this.resource][this.turn][this.state].length)
                this.animationLoop = true;
            this.animation = (this.animation + 1) % Resources[this.resource][this.turn][this.state].length;
        }

        // Redrawing
        ctx.drawImage(Resources[this.resource][this.turn][this.state][this.animation], this.x, this.y);
    }
}

class Player extends GameObject {
    constructor(x, y){
        super(x, y);
        this.resource = "PLAYER";
        this.floor = y;
        this.yForce = 0.4;
        this.turn = 1; // right | left
        this.state = "idle"; // idle | walk
        this.jump = 0;
        this.animationUpdate = 0;
        this.animation = 0;
        this.speed = 0.9;
    } 

    update(elapsed, total, eventQueue) {
        // Handling events
        while (eventQueue.length > 0) {
            let event = eventQueue.shift();
    
            if (event.type == "right" && !(this.turn == 1 && this.state == "walk")) {
                this.state = "walk";
                this.turn = 1;
                this.animationUpdate = 0; 
            }
            else if (event.type == "left" && !(this.turn == -1 && this.state == "walk")) {
                this.state = "walk";
                this.turn = -1;
                this.animationUpdate = 0;       
            }
            else if (event.type == "idle" && this.state != "idle") {
                this.x = this.getRoundX();
                this.state = "idle";
                this.animationUpdate = 0;
            }
            else if (event.type == "jump" && this.jump == 0) {
                this.jump = 1;
                this.yForce = -10;
            }
        }
    
        // Y Movement
        if (this.y >= this.floor) {
            this.yForce = 0;
            this.y = this.floor;    
        }
        else if (this.y < this.floor) {
           this.yForce += 0.05;    
        }
    
        if (this.y + this.yForce * elapsed >= this.floor) {
            this.y = this.floor;
        }
        else {
            this.y += this.yForce * elapsed;
        }
    
        // X Movement
        if (this.state == "walk")  {
            this.x += this.speed * this.turn * elapsed;
        }
    
        // Animation
        if (total > this.animationUpdate) {
            this.animationUpdate = total + Resources[this.resource].frameRate;
            this.animation = (this.animation + 1) % Resources[this.resource][this.turn][this.state].length;
        }
    
        // Redraw
        ctx.drawImage(Resources[this.resource][this.turn][this.state][this.animation], this.x, this.y);
    }
    
}


class Room {
    constructor(goingLeft, goingRight, drawWalls = true) {
        this.goingLeft = goingLeft;
        this.goingRight = goingRight;
        this.drawWalls = true;
        this.player = new Player(WALL_LEFT + 10, WALL_BOTTOM - 100);
        this.env = [];
    }

    checkPlayerExit() {
        if (this.player.x < WALL_LEFT - 120) {
            if (!this.goingLeft) {
                this.player.x = WALL_RIGHT + 50;
                return "loop_left";
            }
            else {
                this.player.x += 130;
                return "go_left";
            }
        }
    
        if (this.player.x > WALL_RIGHT + 50) {
            if (!this.goingRight) {
                this.player.x = WALL_LEFT - 120;
                return "loop_right";
            }
            else {
                this.player.x -= 130;
                return "go_right";
            }
        }
    }

    update(elapsed, total, eventQueue) {
        if (this.drawWalls) drawTopBottomWalls();

        for (let e of this.env) e.update(elapsed, total, eventQueue);

        this.player.update(elapsed, total, eventQueue);

        if (this.drawWalls) drawLeftRightWalls();

        return this.checkPlayerExit();
    }
}

class RoomCat extends Room {
    constructor(goingLeft, goingRight) {
        super(goingLeft, goingRight);
        this.env.push(new Cat(300, WALL_BOTTOM - 80));
    }

    update(elapsed, total, eventQueue) {
        
        let ret =  super.update(elapsed, total, eventQueue);

        console.log(this.player.x, this.env[0].x);
        if (this.player.getRoundX() == this.env[0].x){ 
            this.env[0].state = "look"
            CAT_FOLLOWING = true
            console.log("XXXXXXX2")
    }

        return ret;
    }
}

class RoomCat1 extends Room {
    constructor(goingLeft, goingRight) {
        super(goingLeft, goingRight);
        this.env.push(new Cat(0, WALL_BOTTOM - 80));
    }

    update(elapsed, total, eventQueue) {
        
        return super.update(elapsed, total, eventQueue);
    }
}


const ROOMS = [
    //new Room(false, true), // Empty room
    new RoomCat(true, true), // A cat appears...
    new RoomCat1(true, false), // ...and it's running behind player
    // a cat is still running, a strange mirror is here, death is coming
    // a shadow of cat blinks once, death is coming
    // death is coming
    // a center wall appears
    // a center wall is already here
    // death is coming
    // triple stairs
    // stairs again
    // plane
    // factory of cats?
    // a cat is running in front of player

];

// Main game class
class Game {
    constructor() {
        this.refreshRate = 1000 / 10;
        this.lastUpdate = 0;
        this.inputQueue = [];
        this.rooms = ROOMS;
        this.currentRoom = 0;
        this.keyboard = {};

        canvas.addEventListener('keyup', this.pushInput.bind(this));
        canvas.addEventListener('keydown', this.pushInput.bind(this));
        canvas.addEventListener('click', this.pushInput.bind(this));
    }

    pushInput(event) {
        this.inputQueue.push(event);
    }

    update(tm, t) {
        let eventQueue = [];

        // Collecting user input
        while (this.inputQueue.length > 0) {
            let input = this.inputQueue.shift()
            if (input.type == 'keyup') 
                this.keyboard[input.code] = false;
            else if (input.type == 'keydown' && !input.repeat) 
                this.keyboard[input.code] = true;
            else if (input.type == 'click') {
                console.log(input.offsetX, input.offsetY);
            }
        }

        // Bind input to game events
        if (this.keyboard["KeyZ"]) {
            eventQueue.push({ type: "jump" });
        }

        if (this.keyboard["ArrowRight"] && (!this.keyboard["ArrowLeft"])) {
            eventQueue.push({ type: "right" });
        } 
        else if (this.keyboard["ArrowLeft"] && (!this.keyboard["ArrowRight"])) {
            eventQueue.push({ type: "left" });
        } 
        else {
            eventQueue.push({ type: "idle" });
        }

        // Update current room
        drawForeground()
        let playerExit = this.rooms[this.currentRoom].update(tm, t, eventQueue);
        if (playerExit == "go_left") this.currentRoom--;
        else if (playerExit == "go_right") this.currentRoom++;

    }

    loop(t = 1) {
        this.update(this.refreshRate / (t - this.lastUpdate), t);

        this.lastUpdate = t;
        
        window.requestAnimationFrame(this.loop.bind(this));
    }  
};

let game = new Game();
game.loop();

