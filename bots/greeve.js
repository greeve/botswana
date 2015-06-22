// Bot: greeve
// Ruleset: default
// Learning to write a bot.
// --------------------------------------------------

var greeve = function() {};

greeve.prototype = new Bot();

greeve.prototype.setup = function() {
    this.timer = 0;
    this.attrStrength = 200;
    this.safety = 1000;
    this.repStrength = 150;
    this.movements = ['strafe-right', 'strafe-left', 'forward', 'backward'];
};

greeve.prototype.getBotWithId = function(id) {
    for (i in this.state.bots) {
        if (this.state.bots[i].id == id) {
            return this.state.bots[i];
        }
    }
    return undefined;
};

greeve.prototype.getOpponentBots = function() {
    opponents = [];
    for (i in this.state.bots) {
        if (this.name != this.state.bots[i].name) {
            opponents.push(this.state.bots[i]);
        }
    }
    return opponents;
};

greeve.prototype.getTeamBots = function() {
    team = [];
    for (i in this.state.bots) {
        if (this.name == this.state.bots[i].name) {
            team.push(this.state.bots[i]);
        }
    }
    return team;
};

greeve.prototype.getTarget = function() {
    if (typeof this.state.payload.targets == 'undefined') {
        this.state.payload.targets = {}
    }
    target = this.getBotWithId(this.state.payload.targets[this.id]);
    if (target == undefined) {
        opponents = this.getOpponentBots();
        closeness = 10000;
        for (i in opponents) {
            distance = this.myDistanceToPoint(opponents[i].x, opponents[i].y);
            if (distance < closeness) {
                target = opponents[i];
                closeness = distance;
            }
        }
    }
    this.state.payload.targets[this.id] = target.id;
    return target;
};

greeve.prototype.avoidBullets = function() {
    var dx = 0;
    var dy = 0;
    for (i in this.state.weapons) {
        var bullet = this.state.weapons[i];
        if (bullet.owner != this.id && this.myDistanceToPoint(bullet.x, bullet.y) < 50) {
            deltas = this.avoidCircle(10, bullet.x, bullet.y, 25);
            dx += deltas[0];
            dy += deltas[1];
        }
    }
    return [dx, dy];
};

greeve.prototype.run = function() {
	this.timer++;
	target = undefined;

	var cmd = 'wait';
	// get the opponent's information
	target = this.getTarget();

	// have I collided with a bot?
	this.collided = false;
	if (this.collisions.length > 0) {
		for (i in this.collisions) {
			if (this.collisions[i].type == 'bot')
				this.collided = true;
            if (this.collisions[i].type == 'obstacles')
                this.collided = true;
		}
	}

	var avoidBullets = this.avoidBullets();
	var avoid = [avoidBullets[0], avoidBullets[1]]
	var avoidDirection = this.getDirection({'x': avoid[0], 'y': avoid[1]}, 0.1);

	// if I need to avoid bullets or teammates, strafe-left or right
	if (avoid[0] != 0 && avoid[1] != 0 && avoidDirection.command != 'forward' && avoidDirection.command != 'wait') {
		var behindMe = this.angle - Math.PI;
		if (avoidDirection.command == 'right')
			cmd = 'strafe-right';
		else
			cmd = 'strafe-left';
	}

	if (target != undefined) {
		direction = this.getDirection(target, 0.05);
		distance = this.myDistanceToPoint(target.x, target.y);

		if (direction.command != 'forward') {
			// if target is not in front of me, do what it takes to get there.
			cmd = direction.command;
		} else if (this.canShoot && this.weapons.bullet > 0) {
			// if the target is in front and I can shoot and I have bullets to shoot, shoot!
			cmd = "fire";
		} else if (target.health <= this.health) {
			// if the targets health is less than my own, attack!
			cmd = "forward";
		} else if (cmd == 'wait' && distance < 150 && target.health > this.health) {
			// move backwards, if the target is close enough and it's health is greater than my own.
			cmd = "backward";
		} else if (this.collided == true) {
            // move if collided with another bot
            cmd = "backward";
        }
	} 

	return { command: cmd, team: this.state.payload };
};

server.registerBotScript("greeve");
