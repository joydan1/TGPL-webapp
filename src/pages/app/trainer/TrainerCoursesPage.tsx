// pages/trainer/courses/TrainerCoursesPage.tsx
import { useNavigate } from 'react-router-dom'
import TrainerShell from '../../../layouts/TrainerShell'
import { Plus } from 'lucide-react'
import { ROUTES } from '../../../constants/routes'

type Course = {
  id: string
  title: string
  category: string
  uploadedLabel: string
  image: string
  progress: number
}

const courses: Course[] = [
  {
    id: 'project-management',
    title: 'Project Management Course',
    category: 'Management',
    uploadedLabel: 'Uploaded 2 months ago',
    image: '/image1.png',
    progress: 37,
  },
]

const PAGE_CSS = `
  .courses-page { padding: 1rem; background: #F5F5F5; }
  .courses-title { margin: 0 0 1rem; font-size: 1.15rem; font-weight: 700; color: #111827; }

  .courses-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }

  .course-card { background: #fff; border-radius: 1rem; overflow: hidden; box-shadow: 0 16px 46px rgba(15, 23, 42, 0.06); border: 1px solid rgba(148, 163, 184, 0.12); display: flex; flex-direction: column; }
  .course-card-img { width: 100%; height: 176px; object-fit: cover; background: #E2E8F0; display: block; }
  .course-card-body { padding: 1.1rem; display: grid; gap: 0.4rem; }
  .course-card-cat { margin: 0; font-size: 0.75rem; letter-spacing: 0.1em; text-transform: uppercase; color: #2563EB; font-weight: 700; }
  .course-card-name { margin: 0; font-size: 1.1rem; font-weight: 700; color: #111827; }
  .course-card-date { margin: 0; color: #6B7280; font-size: 0.8rem; }
  .course-card-preview { margin-top: 0.5rem; border: none; background: none; padding: 0; color: #2563EB; font-weight: 700; cursor: pointer; text-align: left; font-size: 0.9rem; }

  .add-course-card { border: 2px dashed #93C5FD; background: #EFF6FF; border-radius: 1rem; min-height: 260px; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
  .add-course-btn { appearance: none; border: none; border-radius: 999px; padding: 0.9rem 1.25rem; background: #2563EB; color: #fff; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.55rem; font-size: 0.9rem; white-space: nowrap; }

  @media (min-width: 640px) {
    .courses-page { padding: 1.5rem; }
    .courses-grid { grid-template-columns: repeat(2, minmax(0, 340px)); }
  }

  @media (min-width: 1024px) {
    .courses-page { padding: 1.5rem 2rem 2rem; }
    .courses-grid { grid-template-columns: repeat(auto-fill, 340px); }
  }
`

export default function TrainerCoursesPage() {
  const navigate = useNavigate()

  return (
    <TrainerShell>
      <style>{PAGE_CSS}</style>
      <div className="courses-page">
        <h3 className="courses-title">Active Course</h3>
        <div className="courses-grid">
          {courses.map((course) => (
            <div key={course.id} className="course-card">
              <img src={course.image} alt={course.title} className="course-card-img" />
              <div className="course-card-body">
                <p className="course-card-cat">{course.category}</p>
                <h4 className="course-card-name">{course.title}</h4>
                <p className="course-card-date">{course.uploadedLabel}</p>
                <button type="button" className="course-card-preview">Preview</button>
              </div>
            </div>
          ))}

          <div className="add-course-card">
            <button
              type="button"
              className="add-course-btn"
              onClick={() => navigate(ROUTES.TRAINER_COURSE_ADD)}
            >
              <Plus size={18} />
              Add Course
            </button>
          </div>
        </div>
      </div>
    </TrainerShell>
  )
}