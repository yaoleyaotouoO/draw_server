const webSocketController = require('../controllers/websocket');
const apiController = require('../controllers/api');
const { StartGameContext } = require('./startGame');
const { CheckAnswerContext } = require('./checkAnswer');
const { RoomUserStatusEnum } = require('../common/enums');
const { broadcast } = require('../common/websocketUtil');

module.exports = async (wss, ws, message) => {
    console.log('websocket send message: ', message);
    const messageData = JSON.parse(message);
    let data;
    let roomId = messageData.data.roomId;
    switch (messageData.type) {
        case 'changedRoomUser':
            data = await webSocketController.addRoomUser(messageData.data);
            let userList = await apiController.getRoomUserListByRoomId({ roomId });
            messageData.data = Object.assign({}, messageData.data, { userList })
            console.log("mesagedata: changedRoomUser: ", messageData.data);
            broadcast(wss, JSON.stringify({
                data: messageData.data,
                type: 'changedRoomUser'
            }));

            break;
        case 'reloadRoomUser':
            broadcast(wss, JSON.stringify({
                data: messageData.data,
                type: 'changedRoomUser'
            }));

            break;
        case 'startGame':
            await apiController.updateRoomUserStatus({ roomId, status: RoomUserStatusEnum.InTheGame });
            broadcast(wss, JSON.stringify({
                data: messageData.data,
                type: 'startGame'
            }));
            new StartGameContext(wss, roomId);

            break;
        case 'drawPicture':
            broadcast(wss, JSON.stringify({
                data: messageData.data,
                type: 'drawPicture'
            }));

            break;
        case 'submitAnswer':
            new CheckAnswerContext(wss, messageData.data);

            break;
        case 'deleteRoomUser':
            await apiController.deleteRoomUserByUserId({ userId: messageData.data.userId, roomId });
            broadcast(wss, JSON.stringify({
                data: messageData.data,
                type: 'deleteRoomUser'
            }))

            break;
        default:
            console.warn('websocket not send message type');
    }
}