const { sqlQuery } = require('../db/db');


module.exports = {
    getUserInfo() {
        let sql = 'SELECT * FROM draw_UserInfo';

        return sqlQuery(sql);
    },
    login(query) {
        let sql = `SELECT * FROM draw_UserInfo WHERE userName = ? AND passWord = ?`
        let values = [query.userName, query.passWord];

        return sqlQuery(sql, values);
    },
    getRoomList() {
        let sql = 'SELECT * FROM draw_Room WHERE status = 1';

        return sqlQuery(sql);
    },
    getRoomUserListByRoomId({roomId}) {
        let sql = `
            SELECT 
                ru.userId, ui.name userName
            FROM 
                draw_RoomUser ru
            LEFT JOIN 
                draw_userinfo ui ON ui.id = ru.userId
            WHERE 
                roomId = ?`;
        let values = [roomId];

        return sqlQuery(sql, values);
    },
    async getRoomIdByUserId(query) {
        let sql = `SELECT roomId from draw_roomuser WHERE userId = ?`;
        let values = [query.userId];
        let data = await sqlQuery(sql, values);

        return data ? (data[0] ? data[0].roomId : null) : null;
    },
    deleteRoomUserByUserId(query) {
        let sql = `DELETE FROM draw_roomuser WHERE userId = ?`;
        let values = [query.userId];

        return sqlQuery(sql, values);
    }
}