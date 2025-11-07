import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true }, // ✅ Course link
    title: { type: String, required: true },
    link: { type: String, required: true },
    date: { type: Date, required: true },
    expiresAt: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const LiveSession = mongoose.model("LiveSession", liveSessionSchema);
