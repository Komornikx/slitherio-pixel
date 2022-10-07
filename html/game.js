class Game {
	constructor() {
		this.canvas = document.querySelector('#canvas');
		this.ctx = this.canvas.getContext('2d');

		this.socket = io('');

		this.fps = 300;
		this.mouseX = 0;
		this.mouseY = 0;

		this.players = [];
		this.points = [];

		this.player = {};

		this.canvas.width = 1920;
		this.canvas.height = 1080;
	}

	async start(playerName) {
		await this.#loadData();
		this.#joinPlayer(playerName);
		this.#update();

		this.socket.on('update', (data) => {
			this.running = true;
			this.players = data.players;
			this.points = data.points;
			this.player = data.players.find((el) => el.id == this.socket.id);
		});

		document.addEventListener('keydown', (e) => {
			if (e.keyCode == 32) {
				this.socket.emit('player-speed', true);
			}
		});

		document.addEventListener('keyup', (e) => {
			if (e.keyCode == 32) {
				this.socket.emit('player-speed', false);
			}
		});

		this.canvas.addEventListener('mousemove', (e) => {
			const rect = this.canvas.getBoundingClientRect();
			this.mouseX = e.clientX - rect.left;
			this.mouseY = e.clientY - rect.top;

			this.socket.emit('change-dir', {
				mouseX: this.mouseX,
				mouseY: this.mouseY,
			});
		});
	}

	#joinPlayer(name) {
		this.socket.emit('player-join', { name });
	}

	#update() {
		requestAnimationFrame(() => this.#renderFrame());
		requestAnimationFrame(() => this.#updateUI());
		requestAnimationFrame(() => this.#cameraFollow());
	}

	#renderFrame() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		for (const point of this.points) {
			this.ctx.fillStyle = point.color;
			this.ctx.fillRect(point.x, point.y, point.size, point.size);
		}
		for (const player of this.players) {
			this.ctx.fillStyle = player.color;
			this.ctx.fillRect(player.x, player.y, player.size, player.size);

			for (const tailpart of player.tail) {
				this.ctx.fillStyle = tailpart.color;
				this.ctx.fillRect(tailpart.x, tailpart.y, player.size, player.size);
			}
		}

		requestAnimationFrame(() => this.#renderFrame());
	}

	#cameraFollow() {
		const windowX = window.innerWidth;
		const windowY = window.innerHeight;

		this.canvas.style.left = `${-(this.player.x - windowX / 2)}px`;
		this.canvas.style.top = `${-(this.player.y - windowY / 2)}px`;

		requestAnimationFrame(() => this.#cameraFollow());
	}

	#updateUI() {
		const loading = document.querySelector('#loading');
		const game = document.querySelector('#game');
		const menu = document.querySelector('#menu');
		const points = document.querySelector('#points-amount');
		const name = document.querySelector('#player-name');
		const leaderBoard = document.querySelector('#leaderboard');

		const playerName = document.createElement('div');
		game.appendChild(playerName);
		// window.requestAnimationFrame(function renameLater() {
		// 	//* update leaderBoard
		// 	let htmlString = ``;
		// 	for (const [index, player] of this.players
		// 		.sort((a, b) => b.points - a.points)
		// 		.entries()) {
		// 		const elements = leaderBoard.getElementsByTagName('*');
		// 		if (elements.length < 9) {
		// 			htmlString += `<div><b>${index + 1}.</b> ${player.name || 'Brak'}: ${
		// 				player.points
		// 			}</div>`;
		// 		}
		// 	}
		// 	leaderBoard.innerHTML = htmlString;

		// 	if (this.player) {
		// 		points.innerHTML = this.player.points || 0;
		// 		name.innerHTML = this.player.name || 'Brak';

		// 		playerName.style.position = 'absolute';
		// 		playerName.style.left = `${this.player.x}px`;
		// 		playerName.style.top = `${this.player.y}px`;
		// 		playerName.innerHTML = this.player.name;
		// 	}
		// 	window.requestAnimationFrame(renameLater());
		// });
		// setInterval(() => {
		//   //* update leaderBoard
		//   let htmlString = ``;
		//   for (const [index, player] of this.players
		//     .sort((a, b) => b.points - a.points)
		//     .entries()) {
		//     const elements = leaderBoard.getElementsByTagName('*');
		//     if (elements.length < 9) {
		//       htmlString += `<div><b>${index + 1}.</b> ${player.name || 'Brak'}: ${
		//         player.points
		//       }</div>`;
		//     }
		//   }
		//   leaderBoard.innerHTML = htmlString;

		//   if (this.player) {
		//     points.innerHTML = this.player.points || 0;
		//     name.innerHTML = this.player.name || 'Brak';

		//     playerName.style.position = 'absolute';
		//     playerName.style.left = `${this.player.x}px`;
		//     playerName.style.top = `${this.player.y}px`;
		//     playerName.innerHTML = this.player.name;
		//   }
		// }, 10);

		loading.style.display = 'none';
		menu.style.display = 'none';
		leaderBoard.style.display = 'block';
		game.style.display = 'block';

		requestAnimationFrame(() => this.#updateUI());
	}

	async #loadData() {
		console.log('ladowanie..');
		const req = await axios.get('/state');
		if (req.status == 200) {
			const { data } = await axios.get('/game-data');
			this.players = data.players;
			this.points = data.points;
			this.canvas.width = data.width;
			this.canvas.height = data.height;
			console.log('zaladowano.');
			return true;
		} else {
			return this.#loadData();
		}
	}
}
