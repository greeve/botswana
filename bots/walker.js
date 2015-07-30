// Bot: Walker
// Ruleset: Mayhem
// Just a baby bot. Walk before you run.
// -------------------------------------

var Walker = function() {};

Walker.prototype = new Bot();

Walker.prototype.setup = function() {
    this.timer = 0;
    this.target = undefined;
    this.strafe = 75;
    this.attrStrength = 8;
    this.safety = 10;
    this.repStrength = 2;
    this.commands = ['forward', 'backward', 'right', 'strafe-right', 'left', 'strafe-left', 'fire', 'mine', 'wait'];
};

Walker.prototype.getBotById = function(id) {
	for (i in this.state.bots) {
		if (this.state.bots[i].id == id) return this.state.bots[i];
	}
	return undefined;
};

Walker.prototype.getOpponentBots = function() {
    opponents = [];
    for (i in this.state.bots) {
        if (this.name != this.state.bots[i].name) {
            opponents.push(this.state.bots[i]);
        }
    }
    return opponents;
};

Walker.prototype.getTeamBots = function() {
    team = [];
    for (i in this.state.bots) {
        if (this.name == this.state.bots[i].name) {
            team.push(this.state.bots[i]);
        }
    }
    return team;
};

Walker.prototype.getTarget = function() {
	var target = undefined;
	var distance = 50000;	// Obscenely high number

	for (i in this.state.bots) {
		var bot = this.state.bots[i];
		// Only attack opposing bots
		if (bot.name != this.name) {
			// If I'm closer to this bot, make it my target
			if (this.myDistanceToPoint(bot.x, bot.y) < distance) {
				target = bot;
				this.state.payload.targets[this.id] = bot.id;
				distance = this.myDistanceToPoint(bot.x, bot.y);
			}
		}
	}
	return target;
}

Walker.prototype.sideStep = function() {
    var command = '';
    if (this.strafe > 25) {
        command = "strafe-left";
    } else {
        command = "strafe-right";
    }

    // Decrease strafe counter
    this.strafe--;

    if (this.strafe == 0) {
        this.strafe = 100;
    }

    return command;
}

Walker.prototype.checkCollisions = function(point) {
	var collision = false;
	var type = '';
	var object = undefined;

	var obstacles = server.getObstacles();
	var bots = server.getBots();

	// Check bots
	for (i in bots) {
		bot = bots[i];
		if (server.collisionBotWeapon(bot, point)) {
			collision = true;
			type = 'bot';
			object = bot;
			break;
		}
	}

	// Check obstacles
	if (!collision) {
		for (i in obstacles) {
			obstacle = obstacles[i];
			if (server.collisionObstacle(obstacle, point)) {
				collision = true;
				type = 'obstacle';
				object = obstacle;
				break;
			}
		}
	}

	// Check boundaries
	if (!collision && server.collisionBoundary(point)) {
		collision = true;
		type = 'boundary';
		object = undefined;
	}
	
	return { collision: collision, type: type, object: object };
}

Walker.prototype.pointInCircle = function(x, y, centerX, centerY, radius) {
    var squareDistance = Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2)
    return squareDistance < Math.pow(radius, 2)
}

Walker.prototype.distanceToCollision = function(x, y, angle) {
	var speed = 5;
	var newPoint = { x: x, y: y };
	var response = {};
	response.collision = false;

	while (!response.collision) {
		newPoint = server.helpers.calcVector(newPoint.x, newPoint.y, angle, speed);
		response = this.checkCollisions(newPoint);
	}

	distance = this.myDistanceToPoint(newPoint.x, newPoint.y);

	return { distance: distance, type: response.type, object: response.object };
}

Walker.prototype.run = function() {
	this.timer++;
    var command = '';

    if (typeof this.state.payload.targets == 'undefined') {
        this.state.payload.targets = {};
    }

    this.target = this.getTarget();
    if (this.target != undefined) { 
        this.direction = this.getDirection(this.target, 0.05);
        var distToTarget = this.myDistanceToPoint(this.target.x, this.target.y);
        var futureForwardPosition = server.helpers.calcVector(this.x, this.y, this.angle, this.radius + 1);
        var nextCollision = this.distanceToCollision(futureForwardPosition.x, futureForwardPosition.y, this.angle);
        var facingEnemy = (nextCollision.type == 'bot' && nextCollision.object.name != this.name);
        var facingFriend = (nextCollision.type == 'bot' && nextCollision.object.name == this.name && nextCollision.distance < 50);
        var facingObstacle = (nextCollision.type == 'obstacle' && nextCollision.distance < 50);
        var facingBoundary = (nextCollision.type == 'boundary' && nextCollision.distance < 50);

        var tooFar = distToTarget > 50 * this.radius;

        command = '';
        if (this.canShoot && this.weapons.bullet > 0 && facingEnemy && !tooFar) {
            command = 'fire';
        } else if (command != 'forward') {
            command = this.direction.command;
        } else {
            if (tooFar) {
                command = "forward";
            } else if (this.canShoot && this.weapons.bullet > 0) {
                command = 'fire';
            } else {
                command = this.sideStep();
            }
        }

        if (facingFriend || facingObstacle || facingBoundary) {
            command = this.sideStep();
        }
    } else {
        command = 'wait';
    }

    return { command: command, team: this.state.payload };
};

server.registerBotScript("Walker");
