import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiClock, HiAcademicCap, HiBookOpen } from 'react-icons/hi2';

export default function CourseCard({ course, onEnroll, isEnrolled }) {
  const difficultyColors = {
    Beginner: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    Advanced: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const categoryIcons = {
    Programming: '💻',
    Design: '🎨',
    Business: '💼',
    Marketing: '📈',
    Science: '🔬',
    Other: '📚',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-slate-200 dark:border-slate-700"
    >
      {/* Thumbnail */}
      <div className="h-48 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden relative">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-white text-6xl">{categoryIcons[course.category] || '📚'}</div>
        )}
        <div className="absolute top-3 right-3 flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${difficultyColors[course.difficulty] || difficultyColors.Beginner}`}>
            {course.difficulty}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
            {course.category}
          </span>
          {course.instructor && (
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <HiAcademicCap className="w-4 h-4" />
              <span>{course.instructor}</span>
            </div>
          )}
        </div>

        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
          {course.title}
        </h3>

        <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 line-clamp-2">
          {course.description || 'No description available'}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <HiBookOpen className="w-4 h-4" />
            <span>{course.contents?.length || 0} lessons</span>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            to={`/student/courses/${course._id}`}
            className="flex-1 text-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            View
          </Link>
          {!isEnrolled && (
            <button
              onClick={() => onEnroll(course._id)}
              className="px-4 py-2 border-2 border-primary-500 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg font-medium transition-colors"
            >
              Enroll
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}