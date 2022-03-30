// Nandakumar Edamana
// 2021-12-11

CellResidentType = {
	Gem:   1,
	Snake: 2,
	Wall:  3,
	Wound: 4,
};

CollisionType = {
	None:   0,
	Doom:   1,
	Gem:    2,
};

var vidattr = {
	width:  40,
	height: 30,
	scale:  14
};

var state = null;

function SnakePart(_direction, _length) {
	return { direction: _direction, length: _length };
}

function Snake() {
	var snake = {}
	
	snake.x = Math.abs(vidattr.width / 2);
	snake.y = Math.abs(vidattr.height / 2);
	
	snake.direction = 'r';
	
	snake.parts = [ SnakePart('r', 1), SnakePart('u', 4) ];

	return snake;
}

function State() {
	var state = {};
	
	state.gameOver = false;
	state.paused   = false;
	state.score    = 0;

	state.snake  = Snake();
	
	state.gemx   = -1;
	state.gemy   = -1;
	state.gemCountdown = -1; // -1 means gem without countdown
	
	state.vidbuf = undefined;
	state.frequency = 180;

	return state;
}

function drawSnakePoint(state, x, y) {
	var coltype = CollisionType.None;

	var prvres = state.vidbuf[y][x];

	state.vidbuf[y][x] = CellResidentType.Snake;

	switch(prvres) {
	case CellResidentType.Wall:
	case CellResidentType.Snake:
		coltype = CollisionType.Doom;
		state.vidbuf[y][x] = CellResidentType.Wound;
		break;
	case CellResidentType.Gem:
		coltype = CollisionType.Gem;
		break;
	}

	return coltype;
}

// Returns the collision type
function draw(state) {
	var retval = CollisionType.None;

	// BEGIN Reset Buffer
	state.vidbuf = [];
	for(var y = 0; y < vidattr.height; y++) {
		state.vidbuf[y] = [];

		for(var x = 0; x < vidattr.width; x++)
			state.vidbuf[y][x] = CellResidentType.None;
	}
	// END Reset Buffer

	// BEGIN Wall
	for(var y = 0; y < vidattr.height; y++) {
		state.vidbuf[y][0] = CellResidentType.Wall;
		state.vidbuf[y][vidattr.width - 1] = CellResidentType.Wall;
	}

	for(var x = 1; x < vidattr.width - 1; x++) {
		state.vidbuf[0][x] = CellResidentType.Wall;
		state.vidbuf[vidattr.height - 1][x] = CellResidentType.Wall;
	}
	// END Wall

	if(state.gemx > 0 && state.gemy > 0)
		state.vidbuf[state.gemy][state.gemx] = CellResidentType.Gem;

	var partx = state.snake.x;
	var party = state.snake.y;
	var prvpartdir = undefined;
	var prvpartlen = 0;
	
	for(var i = 0; i < state.snake.parts.length; i++) {
		var part = state.snake.parts[i];
	
		// Previous part's direction determines the follower's X and Y offsets
		switch(prvpartdir) {
		case 'l': partx += prvpartlen; break;
		case 'r': partx -= prvpartlen; break;
		case 'u': party += prvpartlen; break;
		case 'd': party -= prvpartlen; break;
		}

		if(part.direction === 'l' || part.direction === 'r') {
			// Choose the leftmost point to start drawing
			var partxDraw = partx;
			if(part.direction === 'r')
				partxDraw = partx - part.length + 1;

			for(var x = 0; x < part.length; x++) {
				var coltype = drawSnakePoint(state, partxDraw + x, party);
				if(coltype !== CollisionType.None) {
					retval = coltype;
				}
			}
		}
		else {
			// Choose the topmost point to start drawing
			var partyDraw = party;
			if(part.direction === 'd')
				partyDraw = party - part.length + 1;

			for(var y = 0; y < part.length; y++) {
				var coltype = drawSnakePoint(state, partx, partyDraw + y);
				if(coltype !== CollisionType.None) {
					retval = coltype;
				}
			}
		}
		
		prvpartdir = part.direction;
		prvpartlen = part.length;
	}

	return retval;
}

function paint(state) {
	var cnvs  = document.getElementById('cnvs');
	var cntxt = cnvs.getContext('2d');

	for(var y = 0; y < vidattr.height; y++) {
		for(var x = 0; x < vidattr.width; x++) {
			switch(state.vidbuf[y][x]) {
			case CellResidentType.Gem:
				cntxt.fillStyle = '#a0a';
				
				if(state.gemCountdown > 0) {
					if(state.gemCountdown & 1)
						cntxt.fillStyle = '#af0';
					else
						cntxt.fillStyle = '#aa0';
				}
				
				break;
			case CellResidentType.Snake:
				cntxt.fillStyle = '#0a0';
				break;
			case CellResidentType.Wound:
				cntxt.fillStyle = '#f00';
				break;
			case CellResidentType.Wall:
				cntxt.fillStyle = '#0af';
				break;
			default:
				cntxt.fillStyle = '#000';
				break;
			}

			cntxt.fillRect(x * vidattr.scale, y * vidattr.scale,
			               vidattr.scale, vidattr.scale);
		}
	}
	
	document.getElementById('score').innerText = state.score;
	document.getElementById('speed').innerText =
		Math.round(1000 / state.frequency * 10);
	
	if(state.gameOver)
		document.getElementById('gameOver').innerText = 'Game Over.';
	else if(state.paused)
		document.getElementById('gameOver').innerText = 'Paused.';
	else
		document.getElementById('gameOver').innerText = '';

	document.getElementById('gemCountdown').innerText =
		(state.gemCountdown > 0)? state.gemCountdown: 'Normal Gem';
}

