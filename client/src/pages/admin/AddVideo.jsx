import { useState } from "react";
import api from "../../api/axios";
import { toast } from "react-toastify";

export default function AdminAddVideo() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnail: "",
  });

  const change = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async () => {
    try {
      const res = await api.post("/videos/add", form);
      toast.success("Video added successfully");
      setForm({ title: "", description: "", videoUrl: "", thumbnail: "" });
    } catch (err) {
      toast.error("Failed to add video");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Add New Video</h1>

      <input className="input" name="title" placeholder="Title" value={form.title} onChange={change} />
      <textarea className="input mt-3" name="description" placeholder="Description" value={form.description} onChange={change} />

      <input className="input mt-3" name="videoUrl" placeholder="Video URL (YouTube/GDrive/MP4)" value={form.videoUrl} onChange={change} />

      <input className="input mt-3" name="thumbnail" placeholder="Thumbnail URL (optional)" value={form.thumbnail} onChange={change} />

      <button onClick={submit} className="btn-primary mt-5 w-full">Add Video</button>
    </div>
  );
}
