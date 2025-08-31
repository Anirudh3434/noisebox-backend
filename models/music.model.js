import mongoose from "mongoose"


const musicSchema  =  new mongoose.Schema({

    title : {
        type : String,
        required : true
        },
    artist : {
        type : String,
        required : true
        },
    album : {
        type : String,
        required : true
        },
    genre : {
        type : String,
        required : true
        },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },

    cover : {
        type : String,  // cloudinary url
        required : true
        },

     music : {
        type : String,  // cloudinary url
        required : true
     }   
}, {timestamps: true})


export const Music = mongoose.model("music", musicSchema);