const roomUserCache = require('../caches/roomUserCache');
const userCache = require('../caches/userCache');
const webSocketController = require('../controllers/websocket');
const apiController = require('../controllers/api');
const { RoomStatusEnum } = require('../common/enums');
const { broadcast } = require('../common/websocketUtil');


const oneRoundTime = 100;

class StartGameContext {
    constructor(wss, roomId) {
        this.wss = wss;
        this.roomId = roomId;
        this.topicName = '';
        this.topicPrompt = '';
        this.gameTime = 0;
        this.roomUserList = [];
        this.drawUserId = '';
        this.gameRound = 0;
        this.gameTotalRound = 4; // 默认一共4轮，根据人数改变
        this.gamePollTag = null;
        this.roomUserCache = {};

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
        this.roomUserCache = Object.assign({}, this.roomUserCache, { topicName: '', topicPrompt: '' })
        if (drawUserIdByCache) {
            drawUserIdByCache.ws.send(JSON.stringify({
                data: Object.assign({}, this.roomUserCache, { topicName: this.topicName }),
                type: 'gameInfo'
            }));
        }

        broadcast(this.wss, JSON.stringify({
            data: Object.assign({}, this.roomUserCache, { topicPrompt: this.topicPrompt }),
            type: 'gameInfo'
        }), drawUserIdByCache.ws);
    }

    setRoomUserCache() {
        let gameInfo = {
            roomUserList: this.roomUserList,
            gameTime: this.gameTime,
            drawUserId: this.drawUserId,
            roomId: this.roomId,
            topicName: this.topicName,
            topicPrompt: this.topicPrompt
        }

        this.roomUserCache = roomUserCache.get(this.roomId);
        this.roomUserCache = Object.assign({}, this.roomUserCacche, gameInfo);
        roomUserCache.set(this.roomId, this.roomUserCache);
    }

    async gameOverDisplayScore() {
        if (!this.gameTime && ((this.gameRound + 1) === this.gameTotalRound)) {
            await webSocketController.updateRoomStatusbyRoomId({ roomId: this.roomId, status: RoomStatusEnum.Ready });

            let gameOverScoreList = await apiController.getRoomUserListByRoomId({ roomId: this.roomId });
            gameOverScoreList = gameOverScoreList.sort((a, b) => a.score < b.score);
            // TODO 游戏结束统计分数
            broadcast(this.wss, JSON.stringify({
                data: { roomId: this.roomId, gameOverScoreList },
                type: 'gameOver'
            }));

            // 清空分数
            await apiController.clearScoreOnUserList({ roomId: this.roomId });

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

        roomUserCache.set(this.roomId, Object.assign({}, this.roomUserCache, { answerNumber: 0 }));

        // 每轮开始的时候，都重置答对的Flag
        for (let item of this.roomUserCache.roomUserList) {
            let userInfo = userCache.get(Number(item.userId));
            userCache.set(item.userId, Object.assign({}, userInfo, { isBingo: false }));
        }
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