class Game {
	constructor() {
		this.canvas = document.querySelector('#canvas');
		this.ctx = this.canvas.getContext('2d');
		this.socket = io('http://192.168.2.20:3000');

		this.fps = 300;
		this.mouseX = 0;
		this.mouseY = 0;

		this.players = [];
		this.points = [];

		this.player = {};

		this.canvas.width = 1920;
		this.canvas.height = 1080;
	}

	async start() {
		await this.#loadData();
		this.#joinPlayer();
		this.#updateUI();
		this.#render();

		this.socket.on('update', (data) => {
			this.running = true;
			this.players = data.players;
			this.points = data.points;
			this.player = data.players.find((el) => el.id == this.socket.id);
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

	#joinPlayer() {
		this.socket.emit('player-join');
	}

	#render() {
		setInterval(() => {
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
		}, 1000 / this.fps);
	}

	#updateUI() {
		const loading = document.querySelector('#loading');
		const playerData = document.querySelector('#player-data');
		const points = document.querySelector('#points-amount');
		const name = document.querySelector('#player-name');
		const leaderBoards = document.querySelector('#leaderboards');
		setInterval(() => {
			//* update leaderBoards
			for (const player of this.players.sort((a, b) => a.points > b.points)) {
				const el = document.createElement('div');
				el.innerHTML = `1. ${player.name || 'brak'}: ${player.points}`;

				leaderBoards.appendChild(el);
			}

			if (this.player) {
				points.innerHTML = this.player.points || 0;
				name.innerHTML = this.player.name || 'Brak';
			}
		}, 10);

		loading.style.display = 'none';
		leaderBoards.style.display = 'block';
		playerData.style.display = 'block';
		canvas.style.display = 'block';
	}

	async #loadData() {
		console.log('ladowanie..');
		const req = await axios.get('http://192.168.2.20:3000/state');
		if (req.status == 200) {
			const { data } = await axios.get('http://192.168.2.20:3000/game-data');
			console.log(data);
			this.players = data.players;
			this.points = data.points;
			console.log('gitara');
			return true;
		} else {
			return this.#loadData();
		}
	}
}
