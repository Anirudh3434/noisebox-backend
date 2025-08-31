import { Liked } from "../models/liked.model.js";
import { Playlist } from "../models/playlist.model.js";
import { fileUpload } from "../utils/cloudinary.js";
import { Music } from "../models/music.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { User } from "../models/user.model.js";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptPath = path.join(__dirname, "conversion.py");

const addPlayList = async (req, res) => {
  try {
    const { playlistName } = req.body;

    console.log(playlistName);

    const user = req.user;

    if (!playlistName) {
      return res.status(400).send({
        success: false,
        message: "Playlist name is required",
      });
    }

    const playlist = await Playlist.create({
      name: playlistName,
      music: [],
      user_id: user._id,
    });

    if (!playlist) {
      return res.status(400).send({
        success: false,
        message: "Playlist not created",
      });
    }

    res.status(200).send({
      success: true,
      message: "Playlist created successfully",
      playlist,
    });
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.message || "Server Error",
    });
  }
};

const getPlayList = async (req, res) => {
  const user = req.user;

  const playlist = await Playlist.find({ user_id: user._id });

  if (!playlist) {
    return res.status(400).send({
      success: false,
      message: "Playlist not found",
    });
  }

  res.status(200).send({
    success: true,
    message: "Playlist found successfully",
    playlist,
  });
};

const getPlayListById = async (req, res) => {
  const { id } = req.params;

  const playlist = await Playlist.findById(id);

  if (!playlist) {
    return res.status(400).send({
      success: false,
      message: "Playlist not found",
    });
  }

  res.status(200).send({
    success: true,
    message: "Playlist found successfully",
    playlist,
  });
};

const AddMusicPlayList = async (req, res) => {
  const { playlist_id, music_id } = req.body;

  const playlist = await Playlist.findById(playlist_id);

  if (!music_id) {
    return res.status(400).send({
      success: false,
      message: "Music is required",
    });
  }

  if (!playlist) {
    return res.status(400).send({
      success: false,
      message: "Playlist not found",
    });
  }

  playlist.music.push(music_id);

  await playlist.save();

  res.status(200).send({
    success: true,
    message: "Music added successfully",
    playlist,
  });
};

const AddLike = async (req, res) => {
  const user = req.user;
  const { music_id } = req.body;

  console.log(music_id);


  const likeExist = await Liked.findOne({
    $and : [
      { user_id : user._id },
      { music_id : music_id }
    ]
  })

  console.log(likeExist);



 if(likeExist){
 
    await Liked.deleteOne({ $and : [
      { user_id : user._id },
      { music_id : music_id }
      ]})

      return res.status(200).send({
        success: true,
        message: "Like removed successfully",
        });

 }


  if (!music_id) {
    return res.status(400).send({
      success: false,
      message: "Music is required",
    });
  }

  if (!user) {
    res.send(401).send({
      success: false,
      message: "Unauthorized",
    });
  }




  const like = Liked.create({
    user_id: user._id,
    music_id: music_id,
  });

  if (!like) {
    return res.status(400).send({
      success: false,
      message: "Like not created",
    });
  }

  res.status(200).send({
    success: true,
    message: "Like created successfully",
    like
  });
};

const AddMusic = async (req, res) => {
  const user = req.user;
  const { title, artist, album, genre, cover } = req.body;

  console.log("body", req.body);

  console.log("files", req.files);

  const musicFile = req.files?.music?.[0]?.path;

  const musicCover = req.files?.cover?.[0]?.path;

  if ([musicFile].some((item) => item === undefined)) {
    return res.status(400).send({
      success: false,
      message: "Music file is required",
    });
  }

  const musicUpload = await fileUpload(musicFile).catch((error) => {
    console.error("Error uploading music:", error);
  });

  const coverUpload = await fileUpload(musicCover).catch((error) => {
    console.error("Error uploading cover:", error);
  });

  console.log("musicUpload", musicUpload);
  console.log("coverUpload", coverUpload);

  if (!musicUpload || !coverUpload) {
    return res.status(500).send({
      success: false,
      message: "Error uploading music or cover",
    });
  }

  const music = await Music.create({
    title,
    artist,
    album,
    genre,
    cover: coverUpload.url,
    music: musicUpload.url,
    owner: user._id,
  });

  if (!music) {
    return res.status(400).send({
      success: false,
      message: "Music not created",
    });
  }

  res.status(200).send({
    success: true,
    message: "Music created successfully",
    music,
  });
};

const getMusic = async (req, res) => {
  const user = req.user;

  const music = await Music.aggregate([
    {
      $match: { owner: user._id },
    },
    {
      $lookup: {
        from: "likeds",
        localField: "_id",
        foreignField: "music_id",
        as: "result",
      },
    },
    {
      $addFields: {
        likes: { $size: "$result" },
        isLiked : {$in : [req.user._id , "$result.user_id"]}
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        artist: 1,
        album: 1,
        genre: 1,
        cover: 1,
        music: 1,
        likes: 1,
        isLiked : 1

      }
    }
  ]);

  if (!music) {
    return res.status(400).send({
      success: false,
      message: "Music not found",
    });
  }

  res.status(200).send({
    success: true,
    message: "Music found successfully",
    music,
  });
};

