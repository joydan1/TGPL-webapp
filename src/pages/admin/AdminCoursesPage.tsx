import { useMemo, useState } from 'react'
import {
  Plus, Search, MoreVertical, Layers, Globe, Pencil, TrendingUp,
  Eye, Tag, UserCog, Archive, Trash2,
} from 'lucide-react'
//import { useNavigate } from 'react-router-dom'
import AdminShell from '../../layouts/AdminShell'
import { type CourseSummary, type CourseStatus, type CatalogStats, type CourseTrainer } from '../../types/adminCourse'
import CourseDetailModal, { COURSE_DETAIL_MODAL_CSS } from '../../components/admin/CourseDetailModal'
import SetPriceModal, { SET_PRICE_MODAL_CSS } from '../../components/admin/SetPriceModal'
import ArchiveCourseModal, { ARCHIVE_COURSE_MODAL_CSS } from '../../components/admin/ArchiveCourseModal'
import DeleteCourseModal, { DELETE_COURSE_MODAL_CSS } from '../../components/admin/DeleteCourseModal'
import AssignTrainerModal, { ASSIGN_TRAINER_MODAL_CSS } from '../../components/admin/AssignTrainerModal'

// ─── Mock data ─────────────────────────────────────────────────────────────

// TODO: swap for adminCoursesAPI.listCourses() once GET /api/v1/admin/courses/
// exists. Shape is kept API-ready so the swap is a drop-in replacement.
//const navigate = useNavigate()

const MOCK_COURSES: CourseSummary[] = [
  {
    id: 'c1',
    title: 'Introductory Course Video',
    subtitle: 'Welcome video · updated 1 week ago',
    category: 'Onboarding',
    trainer: { id: 't1', name: 'Enobong Okposin', role: 'Lead Trainer · Leadership', avatar_color: '#059669' },
    price: null,
    status: 'published',
    enrolled: 980,
    revenue: 0,
    updated_at: '1 week ago',
  },
  {
    id: 'c2',
    title: 'Project management Course',
    subtitle: 'Leadership · updated 1 week ago',
    category: 'Leadership',
    trainer: { id: 't1', name: 'Enobong Okposin', role: 'Lead Trainer · Leadership', avatar_color: '#059669' },
    price: 49999,
    status: 'published',
    enrolled: 980,
    revenue: 73_500_000,
    updated_at: '1 week ago',
  },
]

// Note: the stat cards below come from a separate mock summary object, so they
// currently show 12 total / 7 published / 3 draft / ₦369.0M — while the table
// only has these 2 seeded rows ("Showing 2 of 2"). That mismatch is in the
// original design too; worth deciding whether the cards should be derived
// from the actual course list once real data is wired in.
const MOCK_STATS: CatalogStats = {
  total_courses: 12,
  published: 7,
  draft: 3,
  total_revenue: 369_000_000,
}

// ─── Styles ────────────────────────────────────────────────────────────────

