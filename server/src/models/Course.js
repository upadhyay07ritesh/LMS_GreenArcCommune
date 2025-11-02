import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema(
  {
    title: String,
    type: { type: String, enum: ['video', 'pdf', 'quiz'], required: true },
    url: String, // for video/pdf
    quiz: {
      questions: [
        {
          question: String,
          options: [String],
          answerIndex: Number,
        },
      ],
    },
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    thumbnail: { type: String }, // URL to course thumbnail/image
    category: { type: String, enum: ['Programming', 'Design', 'Business', 'Marketing', 'Science', 'Other'], default: 'Other' },
    difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Beginner' },
    instructor: { type: String, default: 'Admin' },
    contents: [contentSchema],
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Course = mongoose.model('Course', courseSchema);
