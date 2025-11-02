import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    completedContentIds: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { timestamps: true }
);

enrollmentSchema.virtual('progressPercent').get(function () {
  // will be computed in controller by populating course length
  return 0;
});

export const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
