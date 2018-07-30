const roomUserCache = require('../caches/roomUserCache');
const { broadcast } = require('../common/websocketUtil');
const apiController = require('../controllers/api');
const userCache = require('../caches/userCache');


class CheckAnswerContext {
    constructor(wss, { roomId, drawAnswer, userId, userName }) {
        this.wss = wss;
        this.roomId = roomId;
        this.drawAnswer = drawAnswer;
        this.userId = userId;
        this.userName = userName;
        this.roomUserCache = {};

        this.checkAnswer();
    }

    async checkAnswer() {
        this.roomUserCache = roomUserCache.get(this.roomId);
        let chatMessage = '';
        if (this.roomUserCache.topicName === this.drawAnswer) {
            // TODO 记录答对的人和第几次答对
            await this.recordCorrectAnswerInfo();

            // TODO 重新获取一下用户数据, 为了拿最新的分数 
            let roomUserScoreList = await apiController.getRoomUserListByRoomId({ roomId: this.roomId });
            broadcast(this.wss, JSON.stringify({
                data: { roomId: this.roomId, roomUserScoreList },
                type: 'showRoomUserScore'
            }));

            chatMessage = `${this.userName}: 答对了!`;
        } else {
            chatMessage = `${this.userName}: ${this.drawAnswer}`;
        }

        broadcast(this.wss, JSON.stringify({
            data: { roomId: this.roomId, chatMessage, showChatMessage: true },
            type: 'showChatMessage'
        }));
    }

    async recordCorrectAnswerInfo() {
        let userInfo = userCache.get(this.userId);
        // 已经答对过了
        if (userInfo.isBingo) {
            return;
        }
        userCache.set(this.userId, Object.assign({}, userInfo, { isBingo: true }));

        // 答对题的人数
        console.log("this.roomUserCache: ", this.roomUserCache);
        let answerNumber = this.roomUserCache.answerNumber || 0;
        answerNumber = ++answerNumber;
        let score = 0;
        if (answerNumber === 1) {
            score = 3;
        } else if (answerNumber === 2) {
            score = 2;
        } else {
            score = 1;
        }

        await apiController.updateRoomUserScoreByUserId({ score, roomId: this.roomId, userId: this.userId });
        roomUserCache.set(this.roomId, Object.assign({}, this.roomUserCache, { answerNumber }));
    }
}


module.exports = {
    CheckAnswerContext
}