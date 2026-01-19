
export type Room = {
    id:        number,
    maxPlayer: number,
    nowPlayer: number,
    name:      string,
    owner:     string
}

export type InputRoomFrom = {
    name:      string,
    owner:     string,
    maxPlayer: number
}