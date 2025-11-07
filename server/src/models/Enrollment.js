import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedContentIds: [{ type: mongoose.Schema.Types.ObjectId }],
    // ❌ Do NOT define progress as a field here — it's computed dynamically
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// ✅ Use a *getter* instead of a conflicting virtual name
enrollmentSchema.virtual('progressPercent').get(function () {
  if (!this.course?.contents?.length) return 0;
  const total = this.course.contents.length;
  const completed = this.completedContentIds?.length || 0;
  return Math.min(100, Math.round((completed / total) * 100));
});

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
