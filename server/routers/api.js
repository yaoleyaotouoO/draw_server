const Router = require('koa-router');
const apiController = require('../controllers/api');
const enums = require('../common/enums');
const moment = require('moment');

const apiRouter = new Router({ prefix: '/api' });


const successResponse = (data) => {
    return {
        success: true,
        data
    }
}

apiRouter
    .get('/getUserInfo', async (ctx) => {
        const data = await apiController.getUserInfo();
        ctx.body = successResponse(data);
    })
    .post('/login', async (ctx) => {
        const data = await apiController.login(ctx.request.body);
        ctx.body = successResponse(data);
    })
    .post('/register', async (ctx) => {
        const data = await apiController.register(ctx.request.body);
        ctx.body = successResponse(data);
    })
    .get('/getRoomList', async (ctx) => {
        const data = await apiController.getRoomList();
        ctx.body = successResponse(data);
    })
    .get('/:roomId/getRoomUserListByRoomId', async (ctx) => {
        const data = await apiController.getRoomUserListByRoomId(ctx.params);
        ctx.body = successResponse(data);
    })
    .get('/:userId/getRoomIdByUserId', async (ctx) => {
        const data = await apiController.getRoomIdByUserId(ctx.params);
        ctx.body = successResponse(data);
    })
    .delete('/:userId/deleteRoomUserByUserId', async (ctx) => {
        const data = await apiController.deleteRoomUserByUserId(ctx.params);
        ctx.body = successResponse(data);
    })
    .post('/createRoom', async (ctx) => {
        let createRoomData = {
            roomName: ctx.request.body.roomName,
            createTime: moment().format('YYYY-MM-DD HH:mm:ss'),
            status: 1,
            type: enums.RoomTypeEnum.PublicRoom
        }

        const data = await apiController.createRoom(createRoomData);
        ctx.body = successResponse(data);
    })

module.exports = apiRouter;