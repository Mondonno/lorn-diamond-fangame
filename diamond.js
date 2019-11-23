
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
            look: loadImageGroup("cat/look_right/", 3, "png"),
            wake: loadImageGroup("cat/wake_right/", 3, "png"),
            walk: loadImageGroup("cat/walk_right/", 7, "png"),
        },
        "-1": {
            idle: loadImageGroup("cat/idle_left/", 1, "png"),
            look: loadImageGroup("cat/look_left/", 3, "png"),
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

class Something {
    constructor(x = WIDTH / 2, y = WALL_BOTTOM - 50) {
        this.x = x;
        this.y = y;
        this.turn = 1;
        this.state = "idle";
        this.animation = 0;
        this.animationUpdate = 0;
        this.animation = 0;
    }
}

class Cat extends Something {
    constructor(x, y){
        super(x, y);
    }

    update(elapsed, total, eventQueue) {
        ctx.drawImage(Resources.Cat[this.turn][this.state][this.animation], this.x, this.y);
    }
}

function newPlayer(x = 0, y = 0) {
    return {
        x: x,
        y: y,
        floor: y,
        yForce: 0.4,
        turn: 1, // right | left
        state: "idle", // idle | walk
        jump: 0,
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
            if (player.x % 10 < 5) player.x -= player.x % 10;
            else player.x += 10 - player.x % 10;
            player.state = "idle";
            player.animationUpdate = 0;
        }
        else if (event.type == "jump" && player.jump == 0) {
            player.jump = 1;
            player.yForce = -10;
        }
    }

    // Y Movement
    if (player.y >= player.floor) {
        player.yForce = 0;
        player.y = player.floor;    
    }
    else if (player.y < player.floor) {
       player.yForce += 0.05;    
    }

    if (player.y + player.yForce * elapsed >= player.floor) {
        player.y = player.floor;
    }
    else {
        player.y += player.yForce * elapsed;
    }

    // X Movement
    if (player.state == "walk")  {
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

function checkPlayerExit(player, goingLeft, goingRight) {
    console.log(player.x);
    if (player.x < WALL_LEFT - 120) {
        if (!goingLeft) {
            player.x = WALL_RIGHT + 50;
            return "loop_left";
        }
        else {
            player.x += 130;
            return "go_left";
        }
    }

    if (player.x > WALL_RIGHT + 50) {
        if (!goingRight) {
            player.x = WALL_LEFT - 120;
            return "loop_right";
        }
        else {
            player.x -= 130;
            return "go_right";
        }
    }
}

class Room {
    constructor(goingLeft, goingRight, drawWalls = true) {
        this.goingLeft = goingLeft;
        this.goingRight = goingRight;
        this.drawWalls = true;
        this.player = newPlayer(WALL_LEFT + 10, WALL_BOTTOM - 100);
        this.env = [];
    }

    update(elapsed, total, eventQueue) {
        drawForeground()
        if (this.drawWalls) drawTopBottomWalls();

        for (let e of this.env) e.update(elapsed, total, eventQueue);

        updatePlayer(this.player, elapsed, total, eventQueue);

        if (this.drawWalls) drawLeftRightWalls();

        return checkPlayerExit(this.player, this.goingLeft, this.goingRight);
    }
}


const ROOMS = [
    Object.assign(new Room(false, true), {
        drawWalls: true,
        env: [new Cat(400, WALL_BOTTOM - 80)],
    }),
    Object.assign(new Room(true, false), {
        drawWalls: false,
    }),
];
console.log(ROOMS)

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
        let playerExit = this.rooms[this.currentRoom].update(tm, t, eventQueue);
        if (playerExit == "go_left") this.currentRoom--;
        else if (playerExit == "go_right") this.currentRoom++;

    }

    loop(t) {
        this.update(this.refreshRate / (t - this.lastUpdate), t);

        this.lastUpdate = t;
        
        window.requestAnimationFrame(this.loop.bind(this));
    }  
};

let game = new Game();
game.loop(1);

