const roomUserCache = require('./roomUserCache');
const userCache = require('./userCache');
const webSocketController = require('../controllers/websocket');
const apiController = require('../controllers/api');
const send = require('./send');

broadcast = (wss, data, excludeWs) => {
    wss.clients.forEach((client) => {
        (client !== excludeWs) && client.send(data);
    });
}

gameCountDown = (wss, topicData, roomId) => {
    const oneRoundTime = 10;
    let gameTime = oneRoundTime;
    let topicName = topicData.name;
    let topicPrompt = topicData.prompt;
    let roomUserList;
    let drawUserId;
    let gameInfo;
    let gameRound = 0;
    let gameTotalRound = 4; // 默认一共4轮，根据人数改变

    let time = setInterval(async () => {
        if (!gameTime && ((gameRound + 1) === gameTotalRound)) {
            // 游戏结束统计分数
            let userScoreList = {

            }
            broadcast(wss, JSON.stringify({
                data: { roomId, userScoreList },
                type: 'gameOver'
            }))
            clearInterval(time);

            return;
        }

        if (!gameTime) {
            gameRound++;
            console.log(`第 ${gameRound + 1} 轮游戏`);
            // 通知前端弹窗显示答案
            broadcast(wss, JSON.stringify({
                data: { roomId, topicName, showAnswer: true },
                type: 'showAnswer'
            }), userCache.get(drawUserId).ws);

            // 下一个人画, 重新计时重新出题
            topicData = await webSocketController.getRandomTopic();
            topicData = topicData[0];
            topicName = topicData.name;
            topicPrompt = topicData.prompt;
            gameTime = oneRoundTime;

            if (gameRound >= gameTotalRound / 2) {
                drawUserId = roomUserList[gameRound - gameTotalRound / 2].userId;
            } else {
                drawUserId = roomUserList[gameRound].userId;
            }
        }

        // 定时查一下数据库，看是否有用户离线了
        if (!(gameTime % oneRoundTime)) {
            roomUserList = await apiController.getRoomUserListByRoomId({ roomId })
            gameTotalRound = roomUserList.length * 2;
            if (gameRound === 0) {
                drawUserId = roomUserList[0].userId;
            }
        }

        gameInfo = { roomUserList, gameTime, drawUserId, roomId }
        roomUserCache.set(roomId, Object.assign({}, gameInfo, { topicName, topicPrompt }));
        gameTime--;

        // 发送给画的人
        userCache.get(drawUserId).ws.send(JSON.stringify({
            data: Object.assign({}, gameInfo, { topicName }),
            type: 'gameInfo'
        }));

        broadcast(wss, JSON.stringify({
            data: Object.assign({}, gameInfo, { topicPrompt }),
            type: 'gameInfo'
        }), userCache.get(drawUserId).ws);
    }, 1000);
}

startGame = async (wss, roomId) => {
    let topicData = await webSocketController.getRandomTopic();
    topicData = topicData[0];

    gameCountDown(wss, topicData, roomId);
}

module.exports = {
    startGame
}