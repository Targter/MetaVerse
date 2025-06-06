// this room manager is responsible for managing the rooms and the users in the rooms.
// it has a map of rooms and users in the rooms.
// it has a method to remove a user from a room.
// it has a method to add a user to a room.
// it has a method to broadcast a message to all users in a room except the user who sent the message.


import type { User } from "./User";
import { OutgoingMessage } from "./types";

export class RoomManager {
    // this is how we create a map in javascript    : 
    rooms: Map<string, User[]> = new Map();
    static instance: RoomManager;

    private constructor() {
        this.rooms = new Map();
    }

    static getInstance() {
         
        if (!this.instance) {
            this.instance = new RoomManager();
        }
        return this.instance;
    }
// this removeUser
    // remove user from the room 
    public removeUser(user: User, spaceId: string) {
        if (!this.rooms.has(spaceId)) {
            return;
        }
        this.rooms.set(spaceId, (this.rooms.get(spaceId)?.filter((u) => u.id !== user.id) ?? []));
    }

    public addUser(spaceId: string, user: User) {
        // console.log("addUser: ", user)
        //if the spaceId is not in the rooms map then add the user to the room
        if (!this.rooms.has(spaceId)) {
            this.rooms.set(spaceId, [user]);
            return;
        }
        //if the spaceId is in the rooms map then add the user to the room
        // this.rooms.get(spaceId) will return the users in the room
        // this.rooms.get(spaceId) ?? [] will return an empty array if there are no users in the room
        this.rooms.set(spaceId, [...(this.rooms.get(spaceId) ?? []), user]);
    }

    // broadcast a message to all users in the room except the user who sent the message
    public broadcast(message: OutgoingMessage, user: User, roomId: string) {
        if (!this.rooms.has(roomId)) {
            return;
        }
        this.rooms.get(roomId)?.forEach((u) => {
            console.log("calledRommanager: ", u.id, user.id)
            if (u.id !== user.id) {
                u.send(message);
            }
        });
    }
} 