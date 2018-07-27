
let broadcast = (wss, data, excludeWs) => {
    wss.clients.forEach((client) => {
        if (client !== excludeWs) {
            client.send(data);
        }
    });
}

module.exports = {
    broadcast
}