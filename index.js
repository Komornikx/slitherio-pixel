const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: '*' } });
const path = require('path');
const cors = require('cors');

const port = process.env.PORT || 3000;

const GameServer = require('./gameServer');

app.use(cors());
app.use(express.static('html'));

const game = new GameServer(io);
game.start();

app.get('/state', (err, res) => {
	if (game.running) return res.status(200).send(true);
	return res.status(400).send(false);
});

app.get('/game-data', (err, res) => {
	if (game.running) {
		return res.json({
			players: game.players,
			points: game.points,
			width: game.mapWidth,
			height: game.mapHeight,
		});
	}
	return res.status(400).send(false);
});

http.listen(port, (err) => {
	if (err) return console.log(err);
	console.log(`server listening at http://localhost:${port}`);
});
