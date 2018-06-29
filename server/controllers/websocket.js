const { sqlQuery } = require('../db/db');


module.exports = {
    createRoom(query) {
        let sql = 'INSERT INTO draw_Room(id, name, createTime, status) VALUES (0, ?, ?, ?)';
        let values = [query.name, query.createTime, query.status];

        return sqlQuery(sql, values);
    },
    async addRoomUser(query) {
        let sql = 'SELECT * FROM draw_RoomUser WHERE userId = ? AND roomId = ?';
        let values = [query.userId, query.roomId];
        let data = await sqlQuery(sql, values);
        if (data.length > 0) return;

        sql = 'INSERT INTO draw_RoomUser(id, userId, roomId) VALUES (0, ?, ?)';

        return await sqlQuery(sql, values);
    },
    getAllRoomUserList() {
        let sql = `SELECT id,userId, roomId, lastActiveTime, isActive FROM draw_roomuser`;

        return sqlQuery(sql);
    },
    updateRoomUserActive(query) {
        let sql = `UPDATE draw_roomuser SET isActive = ? WHERE id = ?`;
        let values = [query.isActive, query.id];

        return sqlQuery(sql, values);
    },
    setRoomUserAtive(query) {
        let sql = `UPDATE draw_userinfo SET isActive = ? WHERE id = ?`;
        let values = [query.isActive, query.id];

        return sqlQuery(sql, values);
    },
    async getRandomTopic() {
        let sql = `SELECT count(*) count FROM draw_topic`;
        let topicCount = await sqlQuery(sql);
        let RandomCount = parseInt(Math.random() * topicCount[0].count + 1);

        sql = `SELECT * FROM draw_topic WHERE Id = ?`;
        let values = [isNaN(RandomCount) ? 0 : RandomCount];

        return sqlQuery(sql, values);
    }
}