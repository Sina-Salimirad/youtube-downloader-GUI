import { useEffect, useState } from "react";
import io from "socket.io-client";

const socket = io("https://youtube-downloader-production-380c.up.railway.app/");

function App() {
  const [videos, setVideos] = useState([]);
  const [videoTitle, setVideoTitle] = useState("");
  const [fileSize, setFileSize] = useState(null);
  const [downloadedSize, setDownloadedSize] = useState(null);
  const [downloadSpeed, setDownloadSpeed] = useState("");
  const [progressPercent, setProgressPercent] = useState("");
  const [eta, setEta] = useState("");
  const [downloadLink, setDownloadLink] = useState("");
  const [preparingStatus, setPreparingStatus] = useState(false);

  useEffect(() => {
    socket.on("download_status", (data) => {
      console.log("Received event:", data);

      if (data.status === "Downloading") {
        setVideoTitle(data.data.title);
        setFileSize(data.data.file_size);
        setDownloadedSize(data.data.downloaded);
        setDownloadSpeed(data.data.speed);
        setProgressPercent(data.data.percent);
        setEta(data.data.eta);
      } else if (data.status === "Video ready") {
        setDownloadLink(data.data.download_url);
        setVideos((prevVideos) => [...prevVideos, data.data]);
        setPreparingStatus(false);
      } else if (data.status === "Download complete") {
        alert(`${data.data.title} download complete!`);
      }
    });

    return () => {
      socket.off("download_status");
    };
  }, []);

  function isValidYouTubeLink(url) {
    const pattern =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|playlist\?list=|embed\/|shorts\/)?([a-zA-Z0-9_-]{11,})?(&?list=[a-zA-Z0-9_-]+)?/;
    return pattern.test(url);
  }

  const startDownload = () => {
    const url = document.getElementById("videoUrl").value;

    if (isValidYouTubeLink(url)) {
      setPreparingStatus(true);
      fetch(
        "https://youtube-downloader-production-380c.up.railway.app/api/v1/download",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url, clientId: socket.id }),
        }
      );
    } else {
      alert("The url is not correct");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>📥 YouTube Downloader</h1>

      <input type="text" id="videoUrl" placeholder="Enter YouTube URL..." />
      <button
        onClick={startDownload}
        className={preparingStatus ? "disable" : ""}
      >
        Download
      </button>

      {preparingStatus && <p>connecting to the server, please wait a moment</p>}

      {videoTitle &&
        preparingStatus(
          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          >
            <h3>🔹 Downloading: {videoTitle}</h3>
            <p>
              📊 <b>Progress:</b> {progressPercent}
            </p>
            <p>
              🚀 <b>Speed:</b> {downloadSpeed}
            </p>
            <p>
              ⏳ <b>ETA:</b> {eta}
            </p>
            <p>
              📂 <b>File Size:</b>{" "}
              {fileSize
                ? (fileSize / 1024 / 1024).toFixed(2) + " MB"
                : "Unknown"}
            </p>
            <p>
              ⬇️ <b>Downloaded:</b>{" "}
              {downloadedSize
                ? (downloadedSize / 1024 / 1024).toFixed(2) + " MB"
                : "0 MB"}
            </p>
          </div>
        )}

      {videos.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>📹 Videos Ready for Download:</h3>
          {videos.map((video) => (
            <div
              key={video.id}
              style={{
                marginBottom: "10px",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
              }}
            >
              <h4>{video.title}</h4>
              <a href={video.download_url} target="_blank" download>
                📥 Download Video
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
