const Player = require('./Player');
const Point = require('./Point');

class GameServer {
	constructor(io) {
		this.io = io;
		this.mapWidth = 1920;
		this.mapHeight = 1080;

		this.running = false;

		this.players = [];
		this.points = [];

		this.io.on('connection', (socket) => {
			socket.on('player-join', (data) => {
				this.players.push(
					new Player(socket.id, 40, 40, data.name, this.#getRandomColor())
				);

				this.#emitUpdate();
			});

			socket.on('change-dir', (data) => {
				for (const player of this.players) {
					if (player.id == socket.id) {
						player.mouseX = data.mouseX;
						player.mouseY = data.mouseY;
					}
				}
			});

			socket.on('disconnect', () => {
				this.players = this.players.filter((el) => el.id != socket.id);
			});
		});
	}

	start() {
		this.#mainLoop();
		this.#generatePoints(100);

		this.running = true;
	}

	#mainLoop() {
		setInterval(() => {
			for (const player of this.players) {
				//* move loop
				player.diffX = player.mouseX - player.x;
				player.diffY = player.mouseY - player.y;

				let pointDist = Math.sqrt(
					player.diffX * player.diffX + player.diffY * player.diffY
				);

				if (pointDist > 5) {
					player.diffX *= 1 / pointDist;
					player.diffY *= 1 / pointDist;
				}

				player.x += player.diffX;
				player.y += player.diffY;

				if (player.diffX + player.diffY != 0) {
					player.tail.push({
						x: player.x,
						y: player.y,
						color: this.#getRandomColor(),
					});
				}

				if (player.tail.length > player.points * 10) {
					player.tail.shift();
				}

				//* pick points detect
				for (const point of this.points) {
					if (
						(player.x >= point.x || player.x + player.size >= point.x) &&
						(player.y >= point.y || player.y + player.size >= point.y) &&
						player.x <= point.x + point.size &&
						player.y <= point.y + point.size
					) {
						this.#pickPoint(player, point);
					}
				}

				//* touch other player tail detect
				for (const player2 of this.players) {
					if (player.id != player2.id) {
						for (const tailPart of player2.tail) {
							if (
								(player.x >= tailPart.x ||
									player.x + player.size >= tailPart.x) &&
								(player.y >= tailPart.y ||
									player.y + player.size >= tailPart.y) &&
								player.x <= tailPart.x + player2.size &&
								player.y <= tailPart.y + player2.size
							) {
								this.#killPlayer(player);
							}
						}
					}
				}

				player.size = this.#calculatePlayerSize(player);
			}
			this.#emitUpdate();
		}, 10);
	}

	#emitUpdate() {
		this.io.emit('update', {
			players: this.players,
			points: this.points,
		});
	}

	#killPlayer(player) {
		const spawnPoints = player.points;

		this.players = this.players.filter((el) => el.id != player.id);
	}

	#pickPoint(player, point) {
		this.points = this.points.filter((el) => el != point);
		player.points++;
		this.#generatePoint();
		this.#emitUpdate();
	}

	#generatePoints(amount) {
		for (let x = 0; x <= amount; x++) {
			this.#generatePoint();
		}
	}

	#generatePoint() {
		const position = this.#getRandomPosition();
		const size = this.#getRandomSize();
		this.points.push(
			new Point(position.x, position.y, size, this.#getRandomPointColor())
		);
	}

	#getRandomPosition() {
		const maxX = this.mapWidth;
		const maxY = this.mapHeight;
		return {
			x: Math.floor(Math.random() * (0 - maxX) + maxX),
			y: Math.floor(Math.random() * (0 - maxY) + maxY),
		};
	}

	#calculatePlayerSize(player) {
		return (player.points < 10 ? 10 : player.points) * 1.1;
	}

	#getRandomSize() {
		const min = 10;
		const max = 20;

		return Math.floor(Math.random() * (min - max) + max);
	}

	// todo
	#getRandomColor() {
		const colors = ['#00e500', '#00cc00', '#00b200', '#009900', '#007f00'];
		return colors[Math.floor(Math.random() * colors.length)];
	}

	#getRandomPointColor() {
		return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
	}
}

module.exports = GameServer;
