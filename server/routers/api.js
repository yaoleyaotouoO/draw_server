const Router = require('koa-router');
const apiController = require('../controllers/api');

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

module.exports = apiRouter;