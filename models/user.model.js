import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  username: {
    required: true,
    type: String,
    unique: true,
    lowercase: true,
    index: true,
  },
  email: {
    required: true,
    type: String,
    unique: true,
    lowercase: true,
    index: true,
  },
  password: {
    required: true,
    type: String,
  },
  avatar: {
    required: false,
    type: String,
  },
  coverImage: {
    required: false,
    type: String,
  },
  refresh_token: {
    required: false,
    type: String,
  },
  watchHistory : {
     type : Array
  }
} );

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      name: this.username,
      password: this.password,
      email: this.email,
    },
    process.env.ACCESS_TOKEN,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY },
  );
};

export const User = mongoose.model("User", userSchema);
