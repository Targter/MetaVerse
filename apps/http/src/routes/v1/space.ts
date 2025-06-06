import { Router } from "express";
import client from "@repo/db/client";
import { userMiddleware } from "../../middleware/user";
import { AddElementSchema, CreateElementSchema, CreateSpaceSchema, DeleteElementSchema } from "../../types";
import { JWT_PASSWORD } from "../../config";
import jwt from "jsonwebtoken";
export const spaceRouter = Router();


// creating a space 
spaceRouter.post("/",userMiddleware,async (req, res) => {
    console.log("hit space Created Route")
    const parsedData = CreateSpaceSchema.safeParse(req.body)
    if (!parsedData.success) {
        console.log(JSON.stringify(parsedData))
        res.status(400).json({message: "Validation failed"})
        return
    }
    console.log("userId",req.userId)
    // if there is not map Id then create a new space
    if (!parsedData.data.mapId) {
        const space = await client.space.create({
            data: {
                name: parsedData.data.name,
                width: parseInt(parsedData.data.dimensions.split("x")[0]),
                height: parseInt(parsedData.data.dimensions.split("x")[1]),
                creatorId: req.userId!
            }
        });
        res.json({spaceId: space.id})
        return;
    }
    // creating a space with mapId
    const map = await client.map.findFirst({
        where: {
            id: parsedData.data.mapId
        }, select: {
            mapElements: true,
            width: true,
            height: true,
            name : true,
            thumbnail: true

        }
    })

    console.log("after")
    console.log(map)
    if (!map) {
        res.status(400).json({message: "Map not found"})
        return
    }

    console.log("map.mapElements.length")
    console.log(map.mapElements.length)
    let space = await client.$transaction(async () => {
        const space = await client.space.create({
            data: {
                name: parsedData.data.name,
                width: map.width,
                thumbnail:map.thumbnail,
                height: map.height,
                creatorId: req.userId!,
            }
        });

        // if map exists then map also have an map element x and y coordinates which i am linking to the space element
        // so that i can get the x and y coordinates of the map element in the space element
        await client.spaceElements.createMany({
            data: map.mapElements.map(e => ({
                spaceId: space.id,
                elementId: e.elementId,
                x: e.x!,
                y: e.y!
            }))
        })

        return space;

    })
    console.log("space crated")
    res.json({spaceId: space.id})
})
// to fetch all the maps 
spaceRouter.get("/map",userMiddleware,  async (req , res) => {
    console.log("mapsData:")
    try {
        const userId = req.userId!;
        const maps = await client.map.findMany({
            select: {
                id: true,
                name: true,
                width: true,
                height: true,
                thumbnail: true,
            }
        });
        const user = await client.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }   

        if (!maps.length) {
            res.status(404).json({ message: "No maps found" });
            return;
        }
        const token = jwt.sign({
                    userId: userId,
                    role: user.role
                }, JWT_PASSWORD);
            console.log("token",token)
        res.cookie("token",token,{httpOnly:true}).json({
            maps: maps.map(map => ({
                id: map.id,
                name: map.name,
                thumbnail: map.thumbnail,
                dimensions: `${map.width}x${map.height}`
            })),"token":token
        });
    } catch (error) {
        console.error("Error fetching maps:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
// delete an element from a space
spaceRouter.delete("/element",userMiddleware, async (req, res) => {
    console.log("spaceElement?.space1 ")
    const parsedData = DeleteElementSchema.safeParse(req.body)
    if (!parsedData.success) {
        res.status(400).json({message: "Validation failed"})
        return
    }
    const spaceElement = await client.spaceElements.findFirst({
        where: {
            id: parsedData.data.id
        }, 
        include: {
            space: true
        }
    })
    console.log(spaceElement?.space)
    console.log("spaceElement?.space")
    if (!spaceElement?.space.creatorId || spaceElement.space.creatorId !== req.userId) {
        res.status(403).json({message: "Unauthorized"})
        return
    }
    await client.spaceElements.delete({
        where: {
            id: parsedData.data.id
        }
    })
    res.json({message: "Element deleted"})
})

// delete a space
spaceRouter.delete("/s/:spaceId",userMiddleware, async(req, res) => {
    console.log("req.params.spaceId", req.params.spaceId)
    const space = await client.space.findUnique({
        where: {
            id: req.params.spaceId
        }, select: {
            creatorId: true
        }
    })
    if (!space) {
        res.status(400).json({message: "Space not found"})
        return
    }

    if (space.creatorId !== req.userId) {
        console.log("creator Id not found")
        res.status(403).json({message: "Unauthorized"})
        return
    }

    await client.space.delete({
        where: {
            id: req.params.spaceId
        }
    })
    res.json({message: "Space deleted"})
})


// get all spaces 
spaceRouter.get("/all",userMiddleware, async (req, res) => {
    const spaces = await client.space.findMany({
        where: {
            creatorId: req.userId!
        }
    });

    res.json({
        spaces: spaces.map(s => ({
            id: s.id,
            name: s.name,
            thumbnail: s.thumbnail,
            dimensions: `${s.width}x${s.height}`,
        }))
    })

    
})

// add an element to a space
spaceRouter.post("/element",userMiddleware, async (req, res) => {
    const parsedData = AddElementSchema.safeParse(req.body)
    if (!parsedData.success) {
        res.status(400).json({message: "Validation failed"})
        return
    }
    const space = await client.space.findUnique({
        where: {
            id: req.body.spaceId,
            creatorId: req.userId!
        }, select: {
            width: true,
            height: true
        }
    })

    if(req.body.x < 0 || req.body.y < 0 || req.body.x > space?.width! || req.body.y > space?.height!) {
        res.status(400).json({message: "Point is outside of the boundary"})
        return
    }

    if (!space) {
        res.status(400).json({message: "Space not found"})
        return
    }
    await client.spaceElements.create({
        data: {
            spaceId: req.body.spaceId,
            elementId: req.body.elementId,
            x: req.body.x,
            y: req.body.y
        }
    })

    res.json({message: "Element added"})
})


// get a space  
// more focus on /:spaceId route catch the spaceId from the url and get the space with that id and also get the elements of that space
spaceRouter.get("/s/:spaceId",userMiddleware,async (req, res) => {
    const space = await client.space.findUnique({
        where: {
            id: req.params.spaceId
        },
        include: {
            elements: {
                include: {
                    element: true,
                }
            },
        }
    })

    if (!space) {
        res.status(400).json({message: "Space not found"})
        return
    }

    res.json({
        "dimensions": `${space.width}x${space.height}`,
        "name": space.name,
        "thumbnail": space.thumbnail,
        elements: space.elements.map(e => ({
            id: e.id,
            element: {
                id: e.element.id,
                imageUrl: e.element.imageUrl,
                width: e.element.width,
                height: e.element.height,
                static: e.element.static
            },
            x: e.x,
            y: e.y
        })),
    })
})


