import mongoose , { Schema } from "mongoose";


const subscription = new Schema(
    {
       channel : {
        type : Schema.Types.ObjectId,
        ref : "User"
       },
       subscribe : {
        type : Schema.Types.ObjectId,
        ref : "User"
       }    
    }
)

export const Subscription = mongoose.model("Subscription", subscription);
