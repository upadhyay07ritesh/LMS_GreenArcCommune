import { motion, AnimatePresence } from "framer-motion";
import {
  HiXMark,
  HiVideoCamera,
  HiDocumentText,
  HiQuestionMarkCircle,
  HiCloudArrowUp,
  HiTrash,
} from "react-icons/hi2";

export default function CourseModal({
  show,
  onClose,
  form,
  setForm,
  saveCourse,
  addContent,
  removeContent,
  handleUpload,
  uploading,
  editingId,
  handleThumbnailUpload,
}) {
  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {editingId ? "Edit Course" : "Create New Course"}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {editingId
                        ? "Update course details and content"
                        : "Fill in the details to create a new course"}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <HiXMark className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* --- Basic Info --- */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Basic Information
                      </h3>

                      {/* Title */}
                      <div>
                        <label className="label">Course Title *</label>
                        <input
                          className="input"
                          value={form.title}
                          onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                          }
                          placeholder="Enter course title"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="label">Description *</label>
                        <textarea
                          className="input resize-none"
                          rows={3}
                          value={form.description}
                          onChange={(e) =>
                            setForm({ ...form, description: e.target.value })
                          }
                          placeholder="Describe what students will learn"
                        />
                      </div>

                      {/* Category + Difficulty */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Category *</label>
                          <select
                            className="input"
                            value={form.category}
                            onChange={(e) =>
                              setForm({ ...form, category: e.target.value })
                            }
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
                          <label className="label">Difficulty *</label>
                          <select
                            className="input"
                            value={form.difficulty}
                            onChange={(e) =>
                              setForm({ ...form, difficulty: e.target.value })
                            }
                          >
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                          </select>
                        </div>
                      </div>

                      {/* Paid / Free Section */}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="label">Course Type</label>
                          <select
                            className="input"
                            value={form.isPaid ? "Paid" : "Free"}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                isPaid: e.target.value === "Paid",
                                price:
                                  e.target.value === "Paid"
                                    ? form.price || ""
                                    : 0,
                              })
                            }
                          >
                            <option value="Free">Free</option>
                            <option value="Paid">Paid</option>
                          </select>
                        </div>

                        {form.isPaid && (
                          <div>
                            <label className="label flex items-center gap-2">
                              Course Price
                            </label>

                            <div className="relative">
                              {/* $ symbol inside the input */}
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold select-none">
                                $
                              </span>

                              <input
                                type="number"
                                min="1"
                                inputMode="numeric"
                                className="w-full pl-8 pr-3 py-2.5 rounded-lg border-2 border-slate-200 dark:border-slate-700 
                     bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent 
                     transition-all font-medium"
                                value={form.price === 0 ? "" : form.price || ""}
                                onChange={(e) =>
                                  setForm({
                                    ...form,
                                    price:
                                      e.target.value === ""
                                        ? ""
                                        : parseInt(e.target.value),
                                  })
                                }
                                placeholder="Enter course price"
                              />
                            </div>

                            <p className="text-xs text-slate-500 mt-1">
                              Set a fair one-time price for this course
                            </p>

                            {/* Show slashed price when granted free */}
                            <div className="mt-4 flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                              <input
                                type="checkbox"
                                id="showSlashedPriceOnGrant"
                                checked={!!form.showSlashedPriceOnGrant}
                                onChange={(e) =>
                                  setForm((prev) => ({
                                    ...prev,
                                    showSlashedPriceOnGrant: e.target.checked,
                                  }))
                                }
                                className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-2 focus:ring-primary-500"
                              />
                              <label
                                htmlFor="showSlashedPriceOnGrant"
                                className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                              >
                                Show price with a strike-through when granting this course for free to selected users
                              </label>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Instructor */}
                      <div>
                        <label className="label">Instructor</label>
                        <input
                          className="input"
                          value={form.instructor}
                          onChange={(e) =>
                            setForm({ ...form, instructor: e.target.value })
                          }
                          placeholder="Instructor name"
                        />
                      </div>

                      {/* Thumbnail Upload */}
                      <div>
                        <label className="label">Thumbnail</label>
                        <div className="flex items-center gap-3">
                          <label className="cursor-pointer">
                            <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-primary-400 dark:hover:border-primary-600 transition-colors">
                              <HiCloudArrowUp className="w-5 h-5 text-slate-400" />
                              <span className="text-sm text-slate-600 dark:text-slate-400">
                                {uploading ? "Uploading..." : "Choose image or drag here"}
                              </span>
                            </div>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) =>
                                e.target.files[0] && handleThumbnailUpload(e.target.files[0])
                              }
                              disabled={uploading}
                            />
                          </label>
                          {form.thumbnail && (
                            <img
                              src={form.thumbnail}
                              alt="Thumbnail"
                              className="w-16 h-16 rounded object-cover border border-slate-200 dark:border-slate-700"
                            />
                          )}
                        </div>
                      </div>

                      {/* Published */}
                      <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <input
                          type="checkbox"
                          id="published"
                          checked={form.published}
                          onChange={(e) =>
                            setForm({ ...form, published: e.target.checked })
                          }
                          className="w-5 h-5 text-primary-600 border-slate-300 rounded focus:ring-2 focus:ring-primary-500"
                        />
                        <label
                          htmlFor="published"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                        >
                          Publish this course immediately
                        </label>
                      </div>
                    </div>

                    {/* --- Course Contents --- */}
                    <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          Course Content
                        </h3>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => addContent("video")}
                            className="btn-light-blue"
                          >
                            <HiVideoCamera className="w-4 h-4" /> Video
                          </button>
                          <button
                            type="button"
                            onClick={() => addContent("pdf")}
                            className="btn-light-red"
                          >
                            <HiDocumentText className="w-4 h-4" /> PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => addContent("quiz")}
                            className="btn-light-purple"
                          >
                            <HiQuestionMarkCircle className="w-4 h-4" /> Quiz
                          </button>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {(form.contents || []).length === 0 ? (
                          <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
                            <HiDocumentText className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                            <p className="text-slate-600 dark:text-slate-400 font-medium">
                              No content added yet
                            </p>
                          </div>
                        ) : (
                          (form.contents || []).map((c, idx) => (
                            <div
                              key={idx}
                              className="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  {c.type === "video" && (
                                    <HiVideoCamera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                  )}
                                  {c.type === "pdf" && (
                                    <HiDocumentText className="w-5 h-5 text-red-600 dark:text-red-400" />
                                  )}
                                  {c.type === "quiz" && (
                                    <HiQuestionMarkCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                  )}
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                                    {c.type}
                                  </span>
                                </div>
                                <button
                                  onClick={() => removeContent(idx)}
                                  className="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                                >
                                  <HiTrash className="w-4 h-4" />
                                </button>
                              </div>

                              {(c.type === "video" || c.type === "pdf") && (
                                <div>
                                  <label className="label">Upload File</label>
                                  <div className="flex items-center gap-3">
                                    <label className="flex-1 cursor-pointer">
                                      <div className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-primary-400 dark:hover:border-primary-600 transition-colors">
                                        <HiCloudArrowUp className="w-5 h-5 text-slate-400" />
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                          {uploading
                                            ? "Uploading..."
                                            : "Choose file or drag here"}
                                        </span>
                                      </div>
                                      <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) =>
                                          e.target.files[0] &&
                                          handleUpload(e.target.files[0], idx)
                                        }
                                        disabled={uploading}
                                      />
                                    </label>
                                    {c.url && (
                                      <a
                                        href={c.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-link"
                                      >
                                        View File
                                      </a>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <button onClick={onClose} className="btn-outline">
                    Cancel
                  </button>
                  <button onClick={saveCourse} className="btn-primary">
                    {editingId ? "Update Course" : "Create Course"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