const PAGE_CSS = `
  .cc-page { padding: 1.5rem 2rem 2rem; background: #F5F5F5; }

  .cc-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem; }
  .cc-title { margin: 0; font-size: 1.75rem; font-weight: 800; color: #111827; }
  .cc-subtitle { margin: 0.25rem 0 0; color: #6B7280; font-size: 0.9rem; }
  .cc-create-btn { display: flex; align-items: center; gap: 0.5rem; background: #2563EB; color: #fff; border: none; border-radius: 0.7rem; padding: 0.7rem 1.2rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; }

  .cc-stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
  .cc-stat-card { background: #fff; border-radius: 1rem; padding: 1.25rem; display: flex; align-items: center; gap: 0.9rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); }
  .cc-stat-icon { width: 44px; height: 44px; border-radius: 0.75rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cc-stat-value { margin: 0; font-size: 1.5rem; font-weight: 800; color: #111827; }
  .cc-stat-label { margin: 0.15rem 0 0; font-size: 0.82rem; color: #9CA3AF; }

  .cc-panel { background: #fff; border-radius: 1rem; box-shadow: 0 16px 48px rgba(15, 23, 42, 0.05); border: 1px solid rgba(148, 163, 184, 0.12); overflow: hidden; }

  .cc-toolbar { display: flex; align-items: center; gap: 0.75rem; padding: 1.1rem 1.25rem; flex-wrap: wrap; }
  .cc-status-tabs { display: flex; gap: 0.4rem; background: #F9FAFB; border-radius: 0.75rem; padding: 0.3rem; }
  .cc-status-tab { border: none; background: none; color: #6B7280; font-weight: 700; font-size: 0.85rem; padding: 0.55rem 1.1rem; border-radius: 0.6rem; cursor: pointer; white-space: nowrap; }
  .cc-status-tab.active { background: #2563EB; color: #fff; }
  .cc-search-wrap { flex: 1; min-width: 220px; display: flex; align-items: center; gap: 0.5rem; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 0.75rem; padding: 0.6rem 1rem; }
  .cc-search-wrap input { flex: 1; background: none; border: none; outline: none; font-size: 0.875rem; color: #111; }
  .cc-search-wrap input::placeholder { color: #9CA3AF; }

  .cc-table-wrap { overflow-x: auto; }
  .cc-table { width: 100%; border-collapse: collapse; min-width: 900px; }
  .cc-table th { text-align: left; font-size: 0.72rem; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.03em; padding: 0.75rem 1.25rem; border-top: 1px solid #F3F4F6; border-bottom: 1px solid #F3F4F6; background: #FAFAFA; }
  .cc-table td { padding: 0.9rem 1.25rem; border-bottom: 1px solid #F3F4F6; font-size: 0.875rem; color: #111827; vertical-align: middle; }
  .cc-table tr:last-child td { border-bottom: none; }

  .cc-course-cell { display: flex; align-items: center; gap: 0.7rem; }
  .cc-course-icon { width: 38px; height: 38px; border-radius: 0.6rem; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cc-course-title { font-weight: 600; color: #111827; white-space: nowrap; }
  .cc-course-sub { font-size: 0.75rem; color: #9CA3AF; }

  .cc-trainer-cell { display: flex; align-items: center; gap: 0.55rem; }
  .cc-trainer-avatar { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-weight: 700; font-size: 0.68rem; flex-shrink: 0; }

  .cc-status-badge { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.78rem; font-weight: 700; padding: 0.3rem 0.65rem; border-radius: 999px; white-space: nowrap; }
  .cc-status-dot { width: 6px; height: 6px; border-radius: 50%; }
  .cc-status-badge.published { background: #ECFDF5; color: #059669; }
  .cc-status-badge.published .cc-status-dot { background: #059669; }
  .cc-status-badge.draft { background: #FEF3C7; color: #D97706; }
  .cc-status-badge.draft .cc-status-dot { background: #D97706; }
  .cc-status-badge.archived { background: #F3F4F6; color: #6B7280; }
  .cc-status-badge.archived .cc-status-dot { background: #9CA3AF; }

  .cc-row-menu-wrap { position: relative; text-align: right; }
  .cc-row-menu-btn { border: none; background: none; cursor: pointer; color: #9CA3AF; padding: 0.4rem; border-radius: 0.5rem; display: inline-flex; }
  .cc-row-menu-btn:hover { background: #F3F4F6; color: #374151; }
  .cc-row-menu { position: absolute; top: calc(100% + 0.3rem); right: 1.25rem; background: #fff; border: 1px solid #E5E7EB; border-radius: 0.75rem; box-shadow: 0 8px 24px rgba(0,0,0,0.1); width: 190px; padding: 0.4rem; z-index: 50; text-align: left; }
  .cc-row-menu-item { display: flex; align-items: center; gap: 0.6rem; width: 100%; padding: 0.6rem 0.7rem; border-radius: 0.55rem; border: none; background: none; font-size: 0.85rem; font-weight: 500; color: #374151; cursor: pointer; text-align: left; }
  .cc-row-menu-item:hover { background: #F9FAFB; }
  .cc-row-menu-item.danger { color: #DC2626; }
  .cc-row-menu-item.danger:hover { background: #FEF2F2; }
  .cc-row-menu-divider { height: 1px; background: #F3F4F6; margin: 0.3rem 0.2rem; }

  .cc-footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; flex-wrap: wrap; }
  .cc-footer-text { font-size: 0.82rem; color: #6B7280; }
  .cc-page-pill { width: 30px; height: 30px; border-radius: 0.5rem; background: #2563EB; color: #fff; font-weight: 700; font-size: 0.82rem; display: flex; align-items: center; justify-content: center; }

  .cc-empty { padding: 3rem 1.25rem; text-align: center; color: #9CA3AF; font-size: 0.9rem; }

  @media (max-width: 900px) {
    .cc-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }
  @media (max-width: 640px) {
    .cc-page { padding: 1.25rem; }
    .cc-toolbar { flex-direction: column; align-items: stretch; }
    .cc-status-tabs { overflow-x: auto; }
  }
`

// ─── Helpers ───────────────────────────────────────────────────────────────

//function handleCreateCourse() {
 // navigate('/admin/courses/new')

//}
function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}

