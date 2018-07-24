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
        this.userName = '';

        ws.on('message', (message) => {
            console.log("message: ", message);
            const messageData = JSON.parse(message);
            if (messageData.type === 'setWebSocketUserId') {
                this.userId = messageData.data.userId;
                this.userName = messageData.data.userName;
                let roomId = messageData.data.roomId;
                if (roomId) {
                    message = JSON.stringify({
                        data: {
                            userId: this.userId,
                            userName: this.userName,
                            roomId
                        },
                        type: 'changedRoomUser'
                    });
                    webSocketSend(wss, ws, message);
                }

                webSocketController.setRoomUserAtive({ isActive: 1, id: this.userId });
                userCache.set(this.userId, { ws });
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
            userCache.delete(this.userId);

            // 解决刷新会删除用户信息问题
            setTimeout(async () => {
                if (userCache.get(this.userId)) {
                    return;
                }

                let roomId = await apiController.getRoomIdByUserId({ userId: this.userId });
                await webSocketController.setRoomUserAtive({ isActive: 0, id: this.userId });
                await apiController.deleteRoomUserByUserId({ userId: this.userId, roomId });
                let userList = await apiController.getRoomUserListByRoomId({ roomId });
                let message = JSON.stringify({
                    data: {
                        userId: this.userId,
                        roomId,
                        userList
                    },
                    type: 'reloadRoomUser'
                });
                webSocketSend(wss, ws, message);
            }, 5 * 1000);
        });
    }
}