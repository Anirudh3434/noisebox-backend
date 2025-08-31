import "dotenv/config" 
import express from "express";
import connectDB from "./db/index.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoute from "./routes/user.route.js";
import bodyParser from "body-parser";
import musicRoute from "./routes/music.route.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:8080",
  }),
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

connectDB()
  .then(() => console.log("MongoDB connected OUTER"))
  .catch((error) => console.error(error));

app.use("/api/v1/users", userRoute);
app.use("/api/v1/music", musicRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