const convert = async (req, res) => {
  const { url, title, artist, album, genre } = req.body;
  const user = req.user;

  console.log("START...")

  if (!url) {
    return res.status(400).send({
      success: false,
      message: "YouTube URL is required",
    });
  }

  exec(`python3 "${scriptPath}" "${url}"`, async (error, stdout, stderr) => {
    if (error) {
      console.error("Exec error:", error.message, stderr);
      return res
        .status(500)
        .send({ success: false, message: "Conversion failed" });
    }

    console.log("PYTHON END...")

    const lastLine = stdout.trim().split("\n").pop();
    console.log("Final mp3 path:", lastLine);

    try {
      const YouTube = await fileUpload(lastLine);
      if (!YouTube) {
        return res
          .status(400)
          .send({ success: false, message: "Failed to upload YouTube" });
        }

        console.log("FILE UPLOAD END...")

      const music = await Music.create({
        title,
        artist,
        album,
        genre,
        cover:
          "https://cdn.pixabay.com/photo/2022/01/21/00/38/youtube-icon-6953526_1280.jpg",
        music: YouTube.url,
        owner: user._id,
      });

      console.log("MUSIC END...")

      res.status(200).send({
        success: true,
        message: "Youtube Music created successfully",
        data: music,
      });
    } catch (err) {
      console.error("Upload/Create error:", err);
      res.status(500).send({ success: false, message: "Server error" });
    }
  });
};

const getAllMusic = async (req, res) => {
  const music = await Music.aggregate([
    {
      $lookup: {
        from: "likeds",
        localField: "_id",
        foreignField: "music_id",
        as: "result",
      },
    },
    {
      $addFields: {
        likes: { $size: "$result" },
        isLiked : {$in : [req.user._id , "$result.user_id"]}
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        artist: 1,
        album: 1,
        genre: 1,
        cover: 1,
        music: 1,
        likes: 1,
        isLiked : 1

      }
    }
  ]);

  if (!music) {
    return res.status(400).send({
      success: false,
      message: "Music not found",
    });
  }

  res.status(200).send({
    success: true,
    message: "Music found successfully",
    music,
  });
};

const deletePlayList = async (req, res) => {
  const { id } = req.params;

  const playlist = await Playlist.findByIdAndDelete(id);

  if (!playlist) {
    return res.status(400).send({
      success: false,
      message: "Playlist not found",
    });
  }

  res.status(200).send({
    success: true,
    message: "Playlist deleted successfully",
    playlist,
  });
};

const GetLikedMusic = async (req, res) => {
  try {
    const likedMusic = await Liked.aggregate([
      {
        $match: {
          user_id: req.user._id
        }
      },
      {
      $lookup: {
        from: "musics",
        localField: "music_id",
        foreignField: "_id",
        as: "result",
      },
    },
    {
      $addFields : {
        music : { $arrayElemAt: ["$result", 0] }
      }
    },{
      $project : {
        music : 1
      }
    }
    
      
    ]);

    if (!likedMusic || likedMusic.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Liked music not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Liked music found successfully",
      likedMusic,
    });
  } catch (error) {
    console.error("Error fetching liked music:", error);
    res.status(500).send({
      success: false,
      message: "Something went wrong while fetching liked music.",
      error: error.message
    });
  }
}

const addWatchHistory = async (req, res) => {
  try {
   
    const { music_id } = req.body;

    if (!music_id) {
      return res.status(400).send({
        success: false,
        message: "music_id is required",
      });
    }

 

    const user = await User.findOne(
      { _id: req.user._id },
    );

    user.watchHistory.push( music_id );
    await user.save();

    res.status(200).send({
      success: true,
      message: "Watch history updated",
      user
    });

  } catch (error) {
    console.error("Error updating watch history:", error);
    res.status(500).send({
      success: false,
      message: "Server error",
    });
  }
};


const getMusicSuggestion = async (req, res) => {

  console.log("suggestion api called")

  try {
    const id = req.user._id;
    if (!id) {
      return res.status(401).send({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(id).select("watchHistory");
    const allSongs = await Music.find().select("music title artist genre owner album cover").lean();

    const watchIds = [...new Set(user.watchHistory)];
    const watchedSongs = await Promise.all(
      watchIds.map((item) => Music.findById(item).select("music").lean())
    );

    const validWatched = watchedSongs.filter((s) => s && s.music);

    const payload = {
      watched: validWatched.map((song) => song.music),
      all: allSongs.map((song) => ({
        _id: song._id,
        title: song.title,
        music: song.music,
        artist: song.artist,
        genre: song.genre,
        owner : song.owner,
        album: song.album,
        cover: song.cover,
      })),
    };

    const python = spawn("python3", [path.join(__dirname, "../utils/songSuggestion.py")]);

    let result = "";
    python.stdout.on("data", (data) => (result += data.toString()));
    python.stderr.on("data", (err) => console.error("Python error:", err.toString()));

    python.stdin.write(JSON.stringify(payload));
    python.stdin.end();

    python.on("close", (code) => {
      if (code === 0) {
        const recommendations = JSON.parse(result);
        res.status(200).json({ success: true, recommendations });
      } else {
        res.status(500).json({ success: false, message: "Python script failed" });
      }
    });
  } catch (err) {
    console.error("Error in getMusicSuggestion:", err);
    res.status(500).send({
      success: false,
      message: "Server error",
    });
  }
};



export {
  addPlayList,
  getPlayList,
  getPlayListById,
  AddMusicPlayList,
  AddLike,
  AddMusic,
  getMusic,
  convert,
  getAllMusic,
  deletePlayList,
  GetLikedMusic,
  addWatchHistory,
  getMusicSuggestion
};
