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
                ru.userId, ui.name userName
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
        let sql = `DELETE FROM draw_roomuser WHERE userId = ?`;
        let values = [userId];
        let deleteData = await sqlQuery(sql, values);

        sql = 'SELECT * FROM draw_roomuser where roomId = ?';
        values = [roomId];
        let roomUserList = await sqlQuery(sql, values);
        if (!roomUserList.length) {
            sql = 'DELETE FROM draw_room WHERE roomId = ?';
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
    }
}