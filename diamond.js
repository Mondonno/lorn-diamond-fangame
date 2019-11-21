
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

const SPRITE_SQUARE = 10;

const RESOURCES = {
    PLAYER : {
        left: loadImageGroup("char/left/", 9, "png"),
        right: loadImageGroup("char/right/", 9, "png"),
        idle_left: loadImageGroup("char/idle_left/", 1, "png"),
        idle_right: loadImageGroup("char/idle_right/", 1, "png"),
        frameRate: 60,
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


class Room {
    constructor() {
        this.goingBack = false;
        this.goingAhead = false;
        this.playerX = WALL_LEFT;
        this.playerY = WALL_BOTTOM - 100;
        
        this.playerState = "idle_right";
        this.playerAnimationUpdate = 0;
        this.playerAnimation = 0;
    }

    update(elapsed, total, eventQueue) {
        while (eventQueue.length > 0) {
            switch (eventQueue.shift()) {
                case "right": 
                    this.playerState = "right";
                    this.playerAnimationUpdate = 0;
                break;
                case "idle_right": 
                    this.playerState = "idle_right";
                    this.playerAnimationUpdate = 0;
                break;
                case "left": 
                    this.playerState = "left";
                    this.playerAnimationUpdate = 0;
                break;
                case "idle_left": 
                    this.playerState = "idle_left";
                    this.playerAnimationUpdate = 0;
                break;
            }
        }
        
        if (total > this.playerAnimationUpdate) {
            this.playerAnimationUpdate = total + RESOURCES.PLAYER.frameRate;
            this.playerAnimation = (this.playerAnimation + 1) % RESOURCES.PLAYER[this.playerState].length;
        }

        drawForeground()
        drawTopBottomWalls();

        switch (this.playerState){
            case "idle_right": 
                ctx.drawImage(RESOURCES.PLAYER.idle_right[this.playerAnimation], this.playerX, this.playerY);
            break;
            case "idle_left": 
                ctx.drawImage(RESOURCES.PLAYER.idle_left[this.playerAnimation], this.playerX, this.playerY);
            break;
            case "right": 
                this.playerX += 0.8 * elapsed;
                ctx.drawImage(RESOURCES.PLAYER.right[this.playerAnimation], this.playerX, this.playerY);
            break;
            case "left": 
                this.playerX -= 0.8 * elapsed;
                ctx.drawImage(RESOURCES.PLAYER.left[this.playerAnimation], this.playerX, this.playerY);
            break;
        }

        if (!this.goingBack && this.playerX < 0) {
            this.playerX = WALL_RIGHT;
        }
        else if (!this.goingAhead && this.playerX > WIDTH) {
            this.playerX = WALL_LEFT - 70;
        }

        drawLeftRightWalls();

    }

}



class Game {
    constructor() {
        this.refreshRate = 1000 / 10;
        this.lastUpdate = 0;
        this.inputQueue = [];
        this.rooms = [ new Room() ];
        this.currentRoom = 0;
        this.moveStart = 0;

        canvas.addEventListener('keyup', this.pushEvent.bind(this));
        canvas.addEventListener('keydown', this.pushEvent.bind(this));
        canvas.addEventListener('click', this.pushEvent.bind(this));
    }

    pushEvent(event) {
        this.inputQueue.push(event);
    }

    update(tm, t) {
        let eventQueue = []

        while (this.inputQueue.length > 0) {
            let input = this.inputQueue.shift()

            if (input.type == 'keyup') {
                switch (input.code) {
                    case "KeyD":
                    case "ArrowRight":
                        eventQueue.push("idle_right");
                        this.moveStart = t;
                    break;
                    case "KeyA":
                    case "ArrowLeft":
                        eventQueue.push("idle_left");
                        this.moveStart = t;
                    break;
                }
            }
            else if (input.type == 'keydown' && !input.repeat) {
                console.log(input);
                switch (input.code) {
                    case "KeyD":
                    case "ArrowRight":
                        eventQueue.push("right");
                    break;
                    case "KeyA":
                    case "ArrowLeft":
                        eventQueue.push("left");
                    break;
                }
                
            }
            else if (input.type == 'click') {
                console.log(input.offsetX, input.offsetY);
            }
        }

        this.rooms[this.currentRoom].update(tm, t, eventQueue);
    }

    loop(t) {
        this.update(this.refreshRate / (t - this.lastUpdate), t);

        this.lastUpdate = t;
        
        window.requestAnimationFrame(this.loop.bind(this));
    }  
};

let game = new Game();
game.loop(1);