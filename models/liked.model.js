import mongoose  from "mongoose";   



 const likedSchema = new mongoose.Schema({
    user_id : { type : mongoose.Schema.Types.ObjectId , ref : "User" , required : true },
    music_id : { type : mongoose.Schema.Types.ObjectId , ref : "Music" , required : true }
 } , { timestamps : true })


 export const Liked = mongoose.model("Liked", likedSchema);