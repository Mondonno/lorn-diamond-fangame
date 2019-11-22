
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

const Resources = {
    PLAYER : {
        "1" : {
            walk: loadImageGroup("char/right/", 9, "png"),
            idle: loadImageGroup("char/idle_right/", 1, "png"),
            jump: loadImageGroup("char/jump_right/", 1, "png"),
        },
        "-1" : {
            walk: loadImageGroup("char/left/", 9, "png"),
            idle: loadImageGroup("char/idle_left/", 1, "png"),
            jump: loadImageGroup("char/jump_left/", 1, "png"),
        },
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

function newPlayer(x = 0, y = 0) {
    return {
        x: x,
        y: y,
        turn: 1, // right | left
        state: "idle", // idle | walk | jump
        animationUpdate: 0,
        animation: 0,
        speed: 0.9,
    }
}

function updatePlayer(player, elapsed, total, eventQueue) {
    // Handling events
    while (eventQueue.length > 0) {
        let event = eventQueue.shift();

        if (event.type == "right" && !(player.turn == 1 && player.state == "walk")) {
            player.state = "walk";
            player.turn = 1;
            player.animationUpdate = 0; 
        }
        else if (event.type == "left" && !(player.turn == -1 && player.state == "walk")) {
            player.state = "walk";
            player.turn = -1;
            player.animationUpdate = 0;       
        }
        else if (event.type == "idle" && player.state != "idle") {
            player.state = "idle";
            player.animationUpdate = 0;
        }
    }

    // Logic
    if (player.state == "walk") {
        player.x += player.speed * player.turn * elapsed;
    }

    // Animation
    if (total > player.animationUpdate) {
        player.animationUpdate = total + Resources.PLAYER.frameRate;
        player.animation = (player.animation + 1) % Resources.PLAYER[player.turn][player.state].length;
    }

    // Redraw
    ctx.drawImage(Resources.PLAYER[player.turn][player.state][player.animation], player.x, player.y);
}

class Room {
    constructor() {
        this.player = newPlayer(WALL_LEFT + 20, WALL_BOTTOM - 100);

        this.goingBack = false;
        this.goingAhead = true;
    }

    update(elapsed, total, eventQueue) {
        drawForeground()
        drawTopBottomWalls();

        updatePlayer(this.player, elapsed, total, eventQueue);

        drawLeftRightWalls();

        return eventQueue;
    }

}



class Game {
    constructor() {
        this.refreshRate = 1000 / 10;
        this.lastUpdate = 0;
        this.inputQueue = [];
        this.rooms = [ new Room(), new Room() ];
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
        if (this.keyboard["KeyD"] && (!this.keyboard["KeyA"])) {
            eventQueue.push({ type: "right" });
        } 
        else if (this.keyboard["KeyA"] && (!this.keyboard["KeyD"])) {
            eventQueue.push({ type: "left" });
        } 
        else {
            eventQueue.push({ type: "idle" });
        }

        // Update current room
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