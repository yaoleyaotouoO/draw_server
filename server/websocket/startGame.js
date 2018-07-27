const roomUserCache = require('../caches/roomUserCache');
const userCache = require('../caches/userCache');
const webSocketController = require('../controllers/websocket');
const apiController = require('../controllers/api');
const { RoomStatusEnum } = require('../common/enums');
const { broadcast } = require('../common/websocketUtil');


// let gameCountDown = (wss, topicData, roomId) => {
//     const oneRoundTime = 10;
//     let gameTime = oneRoundTime;
//     let topicName = topicData.name;
//     let topicPrompt = topicData.prompt;
//     let roomUserList;
//     let drawUserId;
//     let gameInfo;
//     let gameRound = 0;
//     let gameTotalRound = 4; // 默认一共4轮，根据人数改变

//     let time = setInterval(async () => {
//         if (!gameTime && ((gameRound + 1) === gameTotalRound)) {
//             await webSocketController.updateRoomStatusbyRoomId({ roomId, status: RoomStatusEnum.Ready });

//             // 游戏结束统计分数
//             broadcast(wss, JSON.stringify({
//                 data: { roomId, showScore: true },
//                 type: 'gameOver'
//             }));

//             clearInterval(time);
//             return;
//         }

//         if (!gameTime) {
//             gameRound++;
//             console.log(`第 ${gameRound + 1} 轮游戏`);
//             // 通知前端弹窗显示答案
//             broadcast(wss, JSON.stringify({
//                 data: { roomId, topicName, showAnswer: true },
//                 type: 'showAnswer'
//             }), userCache.get(drawUserId).ws);

//             // 下一个人画, 重新计时重新出题
//             topicData = await webSocketController.getRandomTopic();
//             topicData = topicData[0];
//             topicName = topicData.name;
//             topicPrompt = topicData.prompt;
//             gameTime = oneRoundTime;

//             if (gameRound >= gameTotalRound / 2) {
//                 drawUserId = roomUserList[gameRound - gameTotalRound / 2].userId;
//             } else {
//                 drawUserId = roomUserList[gameRound].userId;
//             }
//         }

//         // 定时查一下数据库，看是否有用户离线了
//         if (!(gameTime % oneRoundTime)) {
//             roomUserList = await apiController.getRoomUserListByRoomId({ roomId })
//             gameTotalRound = roomUserList.length * 2;
//             if (gameRound === 0) {
//                 drawUserId = roomUserList[0].userId;
//             }
//         }

//         gameInfo = { roomUserList, gameTime, drawUserId, roomId }
//         roomUserCache.set(roomId, Object.assign({}, gameInfo, { topicName, topicPrompt }));
//         gameTime--;

//         // 发送给画的人
//         userCache.get(drawUserId) && userCache.get(drawUserId).ws.send(JSON.stringify({
//             data: Object.assign({}, gameInfo, { topicName }),
//             type: 'gameInfo'
//         }));

//         broadcast(wss, JSON.stringify({
//             data: Object.assign({}, gameInfo, { topicPrompt }),
//             type: 'gameInfo'
//         }), userCache.get(drawUserId).ws);
//     }, 1000);
// }

// let startGame = async (wss, roomId) => {
//     let topicData = await webSocketController.getRandomTopic();
//     topicData = topicData[0];

//     await webSocketController.updateRoomStatusbyRoomId({ roomId, status: RoomStatusEnum.Running });

//     gameCountDown(wss, topicData, roomId);
// }


const oneRoundTime = 10;

class StartGameContext {
    constructor(wss, roomId) {
        this.wss = wss;
        this.roomId = roomId;
        this.topicName = '';
        this.topicPrompt = '';
        this.gameTime = 0;
        this.roomUserList = [];
        this.drawUserId = '';
        this.gameInfo = {};
        this.gameRound = 0;
        this.gameTotalRound = 4; // 默认一共4轮，根据人数改变
        this.gamePollTag = null;

        this.initGame();
    }

