const roomUserCache = require('../caches/roomUserCache');
const { broadcast } = require('../common/websocketUtil');
const apiController = require('../controllers/api');


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
        console.log("roomUserCache: ", this.roomUserCache);
        if (this.roomUserCache.topicName === this.drawAnswer) {
            // TODO 记录答对的人和第几次答对
            await this.recordCorrectAnswerInfo();

            // TODO 重新获取一下用户数据, 为了拿最新的分数 
            let roomUserList = await apiController.getRoomUserListByRoomId({ roomId: this.roomId });

            chatMessage = `${this.userName}: 答对了!`;
            this.roomUserCache = Object.assign({}, this.roomUserCache, { roomUserList });

            roomUserCache.set(this.roomId, this.roomUserCache);
            broadcast(this.wss, JSON.stringify({
                data: this.roomUserCache,
                type: 'changedRoomUser'
            }));
        } else {
            chatMessage = `${this.userName}: ${this.drawAnswer}`;
        }

        broadcast(this.wss, JSON.stringify({
            data: { roomId: this.roomId, chatMessage, showChatMessage: true },
            type: 'showChatMessage'
        }));
    }

    async recordCorrectAnswerInfo() {
        // 答对题的人数
        let answerNumber = this.roomUserCache.answerNumber || 0;
        answerNumber = answerNumber++;
        let score = 0;
        if (answerNumber === 1) {
            score = 3;
        } else if (answerNumber === 2) {
            score = 2;
        } else {
            score = 1;
        }

        await apiController.updateRoomUserScoreByUserId({ score, roomId: this.roomId, userId: this.userId });
        roomUserCache.set(this.roomId,
            Object.assign(
                {},
                this.roomUserCache,
                { answerNumber }
            ));
    }
}


module.exports = {
    CheckAnswerContext
}