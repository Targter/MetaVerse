import express from "express";
import cookieParser from "cookie-parser";
import { router } from "./routes/v1";
import cors from "cors"
const app = express();
app.use(express.json())
app.use(
    cors({
        origin: "http://localhost:5173", // Allow frontend origin
        credentials: true, // Allow cookies/auth headers
        methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
        allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
    })
  );
app.use(cookieParser());
app.use("/api/v1", router)

app.listen(process.env.PORT || 3001)
