const { sqlQuery } = require('../db/db');


module.exports = {
    getUserInfo() {
        let sql = 'SELECT * FROM draw_UserInfo';

        return sqlQuery(sql);
    },
    login({ userName, passWord }) {
        let sql = `SELECT * FROM draw_UserInfo WHERE userName = ? AND passWord = ?`;
        let values = [userName, passWord];

        return sqlQuery(sql, values);
    },
    async register({ userName, passWord }) {
        let sql = `SELECT * FROM draw_UserInfo WHERE userName = ?`;
        let values = [userName];
        let result = await sqlQuery(sql, values);
        if (result.length) {
            return '';
        }

        sql = `INSERT INTO draw_userinfo(id, name, userName, passWord)  VALUES (0, ?, ?, ?)`;
        values = [userName, userName, passWord];
        result = await sqlQuery(sql, values);

        return result.insertId;
    },
    getRoomList() {
        let sql = 'SELECT * FROM draw_Room WHERE status = 1';

        return sqlQuery(sql);
    },
    getRoomUserListByRoomId({ roomId }) {
        let sql = `
            SELECT 
                ru.userId, ui.name userName, ru.status, ru.score
            FROM 
                draw_RoomUser ru
            LEFT JOIN 
                draw_userinfo ui ON ui.id = ru.userId
            WHERE 
                roomId = ?
            ORDER BY inTime`;
        let values = [roomId];

        return sqlQuery(sql, values);
    },
    async getRoomIdByUserId({ userId }) {
        let sql = `SELECT roomId from draw_roomuser WHERE userId = ?`;
        let values = [userId];
        let data = await sqlQuery(sql, values);

        return data ? (data[0] ? data[0].roomId : null) : null;
    },
    async deleteRoomUserByUserId({ userId, roomId }) {
        let sql;
        let values;
        let deleteData;

        if (userId instanceof Array) {
            sql = `DELETE FROM draw_roomuser WHERE userId in (?)`;
            values = [userId];
            deleteData = await sqlQuery(sql, values);
        } else {
            sql = `DELETE FROM draw_roomuser WHERE userId = ?`;
            values = [userId];
            deleteData = await sqlQuery(sql, values);
        }

        sql = 'SELECT * FROM draw_roomuser WHERE roomId = ?';
        values = [roomId];
        let roomUserList = await sqlQuery(sql, values);
        if (!roomUserList.length) {
            sql = 'DELETE FROM draw_room WHERE Id = ?';
            values = [roomId];
            await sqlQuery(sql, values);
        }
        return deleteData;
    },
    async createRoom({ roomName, createTime, status, type }) {
        let sql = `SELECT * FROM draw_Room WHERE name = ?`;
        let values = [roomName];
        let result = await sqlQuery(sql, values);
        if (result.length) {
            return '';
        }

        sql = 'INSERT INTO draw_Room(id, name, createTime, status, type) VALUES (0, ?, ?, ?, ?)';
        values = [roomName, createTime, status, type];

        result = await sqlQuery(sql, values);
        return result.insertId;
    },
    findRoom({ roomName }) {
        let sql = `SELECT * FROM draw_Room WHERE name = ?`;
        let values = [roomName];
        return sqlQuery(sql, values);
    },
    getAllRoomIdList() {
        let sql = 'SELECT Id FROM draw_Room';

        return sqlQuery(sql);
    },
    getUserIdListByroomId({ roomId }) {
        let sql = 'SELECT userId FROM draw_RoomUser Where roomId = ?';
        let values = [roomId];

        return sqlQuery(sql, values);
    },
    updateRoomUserStatus({ roomId, status }) {
        let sql = `UPDATE draw_roomuser SET status = ? WHERE roomId = ?`;
        let values = [status, roomId];

        return sqlQuery(sql, values);
    },
    updateRoomUserStatusByUserId({ roomId, userId, status }) {
        let sql = `UPDATE draw_roomuser SET status = ? WHERE roomId = ? AND userId = ?`;
        let values = [status, roomId, userId];

        return sqlQuery(sql, values);
    },
    async updateRoomUserScoreByUserId({ score, roomId, userId }) {
        let sql = `SELECT score FROM draw_roomuser Where roomId = ? AND userId = ?`;
        let values = [roomId, userId];

        let scoreList = await sqlQuery(sql, values);
        let oldScore = scoreList.length ? scoreList[0].score : 0;
        score += oldScore;
        sql = `UPDATE draw_roomuser SET score = ? WHERE roomId = ? AND userId = ?`;
        values = [score, roomId, userId];

        return sqlQuery(sql, values);
    }
}