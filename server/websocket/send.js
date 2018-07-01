const webSocketController = require('../controllers/websocket');
const apiController = require('../controllers/api');
const { startGame, checkAnswer } = require('./startGame');
const moment = require('moment');

let broadcast = (wss, data) => {
    wss.clients.forEach((client) => {
        client.send(data);
    });
}

module.exports = async (wss, ws, message) => {
    console.log('websocket send message: ', message);
    const messageData = JSON.parse(message);
    let data;
    switch (messageData.type) {
        case 'createRoom':
            let createRoomData = {
                name: messageData.data.roomName,
                createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                status: 1,
                isPublic: messageData.data.isPublic
            }

            data = await webSocketController.createRoom(createRoomData);
            broadcast(wss, JSON.stringify({
                data: Object.assign({}, createRoomData, { id: data.insertId }),
                type: 'addRoom'
            }));

            break;
        case 'addRoomUser':
            data = await webSocketController.addRoomUser(messageData.data);
            let userList = await apiController.getRoomUserListByRoomId({ roomId: messageData.data.roomId });
            messageData.data = Object.assign({}, messageData.data, { userList })
            console.log("mesagedata: addroomUser: ", messageData.data);
            broadcast(wss, JSON.stringify({
                data: messageData.data,
                type: 'addRoomUser'
            }));

            break;
        case 'startGame':
            broadcast(wss, JSON.stringify({
                data: messageData.data,
                type: 'startGame'
            }));
            startGame(wss, messageData.data.roomId);

            break;
        case 'drawPicture':
            broadcast(wss, JSON.stringify({
                data: messageData.data,
                type: 'drawPicture'
            }));

            break;
        case 'submitAnswer':
            checkAnswer(wss, messageData.data);

            break;
        case 'deleteRoomUser':
            await apiController.deleteRoomUserByUserId({ userId: messageData.data.userId });
            broadcast(wss, JSON.stringify({
                data: messageData.data,
                type: 'deleteRoomUser'
            }))

            break;
        default:
            console.warn('websocket not send message type');
    }
}