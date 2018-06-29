const ws = require('ws');
const webSocketSend = require('./send');
const webSocketController = require('../controllers/websocket');
const apiController = require('../controllers/api')
const userCache = require('./userCache');

const WebSocketServer = ws.Server;

module.exports = (server) => {
    let wss = new WebSocketServer({
        server: server
    });

    wss.on('connection', (ws) => {
        new WebSocketConnection(ws, wss);
    });
}

class WebSocketConnection {
    constructor(ws, wss) {
        this.userId = '';

        ws.on('message', (message) => {
            console.log("message: ", message);
            const messageData = JSON.parse(message);
            if (messageData.type === 'setWebSocketUserId') {
                this.userId = messageData.data.userId;
                webSocketController.setRoomUserAtive({ isActive: 1, id: this.userId })
                userCache.set(this.userId, {ws});
                return;
            }

            webSocketSend(wss, ws, message);
        });

        ws.on('error', (err) => {
            console.log(`errored: ${err}`);
        });

        ws.on('close', (event) => {
            console.log("userId: ", this.userId);
            if (!this.userId) {
                return;
            }

            webSocketController.setRoomUserAtive({ isActive: 0, id: this.userId });
            apiController.deleteRoomUserByUserId({ userId: this.userId });
            userCache.delete(this.userId);
        });
    }
}