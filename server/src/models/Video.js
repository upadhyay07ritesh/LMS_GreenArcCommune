import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    thumbnail: { type: String },  // optional
    videoUrl: { type: String, required: true },
    course: { type: String }, // optional: if videos belong to a course
  },
  { timestamps: true }
);

export default mongoose.model("Video", videoSchema);
