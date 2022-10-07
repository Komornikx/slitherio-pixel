class Player {
	constructor(id, x, y, name, color) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.name = name;
		this.color = color;

		this.tail = [];
		this.points = 0;
		this.size = 10;

		this.mouseX = 0;
		this.mouseY = 0;
		this.diffX = 0;
		this.diffY = 0;
	}
}

module.exports = Player;