function formatMoney(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`
  return n === 0 ? 'Nil' : `₦${n}`
}

const STATUS_TABS: { key: 'all' | CourseStatus; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft',     label: 'Draft' },
  { key: 'archived',  label: 'Archived' },
]

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>(MOCK_COURSES)
  const [statusFilter, setStatusFilter] = useState<'all' | CourseStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const [viewingCourse, setViewingCourse] = useState<CourseSummary | null>(null)
  const [pricingCourse, setPricingCourse] = useState<CourseSummary | null>(null)
  const [assigningCourse, setAssigningCourse] = useState<CourseSummary | null>(null)
  const [archivingCourse, setArchivingCourse] = useState<CourseSummary | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<CourseSummary | null>(null)

  const filteredCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return courses.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter
      const matchesSearch = !q || c.title.toLowerCase().includes(q) || c.trainer.name.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [courses, statusFilter, searchQuery])

  function toggleRowMenu(id: string) {
    setOpenMenuId((prev) => (prev === id ? null : id))
  }

  function handleViewCourse(course: CourseSummary) {
    setOpenMenuId(null)
    setViewingCourse(course)
  }

  function handleSetPrice(course: CourseSummary) {
    setOpenMenuId(null)
    setPricingCourse(course)
  }

  function handleAssignTrainer(course: CourseSummary) {
    setOpenMenuId(null)
    setAssigningCourse(course)
  }

  function handleArchive(course: CourseSummary) {
    setOpenMenuId(null)
    setArchivingCourse(course)
  }

  function handleDelete(course: CourseSummary) {
    setOpenMenuId(null)
    setDeletingCourse(course)
  }

  function applyPriceChange(courseId: string, newPrice: number | null) {
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, price: newPrice } : c)))
  }

  function applyTrainerChange(courseId: string, trainer: CourseTrainer) {
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, trainer } : c)))
  }

  function applyArchive(courseId: string) {
    // TODO: call adminCoursesAPI.setCourseStatus(courseId, 'archived') once the endpoint exists
    setCourses((prev) => prev.map((c) => (c.id === courseId ? { ...c, status: 'archived' } : c)))
  }

  function applyDelete(courseId: string) {
    // TODO: call adminCoursesAPI.deleteCourse(courseId) once the endpoint exists
    setCourses((prev) => prev.filter((c) => c.id !== courseId))
  }

  function handleCreateCourse() {
    // TODO: open create-course flow — out of scope for now
    console.log('Create course clicked')
  }

  return (
    <AdminShell>
      <style>
        {PAGE_CSS + COURSE_DETAIL_MODAL_CSS + SET_PRICE_MODAL_CSS
          + ARCHIVE_COURSE_MODAL_CSS + DELETE_COURSE_MODAL_CSS + ASSIGN_TRAINER_MODAL_CSS}
      </style>
      <div className="cc-page">

        <div className="cc-header">
          <div>
            <h1 className="cc-title">Course Catalog</h1>
            <p className="cc-subtitle">{courses.length} Course{courses.length === 1 ? '' : 's'} / 1 Category</p>
          </div>
          <button className="cc-create-btn" type="button" onClick={handleCreateCourse}>
            <Plus size={17} /> Create course
          </button>
        </div>

        <div className="cc-stats-grid">
          <div className="cc-stat-card">
            <div className="cc-stat-icon" style={{ background: '#DBEAFE' }}><Layers size={20} color="#2563EB" /></div>
            <div>
              <p className="cc-stat-value">{MOCK_STATS.total_courses}</p>
              <p className="cc-stat-label">Total courses</p>
            </div>
          </div>
          <div className="cc-stat-card">
            <div className="cc-stat-icon" style={{ background: '#D1FAE5' }}><Globe size={20} color="#059669" /></div>
            <div>
              <p className="cc-stat-value">{MOCK_STATS.published}</p>
              <p className="cc-stat-label">Published</p>
            </div>
          </div>
          <div className="cc-stat-card">
            <div className="cc-stat-icon" style={{ background: '#FEF3C7' }}><Pencil size={20} color="#D97706" /></div>
            <div>
              <p className="cc-stat-value">{MOCK_STATS.draft}</p>
              <p className="cc-stat-label">Draft</p>
            </div>
          </div>
          <div className="cc-stat-card">
            <div className="cc-stat-icon" style={{ background: '#EDE9FE' }}><TrendingUp size={20} color="#7C3AED" /></div>
            <div>
              <p className="cc-stat-value">{formatMoney(MOCK_STATS.total_revenue)}</p>
              <p className="cc-stat-label">Total revenue</p>
            </div>
          </div>
        </div>

        <div className="cc-panel">
          <div className="cc-toolbar">
            <div className="cc-status-tabs">
              {STATUS_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`cc-status-tab${statusFilter === tab.key ? ' active' : ''}`}
                  onClick={() => setStatusFilter(tab.key)}
                  type="button"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="cc-search-wrap">
              <Search size={16} color="#9CA3AF" />
              <input
                type="text"
                placeholder="Search courses or trainers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" disabled />
                  </th>
                  <th>Course</th>
                  <th>Trainer</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Enrolled</th>
                  <th>Revenue</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((course) => (
                  <tr key={course.id}>
                    <td>
                      <input type="checkbox" />
                    </td>
                    <td>
                      <div className="cc-course-cell">
                        <div className="cc-course-icon">
                          <Layers size={18} />
                        </div>
                        <div>
                          <div className="cc-course-title">{course.title}</div>
                          <div className="cc-course-sub">{course.subtitle}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cc-trainer-cell">
                        <div className="cc-trainer-avatar" style={{ background: course.trainer.avatar_color }}>
                          {initials(course.trainer.name)}
                        </div>
                        {course.trainer.name}
                      </div>
                    </td>
                    <td>{course.price == null ? 'Free' : `₦${course.price.toLocaleString()}`}</td>
                    <td>
                      <span className={`cc-status-badge ${course.status}`}>
                        <span className="cc-status-dot" />
                        {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                      </span>
                    </td>
                    <td>{course.enrolled}</td>
                    <td>{formatMoney(course.revenue)}</td>
                    <td>
                      <div className="cc-row-menu-wrap">
                        <button
                          className="cc-row-menu-btn"
                          onClick={() => toggleRowMenu(course.id)}
                          aria-label="Row actions"
                          aria-haspopup="true"
                          aria-expanded={openMenuId === course.id}
                          type="button"
                        >
                          <MoreVertical size={17} />
                        </button>
                        {openMenuId === course.id && (
                          <div className="cc-row-menu" role="menu">
                            <button className="cc-row-menu-item" onClick={() => handleViewCourse(course)} type="button">
                              <Eye size={15} /> View course
                            </button>
                            <button className="cc-row-menu-item" onClick={() => handleSetPrice(course)} type="button">
                              <Tag size={15} /> Set price
                            </button>
                            <button className="cc-row-menu-item" onClick={() => handleAssignTrainer(course)} type="button">
                              <UserCog size={15} /> Assign trainer
                            </button>
                            <div className="cc-row-menu-divider" />
                            <button className="cc-row-menu-item" onClick={() => handleArchive(course)} type="button">
                              <Archive size={15} /> Archive
                            </button>
                            <button className="cc-row-menu-item danger" onClick={() => handleDelete(course)} type="button">
                              <Trash2 size={15} /> Delete course
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredCourses.length === 0 && (
              <div className="cc-empty">No courses match your filters.</div>
            )}
          </div>

          <div className="cc-footer">
            <span className="cc-footer-text">
              Showing {filteredCourses.length} of {courses.length} courses
            </span>
            <span className="cc-page-pill">1</span>
          </div>
        </div>
      </div>

      {viewingCourse && (
        <CourseDetailModal
          course={viewingCourse}
          onClose={() => setViewingCourse(null)}
          onEdit={() => console.log('Edit course', viewingCourse.id)}
          onSetPrice={() => { setPricingCourse(viewingCourse); setViewingCourse(null) }}
          onArchive={() => { setArchivingCourse(viewingCourse); setViewingCourse(null) }}
          onDelete={() => { setDeletingCourse(viewingCourse); setViewingCourse(null) }}
        />
      )}

      {pricingCourse && (
        <SetPriceModal
          course={pricingCourse}
          onClose={() => setPricingCourse(null)}
          onConfirm={(newPrice) => {
            applyPriceChange(pricingCourse.id, newPrice)
            setPricingCourse(null)
          }}
        />
      )}

      {assigningCourse && (
        <AssignTrainerModal
          course={assigningCourse}
          onClose={() => setAssigningCourse(null)}
          onConfirm={(trainer) => {
            applyTrainerChange(assigningCourse.id, trainer)
            setAssigningCourse(null)
          }}
        />
      )}

      {archivingCourse && (
        <ArchiveCourseModal
          course={archivingCourse}
          onClose={() => setArchivingCourse(null)}
          onConfirm={() => {
            applyArchive(archivingCourse.id)
            setArchivingCourse(null)
          }}
        />
      )}

      {deletingCourse && (
        <DeleteCourseModal
          course={deletingCourse}
          onClose={() => setDeletingCourse(null)}
          onConfirm={() => {
            applyDelete(deletingCourse.id)
            setDeletingCourse(null)
          }}
        />
      )}
    </AdminShell>
  )
}