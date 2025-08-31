import mongoose from "mongoose"


 const playlistSchema = new mongoose.Schema({
    name : { type : String, required : true } ,
    music: { type : Array,  ref : "Music" },
    user_id : { type : mongoose.Schema.Types.ObjectId , ref : "User" , required : true }

 } , { timestamps : true })


 export const Playlist = mongoose.model("Playlist", playlistSchema);