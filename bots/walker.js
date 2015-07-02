// Bot: Walker
// Ruleset: Mayhem
// Just a baby bot. Walk before you run.
// -------------------------------------

var Walker = function() {};

Walker.prototype = new Bot();

Walker.prototype.setup = function() {
    this.timer = 0;
    this.attrStrength = 10
    this.safety = 10;
    this.repStrength = 4;
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
    target = this.getBotById(this.state.payload.targets[this.id]);
    if (target == undefined) {
        opponents = this.getOpponentBots();
        closeness = 5000;
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

Walker.prototype.run = function() {
	this.timer++;
    var command = '';

    if (typeof this.state.payload.targets == 'undefined') {
        this.state.payload.targets = {}
    }

    this.target = this.getTarget();
    this.direction = this.getDirection(this.target, 0.05);

    command = '';
	if (this.canShoot && this.weapons.bullet > 0) {
        command = 'fire';
    } else if (command != this.direction.command) {
        command = this.direction.command;
    }     

    return { command: command, team: this.state.payload };
};

server.registerBotScript("Walker");
