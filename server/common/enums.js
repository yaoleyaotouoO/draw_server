let RoomStatusEnum = {
    Ready: 1,
    Running: 2
}

let RoomTypeEnum = {
    PublicRoom: 1,
    PrivateRoom: 2,
}

let RoomUserStatusEnum = {
    NotReady: 0,
    Ready: 1,
    InTheGame: 2
}

module.exports = {
    RoomStatusEnum,
    RoomTypeEnum,
    RoomUserStatusEnum
}