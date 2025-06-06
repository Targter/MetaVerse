
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "../config";
import { NextFunction, Request, Response } from "express";

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    console.log("called Admin Middleware")
    const header = req.headers["authorization"];
    // const token = header?.split(" ")[1];
    const token = req.cookies.token;
    console.log("req.cookies:",req.cookies.token)
    console.log("AdminToken:",token)
    if (!token) {
        res.status(403).json({message: "Unauthorized"})
        return
    }

    try {
        const decoded = jwt.verify(token, JWT_PASSWORD) as { role: string, userId: string }
        if (decoded.role !== "Admin") {
            res.status(403).json({message: "Unauthorized"})
            return
        }
        req.userId = decoded.userId
        console.log("curserId:",decoded.userId)
        next()
    } catch(e) {
        res.status(401).json({message: "Unauthorized"})
        return
    }
}