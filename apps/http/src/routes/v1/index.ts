import { Router } from "express";
import { userRouter } from "./user";
import { spaceRouter } from "./space";
import { adminRouter } from "./admin";
import { SigninSchema, SignupSchema } from "../../types";
import {hash, compare} from "../../scrypt";
import client from "@repo/db/client";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../../config";

export const router = Router();

router.post("/signup", async (req, res) => {
    const parsedData = SignupSchema.safeParse(req.body)
    if (!parsedData.success) {
        console.log("parsed data incorrect")
        res.status(400).json({message: "Validation failed"})
        return
    }
    
    console.log("inside signup")
    const hashedPassword = await hash(parsedData.data.password)
    
    try {
        // console.log(client)
         const user = await client.user.create({
            data: {
                username: parsedData.data.username,
                password: hashedPassword,
                role: parsedData.data.type === "admin" ? "Admin" : "User",
            }
        })
        // console.log("user created",user)
        res.json({
            userId: user.id
        })
    } catch(e) {
        res.status(400).json({message: "User already exists"})
    }
})

router.post("/signin", async (req, res) => {
    const parsedData = SigninSchema.safeParse(req.body)
    if (!parsedData.success) {
        res.status(403).json({message: "Validation failed"})
        return
    }
    console.log("inside signin")

    try {
        const user = await client.user.findUnique({
            where: {
                username: parsedData.data.username
            }
        })
        // console.log("findingUser",client.user)
        
        if (!user) {
            res.status(403).json({message: "User not found"})
            return
        }
        const isValid = await compare(parsedData.data.password, user.password)

        if (!isValid) {
            res.status(403).json({message: "Invalid password"})
            return
        }

        const token = jwt.sign({
            userId: user.id,
            role: user.role
        }, JWT_PASSWORD);

        console.log("cookie:",token)
        console.log("running")
        res.cookie("token",token, { httpOnly: true }).json({
            token,id:user.id, role: user.role
        })
    } catch(e) {
        res.status(400).json({message: "Internal server error"})
    }
})

router.get("/elements", async (req, res) => {
    const elements = await client.element.findMany()
    // get all the element which i have created and not the ones which are created by other users
    res.json({elements: elements.map(e => ({
        id: e.id,
        imageUrl: e.imageUrl,
        width: e.width,
        height: e.height,
        static: e.static
    }))})
})

router.get("/avatars", async (req, res) => {
    const avatars = await client.avatar.findMany()
    console.log("avatarId",avatars)
    res.json({avatars: avatars.map(x => ({
        id: x.id,
        imageUrl: x.imageUrl,
        name: x.name
    }))})
})

router.use("/user", userRouter)
router.use("/space", spaceRouter)
router.use("/admin", adminRouter)
