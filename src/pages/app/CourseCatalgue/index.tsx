import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RouteBuilder } from '../../../constants/routes'

interface Course {
  id: number
  tag: string
  title: string
  type: 'video' | 'course'
  thumbnail: string | null
  instructor?: string
}

const MOCK_COURSES: Course[] = [
  { id: 1, tag: 'PROJECT MANAGEMENT', title: 'Introductory Video', type: 'video', thumbnail: '/imagee2.png' },
  { id: 2, tag: 'COURSE', title: 'Project Management Course', instructor: 'Enobong Okposin', type: 'course', thumbnail: '/intro.png' },
]

export default function CourseCatalogPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState<string>('')

  const filtered = MOCK_COURSES.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.tag.toLowerCase().includes(search.toLowerCase()) ||
    (c.instructor && c.instructor.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        .catalog-page { min-height: 100vh; background: var(--grey, #F5F5F5); padding: 2.5rem 1.5rem 4rem; font-family: inherit; display: flex; flex-direction: column; align-items: center; }
        .catalog-logo { margin-bottom: 2rem; }
        .catalog-logo img { height: 2.75rem; display: block; margin: 0 auto; }
        .catalog-card { background: var(--white, #fff); border: 1px solid #E8E8E8; border-radius: 1.25rem; padding: 2.25rem 2.5rem 2.5rem; width: 100%; max-width: 820px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
        .catalog-card h1 { font-size: 1.75rem; font-weight: 700; color: var(--black, #111); margin: 0 0 1.25rem 0; }
        .back-btn { display: flex; align-items: center; gap: 0.375rem; background: none; border: none; cursor: pointer; color: #6B7280; font-size: 0.875rem; font-weight: 500; padding: 0; margin-bottom: 1.25rem; transition: color 0.15s; }
        .back-btn:hover { color: var(--primary-500, #2563EB); }
        .catalog-search-wrap { position: relative; margin-bottom: 2rem; }
        .catalog-search-wrap svg { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #ABABAB; pointer-events: none; }
        .catalog-search { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border: 1px solid #E8E8E8; border-radius: 0.625rem; background: #FAFAFA; font-size: 0.9375rem; color: var(--black, #111); outline: none; transition: border-color 0.2s; }
        .catalog-search::placeholder { color: #ABABAB; }
        .catalog-search:focus { border-color: var(--primary-500, #2563EB); background: #fff; }
        .catalog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1.25rem; }
        .course-card { border: 1px solid #EFEFEF; border-radius: 0.875rem; overflow: hidden; background: #fff; text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: box-shadow 0.2s, transform 0.2s; cursor: pointer; }
        .course-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09); transform: translateY(-2px); }
        .course-thumb { width: 100%; aspect-ratio: 16/9; background: #D0D0D0; position: relative; overflow: hidden; }
        .course-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .course-thumb-placeholder { width: 100%; height: 100%; background: linear-gradient(135deg, #c8c8c8 0%, #a0a0a0 100%); }
        .play-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; }
        .play-btn { width: 2.75rem; height: 2.75rem; border-radius: 50%; background: rgba(255,255,255,0.92); display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.18); }
        .play-btn svg { color: #111; margin-left: 2px; }
        .course-body { padding: 0.875rem 1rem 1rem; display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
        .course-tag { font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.06em; color: var(--primary-500, #2563EB); text-transform: uppercase; margin: 0; }
        .course-title { font-size: 0.9375rem; font-weight: 700; color: var(--black, #111); margin: 0; line-height: 1.35; }
        .course-instructor { font-size: 0.8125rem; color: #999; margin: 0; }
        .catalog-empty { text-align: center; padding: 3rem 1rem; color: #ABABAB; font-size: 0.9375rem; }
        .catalog-footer { margin-top: 2.5rem; font-size: 0.875rem; color: #ABABAB; text-align: center; }
        @media (max-width: 600px) { .catalog-card { padding: 1.5rem 1rem 1.75rem; } .catalog-card h1 { font-size: 1.375rem; } .catalog-grid { grid-template-columns: 1fr 1fr; gap: 0.875rem; } }
        @media (max-width: 400px) { .catalog-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="catalog-page">
        <div className="catalog-logo">
          <img src="/Logo.png" alt="The Global Project Leaders" />
        </div>

        <div className="catalog-card">
          <button className="back-btn" onClick={() => navigate(RouteBuilder.dashboard())}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15,18 9,12 15,6" />
            </svg>
            Back to Dashboard
          </button>

          <h1>Course Overview</h1>

          <div className="catalog-search-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="catalog-search"
              type="text"
              placeholder="Search topics..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <div className="catalog-empty">No courses match your search.</div>
          ) : (
            <div className="catalog-grid">
              {filtered.map((course) => (
                <Link
                  key={course.id}
                  className="course-card"
                  to={course.type === 'video' ? `/courses/${course.id}/preview` : RouteBuilder.course(course.id)}
                >
                  <div className="course-thumb">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} />
                    ) : (
                      <div className="course-thumb-placeholder" />
                    )}
                    {course.type === 'video' && (
                      <div className="play-overlay">
                        <div className="play-btn">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5,3 19,12 5,21"/>
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="course-body">
                    <p className="course-tag">{course.tag}</p>
                    <p className="course-title">{course.title}</p>
                    {course.instructor && <p className="course-instructor">{course.instructor}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <p className="catalog-footer">Join 50,000+ learners building their project management careers</p>
      </div>
    </>
  )
}