let users = [];

module.exports = {
    set(key, value) {
        users = Object.assign({}, users, { [key]: value });
    },
    get(key) {
        return users[key];
    },
    delete(key) {
        delete users[key];
    }
}