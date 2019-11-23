export class Player extends GameObject {
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
                if (this.x % 10 < 5) this.x -= this.x % 10;
                else this.x += 10 - this.x % 10;
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
