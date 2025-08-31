import { Router } from "express";
import { loginUser, registerUser , refreshAccessToken , resetPassword , subscribe , GetUser , logout  } from "../controller/user.controller.js";
import upload from "../middleware/multer.middleware.js";
import jwtVerify from "../middleware/auth.middleware.js";
import { parseStream } from 'music-metadata';

const route = Router();
route.route("/register").post(
  upload.fields([ { name: "avatar", maxCount: 1 }, { name: "cover", maxCount: 1 } ]),
  registerUser
);
route.route("/login").post(loginUser);
route.route("/logout").post(logout);
route.route("/refresh").post(refreshAccessToken)
route.route("/auth").get(jwtVerify,(req,res)=>{

  res.status(200).send({
    success: true,
    message: "User is authenticated",
    user : req.user

  })
})



route.route("/subscribe").post(jwtVerify, subscribe)

route.route("/reset-password").post(jwtVerify,resetPassword);

route.route("/get-channel").get(jwtVerify,GetUser)





export default route;


