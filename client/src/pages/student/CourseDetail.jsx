import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchCourse, myEnrollments, markProgress, enrollCourse } from '../../slices/courseSlice.js'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { motion } from 'framer-motion'
import { HiPlay, HiDocumentText, HiAcademicCap, HiCheckCircle, HiClock } from 'react-icons/hi2'

export default function CourseDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { current, enrollments, loading } = useSelector(s => s.courses)
  const enrollment = enrollments.find(e => e.course._id === id)

  useEffect(() => {
    dispatch(fetchCourse(id))
    dispatch(myEnrollments())
  }, [dispatch, id])

  const handleEnroll = async () => {
    const res = await dispatch(enrollCourse(id))
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Successfully enrolled!')
      dispatch(myEnrollments())
    } else {
      toast.error(res.payload || 'Failed to enroll')
    }
  }

  const isCompleted = (contentId) => enrollment?.completedContentIds?.some(x => x.toString() === contentId.toString())
  const totalContents = current?.contents?.length || 0
  const completedCount = enrollment?.completedContentIds?.length || 0
  const progress = totalContents > 0 ? Math.round((completedCount / totalContents) * 100) : 0

  if (loading || !current) {
    return (
      <div className="card text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        <p className="mt-4 text-slate-600 dark:text-slate-400">Loading course...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Course Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-gradient-to-r from-primary-500 to-primary-600 text-white"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {current.category || 'General'}
              </span>
              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                {current.difficulty || 'Beginner'}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{current.title}</h1>
            <p className="text-primary-100 mb-4">{current.description || 'No description available'}</p>
            <div className="flex items-center gap-4 text-sm">
              {current.instructor && (
                <div className="flex items-center gap-2">
                  <HiAcademicCap className="w-5 h-5" />
                  <span>{current.instructor}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <HiClock className="w-5 h-5" />
                <span>{totalContents} lessons</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Enrollment Section */}
      {!enrollment ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center"
        >
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            You need to enroll in this course to access the content.
          </p>
          <button onClick={handleEnroll} className="btn btn-primary">
            Enroll Now
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Progress</h3>
            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
              {completedCount} / {totalContents} completed
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="bg-primary-500 h-3 rounded-full transition-all duration-500"
            />
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {progress}% complete
          </p>
        </motion.div>
      )}

      {/* Course Contents */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Course Content</h2>
        {current.contents && current.contents.length > 0 ? (
          current.contents.map((content, idx) => {
            const Icon = content.type === 'video' ? HiPlay :
                        content.type === 'pdf' ? HiDocumentText :
                        HiAcademicCap
            const isContentCompleted = enrollment && isCompleted(content._id)

            return (
              <motion.div
                key={content._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    isContentCompleted
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{content.title}</h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase">
                          {content.type}
                        </span>
                      </div>
                      {isContentCompleted && (
                        <HiCheckCircle className="w-6 h-6 text-green-500" />
                      )}
                    </div>

                    {content.type === 'video' && content.url && (
                      <div className="mt-3 rounded-lg overflow-hidden">
                        <video src={content.url} controls className="w-full" />
                      </div>
                    )}

                    {content.type === 'pdf' && content.url && (
                      <a
                        href={content.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline"
                      >
                        <HiDocumentText className="w-5 h-5" />
                        Open PDF Document
                      </a>
                    )}

                    {content.type === 'quiz' && (
                      <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Quiz with {content.quiz?.questions?.length || 0} question{content.quiz?.questions?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    {enrollment && (
                      <button
                        onClick={() => dispatch(markProgress({ enrollmentId: enrollment.id, contentId: content._id }))}
                        className={`mt-3 btn ${isContentCompleted ? 'btn-outline' : 'btn-primary'} flex items-center gap-2`}
                      >
                        {isContentCompleted ? (
                          <>
                            <HiCheckCircle className="w-4 h-4" />
                            Completed
                          </>
                        ) : (
                          'Mark as Complete'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })
        ) : (
          <div className="card text-center py-8 text-slate-600 dark:text-slate-400">
            No content available yet.
          </div>
        )}
      </div>
    </div>
  )
}
