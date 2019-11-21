
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

function updatePlayer(room, elapsed, total, eventQueue) {
    let unhandledEventQueue = [];
    console.log(eventQueue);
    for (let i = 0; i < eventQueue.length; i++) {
        switch (eventQueue[i]) {
            case "right": 
                room.playerState = "right";
                room.playerAnimationUpdate = 0;
            break;
            case "idle_right": 
                room.playerState = "idle_right";
                room.playerAnimationUpdate = 0;
            break;
            case "left": 
                room.playerState = "left";
                room.playerAnimationUpdate = 0;
            break;
            case "idle_left": 
                room.playerState = "idle_left";
                room.playerAnimationUpdate = 0;
            break;
            default:
                unhandledEventQueue.push(event);
        }
    }

    if (total > room.playerAnimationUpdate) {
        room.playerAnimationUpdate = total + RESOURCES.PLAYER.frameRate;
        room.playerAnimation = (room.playerAnimation + 1) % RESOURCES.PLAYER[room.playerState].length;
    }

    switch (room.playerState){
        case "idle_right": 
            ctx.drawImage(RESOURCES.PLAYER.idle_right[room.playerAnimation], room.playerX, room.playerY);
        break;
        case "idle_left": 
            ctx.drawImage(RESOURCES.PLAYER.idle_left[room.playerAnimation], room.playerX, room.playerY);
        break;
        case "right": 
            room.playerX += 0.9 * elapsed;
            ctx.drawImage(RESOURCES.PLAYER.right[room.playerAnimation], room.playerX, room.playerY);
        break;
        case "left": 
            room.playerX -= 0.9 * elapsed;
            ctx.drawImage(RESOURCES.PLAYER.left[room.playerAnimation], room.playerX, room.playerY);
        break;
    }

    if (!room.goingBack && room.playerX < -250) {
        room.playerX = WALL_RIGHT;
    }
    else if (room.goingAhead && room.playerX < -250) {
        unhandledEventQueue.push({ type: "previousRoom" });
    }
    else if (!room.goingAhead && room.playerX > WIDTH + 180) {
        room.playerX = WALL_LEFT - 70;
    }
    else if (room.goingAhead && room.playerX > WIDTH + 180) {
        unhandledEventQueue.push({ type: "nextRoom" });
    }

    return unhandledEventQueue;
}

class Room {
    constructor() {
        this.goingBack = false;
        this.goingAhead = true;
        this.playerX = WALL_LEFT;
        this.playerY = WALL_BOTTOM - 100;
        
        this.playerState = "idle_right";
        this.playerAnimationUpdate = 0;
        this.playerAnimation = 0;
    }

    update(elapsed, total, eventQueue) {
        
        drawForeground()
        drawTopBottomWalls();

        eventQueue = updatePlayer(this, elapsed, total, eventQueue);

        drawLeftRightWalls();

        return eventQueue;
    }

}



class Game {
    constructor() {
        this.refreshRate = 1000 / 10;
        this.lastUpdate = 0;
        this.eventQueue = [];
        this.rooms = [ new Room(), new Room() ];
        this.currentRoom = 0;
        this.moveStart = 0;

        canvas.addEventListener('keyup', this.pushEvent.bind(this));
        canvas.addEventListener('keydown', this.pushEvent.bind(this));
        canvas.addEventListener('click', this.pushEvent.bind(this));
    }

    pushEvent(event) {
        this.eventQueue.push(event);
    }

    update(tm, t) {
        while (this.eventQueue.length > 0) {
            let input = this.eventQueue.shift()

            if (input.type == 'keyup') {
                switch (input.code) {
                    case "KeyD":
                    case "ArrowRight":
                        this.eventQueue.push("idle_right");
                        this.moveStart = t;
                    break;
                    case "KeyA":
                    case "ArrowLeft":
                        this.eventQueue.push("idle_left");
                        this.moveStart = t;
                    break;
                }
            }
            else if (input.type == 'keydown' && !input.repeat) {
                console.log(input);
                switch (input.code) {
                    case "KeyD":
                    case "ArrowRight":
                            this.eventQueue.push("right");
                    break;
                    case "KeyA":
                    case "ArrowLeft":
                            this.eventQueue.push("left");
                    break;
                }
                
            }
            else if (input.type == 'click') {
                console.log(input.offsetX, input.offsetY);
            }
            else if (input.type == 'nextRoom') {
                console.log("NEXT");
            }
            else if (input.type == 'previousRoom') {
                console.log("PREV");
            }
        }

        this.eventQueue = this.rooms[this.currentRoom].update(tm, t, this.eventQueue); // ---------------
    }

    loop(t) {
        this.update(this.refreshRate / (t - this.lastUpdate), t);

        this.lastUpdate = t;
        
        window.requestAnimationFrame(this.loop.bind(this));
    }  
};

let game = new Game();
game.loop(1);