function move(state) {
	if(state.gameOver)
		return;

	// Add a new head part if the new direction is different
	if(state.snake.direction !== state.snake.parts[0].direction)
		state.snake.parts.unshift(SnakePart(state.snake.direction, 0))

	// Lengthen the head part by one and cut short the tail part by one
	state.snake.parts[0].length++;
	state.snake.parts[state.snake.parts.length - 1].length--;
	
	if(state.snake.parts[state.snake.parts.length - 1].length <= 0) {
		if(state.snake.parts.length <= 1) {
			console.error('Internal error: snake size became zero.');
			window.clearInterval(state.timer);
		}
		else {
			state.snake.parts.pop();
		}
	}

	switch(state.snake.direction) {
	case 'l': state.snake.x--; break;
	case 'r': state.snake.x++; break;
	case 'u': state.snake.y--; break;
	case 'd': state.snake.y++; break;
	default:
		console.error('Invalid internal state: unknown direction.');
		window.clearInterval(state.timer);
	}
}

function hasFreeSpace(state) {
	for(var y = 0; y < vidattr.height; y++)
		for(var x = 0; x < vidattr.width; x++)
			if(state.vidbuf[y][x] == CellResidentType.None)
				return true;
	
	return false;
}

function putGem(state) {
	if(state.gameOver)
		return;

	if(!hasFreeSpace(state))
		return;

	var x = 0;
	var y = 0;

	do {
		x = Math.floor(Math.random() * vidattr.width);
		y = Math.floor(Math.random() * vidattr.height);
	} while(state.vidbuf[y][x] != CellResidentType.None);

	state.gemx = x;
	state.gemy = y;
	
	// TODO set a meaningful countdown, based on the shortest distance possible.
	if(Math.random() > 0.6)
		state.gemCountdown = vidattr.width;
	else
		state.gemCountdown = 0;
}

function swallowGem(state) {
	addScore(state, (state.gemCountdown > 0)? 100: 10);
	state.snake.parts[state.snake.parts.length - 1].length++;
	putGem(state);
}

function addScore(state, score) {
	var prvscore = state.score;

	state.score += score;
	
	// If the new score is in a higher band
	if(Math.floor(state.score / 100) > Math.floor(prvscore / 100)) {
		if(state.frequency > 100) { // for a minimum playable freq
			state.frequency -= 5;
			restartTimer(state);
		}
	}
}

function onTick(state) {
	move(state);

	if(state.gemCountdown > 0)
		state.gemCountdown--;

	var coltype = draw(state);

	switch(coltype) {
	case CollisionType.Doom:
		state.gameOver = true;
		window.clearInterval(state.timer);
		break;
	case CollisionType.Gem:
		swallowGem(state);
		break;
	}

	paint(state);
}

function restartTimer(state) {
	window.clearInterval(state.timer);
	state.timer = window.setInterval(() => { onTick(state) }, state.frequency);
}

function togglePause(state) {
	if(state.gameOver)
		return;

	state.paused = !state.paused;
	
	if(state.paused)
		window.clearInterval(state.timer);
	else
		restartTimer(state);
	
	paint(state);
}

function restartGame() {
	var state = State();

	draw(state);
	putGem(state);
	paint(state);
	
	return state;
}

window.addEventListener('DOMContentLoaded', () => {
	var cnvs = document.getElementById('cnvs');
	
	cnvs.width  = vidattr.width * vidattr.scale;
	cnvs.height = vidattr.height * vidattr.scale;
	
	var game = { state: restartGame() };

	document.addEventListener('keydown', (e) => {
		switch(e.key) {
		case 'ArrowLeft':  game.state.snake.direction = 'l'; break;
		case 'ArrowRight': game.state.snake.direction = 'r'; break;
		case 'ArrowUp':    game.state.snake.direction = 'u'; break;
		case 'ArrowDown':  game.state.snake.direction = 'd'; break;
		}
	});

	document.getElementById('btnL').addEventListener('click',
		(e) => { game.state.snake.direction = 'l'; });

	document.getElementById('btnR').addEventListener('click',
		(e) => { game.state.snake.direction = 'r'; });
		
	document.getElementById('btnU').addEventListener('click',
		(e) => { game.state.snake.direction = 'u'; });

	document.getElementById('btnD').addEventListener('click',
		(e) => { game.state.snake.direction = 'd'; });

	document.getElementById('btnPause').addEventListener('click',
		(e) => { togglePause(game.state); });

	document.getElementById('btnRestart').addEventListener('click', (e) => {
		if(confirm('Are you sure?')) {
			window.clearInterval(game.state.timer);
			game.state = restartGame();
			restartTimer(game.state);
		}
	});

	cnvs.focus();

	restartTimer(game.state);
});
