const Player = require('./Player');
const Point = require('./Point');

class GameServer {
	constructor(io, config) {
		this.io = io;
		this.config = config;

		this.running = false;

		this.players = [];
		this.points = [];

		this.io.on('connection', (socket) => {
			socket.on('player-join', (data) => {

				const playerExists = this.players.filter(el => el.id == socket.id)[0]
				if(playerExists){
					return
				}

				const position = this.#getRandomPosition();

				this.players.push(
					new Player(
						socket.id,
						position.x,
						position.y,
						data.name.slice(0, 15),
						this.#getRandomColor()
					)
				);

				this.#emitUpdate();
			});

			socket.on('player-speed', (data) => {
				for (const player of this.players) {
					if (player.id == socket.id) {
						player.speed = data;
					}
				}
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
				this.#emitUpdate();
			});
		});
	}

	start() {
		this.#mainLoop();
		this.#generatePoints(this.config.pointsInitAmount);

		this.running = true;
	}

	#mainLoop() {
		setInterval(() => {
			for (const player of this.players) {
				//* move
				player.diffX = player.mouseX - player.x;
				player.diffY = player.mouseY - player.y;

				let pointDist = Math.sqrt(
					player.diffX * player.diffX + player.diffY * player.diffY
				);

				player.diffX *= 1 / pointDist;
				player.diffY *= 1 / pointDist;

				const moveX = player.speed
					? player.diffX * this.config.boostSpeed
					: player.diffX * this.config.normalSpeed;
				const moveY = player.speed
					? player.diffY * this.config.boostSpeed
					: player.diffY * this.config.normalSpeed;

				player.x += moveX;
				player.y += moveY;

				if(player.x >= this.config.mapWidth){
					player.x = 0;
				}
				if(player.x < 0){
					player.x = this.config.mapWidth;
				}

				if(player.y >= this.config.mapHeight){
					player.y = 0;
				}
				if(player.y < 0){
					player.y = this.config.mapHeight;
				}

				player.mouseX += moveX;
				player.mouseY += moveY;

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
		}, 5);
	}

	#emitUpdate() {
		this.io.emit('update', {
			players: this.players,
			points: this.points,
		});
	}

	#killPlayer(player) {
		const spawnPoints = player.points;
		const tail = player.tail.splice(0, spawnPoints);

		for (const point of tail) {
			this.#generatePoint(point.x, point.y);
		}
		
		this.io.to(player.id).emit('ded')
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

	#generatePoint(x, y) {
		const position = x && y ? { x, y } : this.#getRandomPosition();
		const size = this.#getRandomSize();
		this.points.push(
			new Point(position.x, position.y, size, this.#getRandomPointColor())
		);
	}

	#getRandomPosition() {
		const maxX = this.config.mapWidth;
		const maxY = this.config.mapHeight;
		return {
			x: Math.floor(Math.random() * (0 - maxX) + maxX),
			y: Math.floor(Math.random() * (0 - maxY) + maxY),
		};
	}

	#calculatePlayerSize(player) {
		return player.size < 49 ? (player.points < 10 ? 10 : player.points) * 1.05 : player.size;
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
