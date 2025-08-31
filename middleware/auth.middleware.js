import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

const jwtVerify = async (req, res, next) => {
  try {
    const token = req?.cookies?.access_token ;

    console.log("token: ",token)

    if(!token){
      return res.status(401).send({
        success: false,
        message: "Unauthorized Access",
      });
    }

  
    const decode = jwt.verify(token, process.env.ACCESS_TOKEN);

    console.log("decode", decode);
    
    const user = await User.findById(decode.id);

    console.log("user", user);
  
    if (!user) {  
      res.status(401).send({
        success: false,
        message: "Unauthorized Access",
      });
    }
  
    req.user = user;
  
    console.log('completed...')
    next();
  } catch (error) {
    console.log("error", error)
    res.status(200).send({
      success: false,
      message: "Invalid Token"
    })
  }
};

export default jwtVerify;

