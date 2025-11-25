import { useEffect, useState } from "react";
import api from "../../api/axios";
import { Link } from "react-router-dom";

export default function StudentVideoList() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    api.get("/videos").then((res) => setVideos(res.data));
  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      {videos.map((v) => (
        <Link key={v._id} to={`/videos/${v._id}`}>
          <div className="bg-white p-4 rounded shadow hover:scale-[1.02] transition">
            <img
              src={v.thumbnail || "https://via.placeholder.com/600x350"}
              className="rounded mb-3"
            />
            <h2 className="font-semibold text-lg">{v.title}</h2>
            <p className="text-gray-500 text-sm">{v.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
