import { Router } from "express";
import jwtVerify from "../middleware/auth.middleware.js";
import { addPlayList ,
     getPlayList , 
     getPlayListById ,
     deletePlayList,
     AddMusicPlayList ,
      AddLike,
       AddMusic ,
        getMusic ,
         convert ,
          getAllMusic ,
          addWatchHistory,
           getMusicSuggestion,
           GetLikedMusic } from "../controller/music.controller.js";
import upload from "../middleware/multer.middleware.js";
const router = Router();


  // PlayList
router.route("/playlist").post(jwtVerify , addPlayList)
router.route("/playlist").get(jwtVerify , getPlayList)
router.route("/playlist/:id").get(jwtVerify , getPlayListById)
router.route("/playlist/:id").delete(jwtVerify , deletePlayList)
router.route("/add-music-playlist").post(jwtVerify , AddMusicPlayList)

 //Liked

 router.route("/like").post(jwtVerify , AddLike)
 router.route("/liked").get(jwtVerify , GetLikedMusic)


 //Music
 
 router.route("/upload-music").post(jwtVerify , upload.fields([ { name: "music", maxCount: 1 }, { name: "cover", maxCount: 1 } ]), AddMusic)
 router.route("/get-music").get(jwtVerify , getMusic)
 router.route("/get-all-music").get(jwtVerify , getAllMusic)
 router.route("/convert").post(jwtVerify , convert)
 router.route("/add-watch-history").post(jwtVerify , addWatchHistory)

 router.route("/suggestion").get(jwtVerify , getMusicSuggestion)






export default router
;