    async initGame() {
        await webSocketController.updateRoomStatusbyRoomId({ roomId: this.roomId, status: RoomStatusEnum.Running });
        await this.getTopic();
        this.startTheGame();
    }

    async getTopic() {
        let topicDataList = await webSocketController.getRandomTopic();
        let topicData = topicDataList[0];
        this.topicName = topicData.name;
        this.topicPrompt = topicData.prompt;

        // 获取新一轮的时间
        this.gameTime = oneRoundTime;
    }

    startTheGame() {
        this.gamePollTag = setInterval(async () => {
            let isGameOver = await this.gameOverDisplayScore();
            if (isGameOver) {
                return;
            }

            if (!this.gameTime) {
                await this.ShowAnswersEveryRoundOfGame();
            }

            if (!(this.gameTime % this.oneRoundTime)) {
                await this.EveryRoundOfTheGameStartCheckingUsers();
            }

            this.setRoomUserCache();
            this.sendMessageToUser();
            this.gameTime--;
        }, 1000);
    }

    sendMessageToUser() {
        // 发送给画的人
        let drawUserIdByCache = userCache.get(this.drawUserId);
        if (drawUserIdByCache) {
            drawUserIdByCache.ws.send(JSON.stringify({
                data: Object.assign({}, this.gameInfo, { topicName: this.topicName }),
                type: 'gameInfo'
            }));
        }

        broadcast(wss, JSON.stringify({
            data: Object.assign({}, this.gameInfo, { topicPrompt: this.topicPrompt }),
            type: 'gameInfo'
        }), drawUserIdByCache.ws);
    }

    setRoomUserCache() {
        this.gameInfo = {
            roomUserList: this.roomUserList,
            gameTime: this.gameTime,
            drawUserId: this.drawUserId,
            roomId: this.roomId
        }

        roomUserCache.set(this.roomId,
            Object.assign(
                {},
                this.gameInfo,
                { topicName: this.topicName, topicPrompt: this.topicPrompt }
            ));
    }

    async gameOverDisplayScore() {
        if (!this.gameTime && ((this.gameRound + 1) === this.gameTotalRound)) {
            await webSocketController.updateRoomStatusbyRoomId({ roomId: this.roomId, status: RoomStatusEnum.Ready });

            // TODO 游戏结束统计分数
            broadcast(wss, JSON.stringify({
                data: { roomId, showScore: true },
                type: 'gameOver'
            }));

            roomUserCache.delete(this.roomId);
            clearInterval(this.gamePollTag);

            return true;
        }

        return false;
    }

    getDrawUserId() {
        // 获取第一轮画图的用户
        if (this.gameRound === 0) {
            this.drawUserId = this.roomUserList[0].userId;
            return;
        }

        if (this.gameRound >= this.gameTotalRound / 2) {
            this.drawUserId = this.roomUserList[this.gameRound - this.gameTotalRound / 2].userId;
        } else {
            this.drawUserId = this.roomUserList[this.gameRound].userId;
        }
    }

    async ShowAnswersEveryRoundOfGame() {
        this.gameRound++;
        console.log(`第 ${this.gameRound + 1} 轮游戏`);

        // 通知前端弹窗显示答案
        broadcast(this.wss, JSON.stringify({
            data: { roomId: this.roomId, topicName: this.topicName, showAnswer: true },
            type: 'showAnswer'
        }), userCache.get(this.drawUserId).ws);

        // 下一个人画, 重新计时重新出题
        await this.getTopic();
        this.getDrawUserId();
    }

    // 定时查一下数据库，看是否有用户离线了
    async EveryRoundOfTheGameStartCheckingUsers() {
        this.roomUserList = await apiController.getRoomUserListByRoomId({ roomId: this.roomId });

        // 根据用户数，确定游戏轮数
        this.gameTotalRound = this.roomUserList.length * 2;
        this.getDrawUserId();
    }
}

module.exports = {
    StartGameContext
}