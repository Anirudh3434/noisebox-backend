import yt_dlp
import os
import sys

def download_mp3(url):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': 'public/output.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'postprocessor_args': ['-y'],
        'prefer_ffmpeg': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    # Always print final mp3 path (not webm/m4a)
    mp3_path = os.path.abspath("public/output.mp3")
    print(mp3_path)

if __name__ == "__main__":
    download_mp3(sys.argv[1])