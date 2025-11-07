import { useEffect, useState } from 'react'
import api from '../../api/axios.js'
import { toast } from 'react-toastify'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HiPlus, 
  HiPencil, 
  HiTrash, 
  HiMagnifyingGlass, 
  HiFunnel,
  HiXMark,
  HiCloudArrowUp,
  HiCheckCircle,
  HiExclamationCircle,
  HiDocumentText,
  HiVideoCamera,
  HiQuestionMarkCircle
} from 'react-icons/hi2'

const emptyCourse = {
  title: '',
  description: '',
  thumbnail: '',
  category: 'Other',
  difficulty: 'Beginner',
  instructor: 'Admin',
  published: false,
  contents: []
}

export default function ManageCourses() {
  const [courses, setCourses] = useState([])
  const [form, setForm] = useState(emptyCourse)
  const [editingId, setEditingId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterDifficulty, setFilterDifficulty] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')

  const load = async () => {
    const { data } = await api.get('/courses')
    setCourses(data)
  }
  useEffect(() => { load() }, [])

  const saveCourse = async () => {
    try {
      if (editingId) {
        const { data } = await api.put(`/courses/${editingId}`, form)
        setCourses(prev => prev.map(c => c._id === editingId ? data : c))
        toast.success('Course updated successfully')
      } else {
        const { data } = await api.post('/courses', form)
        setCourses(prev => [data, ...prev])
        toast.success('Course created successfully')
      }
      setForm(emptyCourse)
      setEditingId(null)
      setShowModal(false)
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed')
    }
  }

  const editCourse = (c) => {
    setEditingId(c._id)
    setForm({
      title: c.title || '',
      description: c.description || '',
      thumbnail: c.thumbnail || '',
      category: c.category || 'Other',
      difficulty: c.difficulty || 'Beginner',
      instructor: c.instructor || 'Admin',
      published: c.published || false,
      contents: c.contents || []
    })
    setShowModal(true)
  }

  const delCourse = async (id) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return
    try {
      await api.delete(`/courses/${id}`)
      setCourses(prev => prev.filter(c => c._id !== id))
      toast.success('Course deleted successfully')
    } catch (e) {
      toast.error('Failed to delete course')
    }
  }

  const addContent = (type) => {
    setForm(f => ({ ...f, contents: [...(f.contents || []), { title: '', type, url: '', quiz: { questions: [] } }] }))
  }

  const removeContent = (idx) => {
    setForm(f => ({ ...f, contents: f.contents.filter((_, i) => i !== idx) }))
  }

  const handleUpload = async (file, idx) => {
    try {
      setUploading(true)
      const fd = new FormData(); fd.append('file', file)
      const { data } = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm(f => {
        const copy = { ...f }
        copy.contents[idx].url = data.url
        return copy
      })
      toast.success('File uploaded successfully')
    } catch (e) {
      toast.error('Upload failed')
    } finally { setUploading(false) }
  }

  const openCreateModal = () => {
    setForm(emptyCourse)
    setEditingId(null)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setForm(emptyCourse)
    setEditingId(null)
  }

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'All' || course.category === filterCategory
    const matchesDifficulty = filterDifficulty === 'All' || course.difficulty === filterDifficulty
    const matchesStatus = filterStatus === 'All' ||
      (filterStatus === 'Published' && course.published) ||
      (filterStatus === 'Draft' && !course.published)
    return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus
  })

  const stats = {
    total: courses.length,
    published: courses.filter(c => c.published).length,
    draft: courses.filter(c => !c.published).length
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Manage Courses</h1>
          <p className="text-slate-600 dark:text-slate-400">Create, edit, and manage your course catalog</p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-lg hover:shadow-xl"
        >
          <HiPlus className="w-5 h-5" />
          Create Course
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Total Courses</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/30 rounded-lg flex items-center justify-center">
              <HiDocumentText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Published</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.published}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950/30 rounded-lg flex items-center justify-center">
              <HiCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Drafts</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{stats.draft}</p>
            </div>
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
              <HiExclamationCircle className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <HiFunnel className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="All">All Categories</option>
              <option value="Programming">Programming</option>
              <option value="Design">Design</option>
              <option value="Business">Business</option>
              <option value="Marketing">Marketing</option>
              <option value="Science">Science</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="relative">
            <HiFunnel className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <HiFunnel className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none"
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Course</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Difficulty</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Instructor</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Contents</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <HiDocumentText className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-medium">No courses found</p>
                      <p className="text-sm text-slate-500 dark:text-slate-500">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{course.title}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">{course.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400">
                        {course.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        course.difficulty === 'Beginner' ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400' :
                        course.difficulty === 'Intermediate' ? 'bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                      }`}>
                        {course.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{course.instructor}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        course.published
                          ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-400'
                      }`}>
                        {course.published ? (
                          <>
                            <HiCheckCircle className="w-3.5 h-3.5" />
                            Published
                          </>
                        ) : (
                          <>
                            <HiExclamationCircle className="w-3.5 h-3.5" />
                            Draft
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                      {course.contents?.length || 0} items
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => editCourse(course)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                          title="Edit course"
                        >
                          <HiPencil className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => delCourse(course._id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Delete course"
                        >
                          <HiTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 overflow-y-auto"
            >
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {editingId ? 'Edit Course' : 'Create New Course'}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {editingId ? 'Update course details and content' : 'Fill in the details to create a new course'}
                      </p>
                    </div>
                    <button
                      onClick={closeModal}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <HiXMark className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Basic Information</h3>
                        
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Course Title *
                          </label>
                          <input
                            className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value })}
                            placeholder="Enter course title"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Description *
                          </label>
                          <textarea
                            className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                            rows={4}
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe what students will learn"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Category *
                            </label>
                            <select
                              className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                              value={form.category}
                              onChange={(e) => setForm({ ...form, category: e.target.value })}
                            >
                              <option value="Programming">Programming</option>
                              <option value="Design">Design</option>
                              <option value="Business">Business</option>
                              <option value="Marketing">Marketing</option>
                              <option value="Science">Science</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                              Difficulty Level *
                            </label>
                            <select
                              className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                              value={form.difficulty}
                              onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                            >
                              <option value="Beginner">Beginner</option>
                              <option value="Intermediate">Intermediate</option>
                              <option value="Advanced">Advanced</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Instructor Name
                          </label>
                          <input
                            className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            value={form.instructor}
                            onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                            placeholder="Instructor name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Thumbnail URL (optional)
                          </label>
                          <input
                            className="w-full px-4 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                            type="url"
                            value={form.thumbnail}
                            onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <input
                            type="checkbox"
                            id="published"
                            checked={form.published}
                            onChange={(e) => setForm({ ...form, published: e.target.checked })}
                            className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-2 focus:ring-primary-500"
                          />
                          <label htmlFor="published" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            Publish this course immediately
                          </label>
                        </div>
                      </div>

                      {/* Course Content */}
                      <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Course Content</h3>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => addContent('video')}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-950/50 transition-colors text-sm font-medium"
                            >
                              <HiVideoCamera className="w-4 h-4" />
                              Video
                            </button>
                            <button
                              type="button"
                              onClick={() => addContent('pdf')}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-950/50 transition-colors text-sm font-medium"
                            >
                              <HiDocumentText className="w-4 h-4" />
                              PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => addContent('quiz')}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-950/50 transition-colors text-sm font-medium"
                            >
                              <HiQuestionMarkCircle className="w-4 h-4" />
                              Quiz
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {(form.contents || []).length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                              <HiDocumentText className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                              <p className="text-slate-600 dark:text-slate-400 font-medium">No content added yet</p>
                              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Click the buttons above to add videos, PDFs, or quizzes</p>
                            </div>
                          ) : (
                            (form.contents || []).map((c, idx) => (
                              <div key={idx} className="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    {c.type === 'video' && <HiVideoCamera className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                                    {c.type === 'pdf' && <HiDocumentText className="w-5 h-5 text-red-600 dark:text-red-400" />}
                                    {c.type === 'quiz' && <HiQuestionMarkCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">{c.type}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeContent(idx)}
                                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                                  >
                                    <HiTrash className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                      Content Title
                                    </label>
                                    <input
                                      className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                      value={c.title}
                                      onChange={(e) => {
                                        const copy = { ...form }
                                        copy.contents[idx].title = e.target.value
                                        setForm(copy)
                                      }}
                                      placeholder="Enter content title"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                      Type
                                    </label>
                                    <select
                                      className="w-full px-4 py-2 border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                      value={c.type}
                                      onChange={(e) => {
                                        const copy = { ...form }
                                        copy.contents[idx].type = e.target.value
                                        setForm(copy)
                                      }}
                                    >
                                      <option value="video">Video</option>
                                      <option value="pdf">PDF</option>
                                      <option value="quiz">Quiz</option>
                                    </select>
                                  </div>
                                </div>

                                {(c.type === 'video' || c.type === 'pdf') && (
                                  <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                      Upload File
                                    </label>
                                    <div className="flex items-center gap-3">
                                      <label className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-primary-400 dark:hover:border-primary-600 transition-colors">
                                          <HiCloudArrowUp className="w-5 h-5 text-slate-400" />
                                          <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {uploading ? 'Uploading...' : 'Choose file or drag here'}
                                          </span>
                                        </div>
                                        <input
                                          type="file"
                                          className="hidden"
                                          onChange={(e) => e.target.files[0] && handleUpload(e.target.files[0], idx)}
                                          disabled={uploading}
                                        />
                                      </label>
                                      {c.url && (
                                        <a
                                          href={c.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="px-4 py-2 bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-950/50 transition-colors text-sm font-medium"
                                        >
                                          View File
                                        </a>
                                      )}
                                    </div>
                                    {c.url && (
                                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 truncate">
                                        URL: {c.url}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {c.type === 'quiz' && (
                                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                    <p className="text-sm text-purple-700 dark:text-purple-400">
                                      Quiz builder coming soon. You can add quiz questions after creating the course.
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                    <button
                      onClick={closeModal}
                      className="px-6 py-2.5 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveCourse}
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-lg hover:shadow-xl"
                    >
                      {editingId ? 'Update Course' : 'Create Course'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}