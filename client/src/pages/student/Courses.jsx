import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCourses,
  enrollCourse,
  myEnrollments,
} from "../../slices/courseSlice.js";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import CourseCard from "../../components/CourseCard.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import { HiFunnel, HiXMark } from "react-icons/hi2";

const categories = [
  "All",
  "Programming",
  "Design",
  "Business",
  "Marketing",
  "Science",
  "Other",
];
const difficulties = ["All", "Beginner", "Intermediate", "Advanced"];
const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "title", label: "Title A-Z" },
];

export default function Courses() {
  const dispatch = useDispatch();
  const { items, loading, enrollments } = useSelector((s) => s.courses);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    dispatch(myEnrollments());
    loadCourses();
  }, [dispatch]);

  useEffect(() => {
    loadCourses();
  }, [searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const loadCourses = () => {
    const params = {};
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory !== "All") params.category = selectedCategory;
    if (selectedDifficulty !== "All") params.difficulty = selectedDifficulty;
    params.sortBy = sortBy;
    dispatch(fetchCourses(params));
  };

  const handleEnroll = async (courseId) => {
    const res = await dispatch(enrollCourse(courseId));
    if (res.meta.requestStatus === "fulfilled") {
      toast.success("Successfully enrolled!");
      dispatch(myEnrollments());
    } else {
      toast.error(res.payload || "Failed to enroll");
    }
  };

  const enrolledCourseIds = enrollments.map((e) => e.course._id);

  // ✅ Split courses into My Courses and Explore More
  const myCourses = items.filter((c) => enrolledCourseIds.includes(c._id));
  const exploreCourses = items.filter((c) => !enrolledCourseIds.includes(c._id));

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedDifficulty("All");
    setSortBy("newest");
  };

  const activeFilters =
    (selectedCategory !== "All" ? 1 : 0) +
    (selectedDifficulty !== "All" ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0) +
    (searchQuery ? 1 : 0);

  return (
    <div className="pt-12 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            My Learning
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            View your enrolled courses and explore new ones
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline flex items-center gap-2"
          >
            <HiFunnel className="w-4 h-4" />
            Filters
            {activeFilters > 0 && (
              <span className="bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilters}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          onSearch={setSearchQuery}
          placeholder="Search courses by title or description..."
        />

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Filters
              </h3>
              {activeFilters > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                >
                  <HiXMark className="w-4 h-4" />
                  Clear all
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="label">Difficulty</label>
                <select
                  className="input"
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                >
                  {difficulties.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="label">Sort By</label>
                <select
                  className="input"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Courses Section */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">
            Loading courses...
          </p>
        </div>
      ) : (
        <>
          {/* ✅ My Courses Section */}
          <section className="mt-8">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              My Courses
            </h3>
            {myCourses.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-400">
                You haven’t enrolled in any courses yet.
              </p>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCourses.map((course, idx) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <CourseCard
                      course={course}
                      onEnroll={handleEnroll}
                      isEnrolled={true}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* ✅ Explore More Section */}
          <section className="mt-12">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Explore More Courses
            </h3>
            {exploreCourses.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-slate-600 dark:text-slate-400">
                  No other courses available right now.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exploreCourses.map((course, idx) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <CourseCard
                      course={course}
                      onEnroll={handleEnroll}
                      isEnrolled={false}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
