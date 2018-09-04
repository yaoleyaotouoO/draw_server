const apiController = require('../controllers/api');
const userCache = require('../caches/userCache');

let serviceStartDeleteExpiredRoomUser = async () => {
    let roomIdList = await apiController.getAllRoomIdList();
    for (let i = 0; i < roomIdList.length; i++) {
        let roomId = roomIdList[i].Id;
        let userIds = await apiController.getUserIdListByroomId({ roomId });
        let needDelUserIds = [];

        userIds.map(x => {
            if (!userCache.get(x.userId)) {
                needDelUserIds.push(x.userId);
            }
        });

        let delData = await apiController.deleteRoomUserByUserId({ userId: needDelUserIds, roomId });
    }
}


module.exports = () => {
 //   serviceStartDeleteExpiredRoomUser()
}
