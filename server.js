// 你需要安裝: npm install express socket.io
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // 允許你的 Vercel 網址連線
});

let players = {}; // 儲存所有在線玩家資訊

io.on('connection', (socket) => {
    console.log('玩家連線:', socket.id);

    // 1. 新玩家加入
    socket.on('joinGame', (userData) => {
        players[socket.id] = {
            id: socket.id,
            name: userData.name,
            x: 0, y: 0, z: 0, // 位置
            ry: 0,           // 視角旋轉
            score: 0
        };
        // 廣播給所有人：有新隊友
        io.emit('updatePlayers', players);
    });

    // 2. 同步位置 (頻率很高)
    socket.on('move', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].z = data.z;
            players[socket.id].ry = data.ry;
            socket.broadcast.emit('playerMoved', players[socket.id]);
        }
    });

    // 3. 處理射擊同步
    socket.on('shoot', (targetId) => {
        io.emit('enemyHit', { shooter: socket.id, targetId: targetId });
    });

    // 4. 斷線處理
    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
    });
});

server.listen(3000, () => {
    console.log('伺服器在 3000 埠運行中...');
});
