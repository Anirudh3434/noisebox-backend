import jwtVerify from "../middleware/auth.middleware.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import {fileUpload} from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateToken = async (userId) => {
  const user = await User.findById(userId);

  console.log("user extracted", user);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refresh_token = refreshToken;

  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

const registerUser = async (req, res) => {
  console.log('Fine')
  try {
    console.log('req.body-------------------------------------------')
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const exist = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (exist) {
      return res.status(400).json({
        success: false,
        message: "Username or Email already exists",
      });
    }

    console.log("req.files", req.files);

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    console.log("avatarLocalPath", avatarLocalPath);
    console.log("coverImageLocalPath", coverImageLocalPath);

    if (!avatarLocalPath) {
      return res
        .status(400)
        .json({ success: false, message: "Avatar image required" });
    }

    const avatar = await fileUpload(avatarLocalPath).catch((error) => {
      console.error("Error uploading avatar:", error);
    });

    const coverImage = await fileUpload(coverImageLocalPath).catch((error) => {
      console.error("Error uploading cover image:", error);
    });

    console.log("avatar", avatar);

    if (!avatar) {
      return res.status(500).json({
        success: false,
        message: "Error uploading avatar",
      });
    }

    const response = await User.create({
      username,
      email,
      password,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
    });

    if (!response) {
      return res.status(500).json({
        success: false,
        message: "Failed to register user",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: response._id,
        username: response.username,
        coverImage: response.coverImage || "",
        avatar: response.avatar || "",
      },
      message: "Registration successful",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

const loginUser = async (req, res) => {


  if(req.user){
    console.log('User is already logged in')
    return res.status(200).json({
      success: true,
      message: "User is already logged in",
    });
  }
 

  try {
    const { email, password } = req.body;

    console.log(req.body)

    if ([email, password].some((item) => item.trim() === "")) {
      return res.status(400).send({
        success: false,
        message: "Enter Email and Password",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User Not Found",
      });
    }

    const passwordCorrect = await user.comparePassword(password);

    console.log("passwordCorrect", passwordCorrect);

    if (!passwordCorrect) {
      return res.status(401).send({
        success: false,
        message: "Invalid password",
      });
    }



    const token = await generateToken(user._id);
     const option = {
  httpOnly: true,           // Prevents access from JavaScript
  secure: true,             // Only sends cookie over HTTPS
  sameSite: 'Strict',       // Helps prevent CSRF attacks
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};


    console.log('access token', token.accessToken);
    console.log('refresh token', token.refreshToken);

    



    res
      .status(200)
      .cookie("access_token", token.accessToken, option)
      .cookie("refresh_token", token.refreshToken, option)
      .send({
        success: true,
        message: "User login successful",
      });
  } catch (error) {
    res.status(501).send({
      success: false,
      message: error.message || "Server Error",
    });
  }
};


const logout = async (req, res) => {
  try {
  console.log('Log out running.....')



    const user = req.user;

    user.refresh_token = "";

    console.log("user: ", user);

    await user.save({ validateBeforeSave: false });

    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    res.status(201).send({
      success: true,
      message: "User logout successful",
    });

  } catch (error) {
    res.status(501).send({
      success: false,
      message: error.message || "Server Error",
    });
  }
}

const refreshAccessToken = async (req, res) => {
  try {
    


    const token =  req?.cookies?.refresh_token;




    if (!token) {
      res.status(401).send({
        success: false,
        message: "Your are Currently not logged in",
      })
    }



    console.log('rf' ,  process.env.REFRESH_TOKEN_EXPIRY)

      const decode =  jwt.verify(token , process.env.REFRESH_TOKEN)



      console.log(decode)


    const user = await  User.findById(decode._id)

    console.log('user: ', user)


    const {accessToken , refreshToken} = await generateToken(user._id);

    const option = {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',       // Helps prevent CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    }

    if(accessToken){
  res.status(200)
  .cookie("access_token",accessToken,option)
  .cookie("refresh_token",refreshToken, option)
  .send({
    success: true, 
    message: "Logged in successfully",
  })
}



  } catch (error) {
    
    res.status(501).send({
      success: false,
      message: error.message || "Server Error",
      });

  } 
}



const resetPassword  = async (req, res) => {
  try {

    const {oldPassword , newPassword} = req.body;

    const id =  req?.user?.id;

    const user = await User.findById(id);

    if(!user){
      return res.status(404).send({
        success: false,
        message: "User Not Found",
      })
    }

    const passwordCorrect = await user.comparePassword(oldPassword);

    if(!passwordCorrect){
      return res.status(401).send({
        success: false,
        message: "Invalid password",
      })
    }
    user.password = newPassword;

    await user.save();

    res.status(200).send({
      success: true,
      message: "Password Reset Successful",
    })

    
  } catch (error) {

    res.status(501).send({
      success: false,
      message: error.message || "Server Error",
    })
    
  }
}

const GetUser = async (req , res) =>{
  try {

    console.log(req.user)

  const channel = await User.aggregate(
   [ {
      $match: {username : req.user.username},
    },
    {

      $lookup : {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers'
      },
      
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: '_id',
          foreignField: 'subscribe',
          as: 'subscribeTo'
        }
      },
      {
        $addFields : {
          "subscribersCount" : { $size : "$subscribers" },
          "subscribeTCount" : { $size : "$subscribeTo" },
          "Subscribers" : "$subscribers" ,
          "SubscribeTo" : "$subscribeTo",
          "isSubscribed" : { $in : [req.user._id , "$subscribers.subscribe"] },
        }
      },
      {
        $project : {
          _id : 1,
          username : 1,
          avatar : 1,
          coverImage : 1,
          subscribersCount : 1,
          subscribeTCount : 1,
          Subscribers : 1,
          SubscribeTo : 1,
          isSubscribed : 1,
          
        }
      }

      
    ]
  )

  console.log("channel", channel)

  res.status(200).send({
    success: true,
    message: "User found",
    channel,
  })



  } catch (error) {
    
  }
}

const subscribe = async (req , res) => {
  try {

    const {username} = req.body;

    console.log("username", username)

    if(!username){
      return res.status(400).send({
        message : "Username is required"
      })
    }

    const user = await User.findOne({username});

    if(!user){
      return res.status(404).send({
        message : "User not found"
      })
    }

    Subscription.create({
      channel: user._id,
      subscribe: req.user._id
    })
    
    res.status(200).send({
      success: true,
      message: "Subscribed successfully",
    })
    
  } catch (error) {
    
    console.log(error)
    res.status(501).send({
      success: false,
      message: error.message || "Server Error",
    })
  }
}







export { registerUser, loginUser , logout , refreshAccessToken , resetPassword  , subscribe , GetUser }  ;  // export the functions  // export the functions  // export th
