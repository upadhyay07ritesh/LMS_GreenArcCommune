import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },

    title: { type: String, required: true },
    link: { type: String, required: true },
    date: { type: Date, required: true },

    status: {
      type: String,
      enum: ["upcoming", "live", "ended"],
      default: "upcoming",
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    // ---- Metadata fields for Pro Dashboard ----
    startedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    startedByName: { type: String, default: null },

    endedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
    endedByName: { type: String, default: null },

    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const LiveSession = mongoose.model("LiveSession", liveSessionSchema);
