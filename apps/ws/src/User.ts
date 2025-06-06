// this is the user class which is responsible for handling the user connection and messages
// it has a method to send a message to the user.
// it has a method to destroy the user.


import { WebSocket } from "ws";
import { RoomManager } from "./RoomManager";
import { OutgoingMessage } from "./types";
import client from "@repo/db/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_PASSWORD } from "./config";

function getRandomString(length: number) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export class User {
    public id: string;
    public userId?: string;
    private spaceId?: string;
    private x: number;
    private y: number;
    private ws: WebSocket;

    constructor(ws: WebSocket) {
        this.id = getRandomString(10);
        this.x = 0;
        this.y = 0;
        this.ws = ws;
        this.initHandlers()
    }

    initHandlers() {
        this.ws.on("message", async (data) => {
            const parsedData = JSON.parse(data.toString());
            console.log("UserparsedData",parsedData)
            // if(parsedData.type == 'move'){
            //     console.log("parsedMovement:",parsedData.payload)
            // }
            switch (parsedData.type) {
                case "join":
                    console.log("join received 1")
                    const spaceId = parsedData.payload.spaceId;
                    const token = parsedData.payload.tokenId;
                    // console.log("token:",token)
                    const userId = (jwt.verify(token, JWT_PASSWORD) as JwtPayload).userId
                    console.log('userVerifiedId:',userId)
                    if (!userId) {
                        this.ws.close()
                        return
                    }
                    console.log("join received 2")
                    this.userId = userId
                    const space = await client.space.findFirst({
                        where: {
                            id: spaceId
                        }
                    })
                    console.log("join received 3",space)
                    if (!space) {
                        this.ws.close()
                        return;
                    }
                    // this is for user who is joined also send the room id which add the user to the room 
                    console.log("join received 4")
                    this.spaceId = spaceId
                    // ADD USER TO THE SPACE 
                    // console.log("Adding user to room:", this);
                    RoomManager.getInstance().addUser(spaceId, this);
                    this.x = Math.floor(Math.random() * space?.width);
                    this.y = Math.floor(Math.random() * space?.height);
                    // this.send is used to send the message to the user
                    // this is used to send the message to the user who is joined the room
                    // that the user is joined the room and the spawn position of the user
                    // and the users in the room
                    console.log("spaceId:",spaceId)
                    console.log("this.x:",this.x)
                    console.log("this.y:",this.y)
                    console.log("Sending space-joined:", {
                        spawn: { x: this.x, y: this.y },
                        userId: this.id
                      });

                      console.log("RoomManagere:",RoomManager.getInstance().rooms.get(spaceId))
                    this.send({
                        type: "space-joined",
                        payload: {
                            spawn: {
                                x: this.x,
                                y: this.y
                            },
                            userId:this.id,
                            //this is the sendign the other users Id to himself
                            
                            users: RoomManager.getInstance().rooms.get(spaceId)?.filter(x => x.id !== this.id)?.map((u) => ({id: u.id ,x: u.x, y: u.y })) ?? []
                        }
                    });
                    console.log("join received 5")
                    // this is used to broadcast the message to all the users in the room except the user who is joined the room
                    RoomManager.getInstance().broadcast({
                        type: "user-joined",
                        payload: {
                            userId: this.id,
                            x: this.x,
                            y: this.y
                        }
                    }, this, this.spaceId!);
                    break;
                case "move":
                    // when user try to move the user it send the payload with x and y and if the displacement is 1 then move the user to the new position
                    console.log("XDisplacement:",this.x, this.y)
                    const moveX = parsedData.payload.x;
                    const moveY = parsedData.payload.y;
                    console.log("*************************************************")
                    // // console.log("movePayload:",parsedData.payload)
                    // console.log("moveX and MoveY", moveX,moveY)
                    // console.log("XDisplacement:",this.x, this.y)
                   
                    const xDisplacement = Math.abs(this.x - moveX);
                    const yDisplacement = Math.abs(this.y - moveY);
                    console.log("userMove:",xDisplacement,yDisplacement)
                    if ((xDisplacement <= 10 && yDisplacement== 0) || (xDisplacement == 0 && yDisplacement <= 10)) {
                        this.x = moveX;
                        this.y = moveY;
                        console.log("movemenet Called to frontend")
                        RoomManager.getInstance().broadcast({
                            type: "movement",
                            payload: {
                                x: this.x,
                                y: this.y,
                                userId:this.id
                            }
                        }, this, this.spaceId!);
                        console.log("MovementSuccessfull")
                        //  The parameters this and this.spaceId! are passed to control who receives the message and who doesn't.
                        return;
                    }
                    
                    this.send({
                        type: "movement-rejected",
                        payload: {
                            x: this.x,
                            y: this.y,
                            userId:parsedData.payload.userId
                        }
                    });

            }
        });
    }

    destroy() {
        RoomManager.getInstance().broadcast({
            type: "user-left",
            payload: {
                userId: this.userId
            }
        }, this, this.spaceId!);
        RoomManager.getInstance().removeUser(this, this.spaceId!);
    }

    send(payload: OutgoingMessage) {
        this.ws.send(JSON.stringify(payload));
    }
}