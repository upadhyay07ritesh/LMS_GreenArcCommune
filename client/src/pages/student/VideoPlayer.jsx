import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/axios";

export default function VideoPlayer() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);

  useEffect(() => {
    api.get(`/videos/${id}`).then((res) => setVideo(res.data));
  }, [id]);

  if (!video) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{video.title}</h1>
      <div className="aspect-video w-full bg-black mb-4">
        <iframe
          src={video.videoUrl.replace("watch?v=", "embed/")}
          className="w-full h-full"
          allowFullScreen
        ></iframe>
      </div>
      <p className="text-gray-700">{video.description}</p>
    </div>
  );
}
