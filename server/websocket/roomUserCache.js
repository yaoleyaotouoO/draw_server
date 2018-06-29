let roomUsers = [];

module.exports = {
    set(key, value) {
        roomUsers = Object.assign({}, roomUsers, { [key]: value })
    },
    get(key) {
        return roomUsers[key];
    },
    clear(key) {

    }
}