const { sqlQuery } = require('../db/db');
const moment = require('moment');

module.exports = {
    async addRoomUser({ userId, roomId }) {
        let sql = 'SELECT * FROM draw_RoomUser WHERE userId = ? AND roomId = ?';
        let values = [userId, roomId];
        let data = await sqlQuery(sql, values);
        if (data.length > 0) return;

        let inTime = moment().format('YYYY-MM-DD HH:mm:ss');
        values.push(inTime);
        sql = 'INSERT INTO draw_RoomUser(id, userId, roomId, inTime) VALUES (0, ?, ?, ?)';

        return await sqlQuery(sql, values);
    },
    getAllRoomUserList() {
        let sql = `SELECT id,userId, roomId, lastActiveTime, isActive FROM draw_roomuser`;

        return sqlQuery(sql);
    },
    setRoomUserAtive({ isActive, id }) {
        let sql = `UPDATE draw_userinfo SET isActive = ? WHERE id = ?`;
        let values = [isActive, id];

        return sqlQuery(sql, values);
    },
    async getRandomTopic() {
        let sql = `SELECT count(*) count FROM draw_topic`;
        let topicCount = await sqlQuery(sql);
        let RandomCount = parseInt(Math.random() * topicCount[0].count + 1);

        sql = `SELECT * FROM draw_topic WHERE Id = ?`;
        let values = [isNaN(RandomCount) ? 0 : RandomCount];

        return sqlQuery(sql, values);
    },
    updateRoomStatusbyRoomId({ roomId, status }) {
        let sql = `UPDATE draw_room SET status = ? WHERE id = ?`;
        let values = [status, roomId];

        return sqlQuery(sql, values);
    }
}