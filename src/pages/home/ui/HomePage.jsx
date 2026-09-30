import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { ProjectOneDetail } from '../../../widgets/project-detail/ui/ProjectOneDetail.jsx'

function getCircularOffset(index, activeIndex, length) {
  const rawOffset = index - activeIndex
  const halfLength = Math.floor(length / 2)
  if (rawOffset > halfLength) return rawOffset - length
  if (rawOffset < -halfLength) return rawOffset + length
  return rawOffset
}

export function HomePage({ projects, onProjectModalChange }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isProjectOneOpen, setIsProjectOneOpen] = useState(false)
  const previousActiveIndex = useRef(0)

  const goTo = useCallback((nextIndex) => {
    setActiveIndex((nextIndex + projects.length) % projects.length)
  }, [projects.length])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (isProjectOneOpen) return
      if (event.key === 'ArrowLeft') goTo(activeIndex - 1)
      if (event.key === 'ArrowRight') goTo(activeIndex + 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, goTo, isProjectOneOpen])

  useEffect(() => {
    previousActiveIndex.current = activeIndex
  }, [activeIndex])

  useEffect(() => {
    onProjectModalChange?.(isProjectOneOpen)
    if (!isProjectOneOpen) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsProjectOneOpen(false)
    }
    const previousBodyOverflow = document.body.style.overflow
    const previousDocumentOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousDocumentOverflow
      window.removeEventListener('keydown', onKeyDown)
      onProjectModalChange?.(false)
    }
  }, [isProjectOneOpen, onProjectModalChange])

  return (
    <div className="catalog-page">
      <section aria-label="Каталог проектов">
        <header className="catalog-header">
          <p className="owner-name">Anna Kurskaya</p>
        </header>

        <div className="carousel-stage" aria-roledescription="carousel" aria-label="Проекты">
          <div className="carousel-orbit" aria-hidden="true" />
          <div className="carousel-track">
            {projects.map((project, index) => {
              const offset = getCircularOffset(index, activeIndex, projects.length)
              const previousOffset = getCircularOffset(index, previousActiveIndex.current, projects.length)
              const isActive = offset === 0
              const isWrapping = Math.abs(offset - previousOffset) > 1

              return (
                <button
                  className={`project-card ${isActive ? 'is-active' : ''} ${isWrapping ? 'is-wrapping' : ''}`}
                  style={{ '--offset': offset, '--abs-offset': Math.abs(offset), '--previous-offset': previousOffset, '--previous-abs-offset': Math.abs(previousOffset) }}
                  type="button"
                  key={project.id}
                  onClick={() => {
                    goTo(index)
                    if (project.index === '01') setIsProjectOneOpen(true)
                  }}
                  aria-label={`${project.title}, проект ${project.index}`}
                  aria-current={isActive ? 'true' : undefined}
                >
                  <span className="card-glow" />
                  <span className="card-topline"><span>ПРОЕКТ</span><span>{project.index}</span></span>
                  <span className="card-number">{project.index}</span>
                  <span className="card-title">{project.title}</span>
                  <span className="card-description">{project.description}</span>
                  <span className="card-bottomline"><span>СКОРО</span><span className="card-corner-mark" /></span>
                </button>
              )
            })}
          </div>
        </div>

        {projects.length > 1 && <div className="carousel-controls">
          <button className="carousel-arrow" type="button" onClick={() => goTo(activeIndex - 1)} aria-label="Предыдущий проект"><ArrowLeft size={18} /></button>
          <div className="carousel-progress" aria-label={`Проект ${activeIndex + 1} из ${projects.length}`}>
            {projects.map((project, index) => <button className={`progress-dot ${index === activeIndex ? 'is-active' : ''}`} key={project.id} type="button" onClick={() => goTo(index)} aria-label={`Открыть проект ${project.index}`} />)}
          </div>
          <button className="carousel-arrow" type="button" onClick={() => goTo(activeIndex + 1)} aria-label="Следующий проект"><ArrowRight size={18} /></button>
        </div>}
      </section>

      {isProjectOneOpen && <ProjectOneDetail onClose={() => setIsProjectOneOpen(false)} />}
    </div>
  )
}
