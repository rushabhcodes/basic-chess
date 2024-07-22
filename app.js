const express = require('express');
const socket = require('socket.io');
const http = require('http');
const { Chess } = require('chess.js')
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();
let players = {};
let currentPlayer = 'w';

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index', { title: 'Basic Chess Game' });
});

io.on("connection", (uniquesocket) => {
    console.log('New user connected');

    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit('playerRole', 'w');

    }
    else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit('playerRole', 'b');
    }
    else {
        uniquesocket.emit('playerRole', 'Spectator');
    }
    uniquesocket.on("disconnect", () => {
        if (players.white === uniquesocket.id) {
            delete players.white;
            console.log('White player disconnected');
        }
        else if (players.black === uniquesocket.id) {
            delete players.black;
            console.log('Black player disconnected');
        }
        else {
            console.log('A Spectator disconnected');
        }

    });

    uniquesocket.on('move', (move) => {
        try{
            if (chess.turn() === 'w' && players.white !== uniquesocket.id) return;
            if (chess.turn() === 'b' && players.black !== uniquesocket.id) return;
            const result = chess.move(move);
            if(result){
                currentPlayer = chess.turn();
                io.emit('move', move);
                io,emit('boardState',chess.fen());
            }else{
                console.log('Invalid move', move);
                uniquesocket.emit("invalidMove", move);
            }
        }
        catch(err) {
            console.log(err, move);
            uniquesocket.emit("invalidMove", move);
        }
        
    });
});
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});