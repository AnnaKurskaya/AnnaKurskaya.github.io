import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { ProjectOneDetail } from '../../../widgets/project-detail/ui/ProjectOneDetail.jsx'

export function HomePage({ projects }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isProjectOneOpen, setIsProjectOneOpen] = useState(false)
  const carouselItems = useMemo(() => [...projects, ...projects, ...projects], [projects])
  const centerIndex = projects.length + activeIndex

  const goTo = useCallback((nextIndex) => {
    setActiveIndex((nextIndex + projects.length) % projects.length)
  }, [projects.length])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft') goTo(activeIndex - 1)
      if (event.key === 'ArrowRight') goTo(activeIndex + 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeIndex, goTo])

  useEffect(() => {
    if (!isProjectOneOpen) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setIsProjectOneOpen(false)
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isProjectOneOpen])

  return (
    <div className="catalog-page">
      <section aria-label="Каталог проектов">
        <header className="catalog-header">
          <p className="owner-name">Anna Kurskaya</p>
        </header>

      <div className="carousel-stage" aria-roledescription="carousel" aria-label="Проекты">
        <div className="carousel-orbit" aria-hidden="true" />
        <div className="carousel-track">
          {carouselItems.map((project, index) => {
            const offset = index - centerIndex
            const isActive = offset === 0
            const isVisible = Math.abs(offset) <= 1
            return (
              <button
                className={`project-card ${isActive ? 'is-active' : ''} ${isVisible ? 'is-visible' : ''}`}
                style={{ '--offset': offset, '--abs-offset': Math.abs(offset) }}
                type="button"
                key={`${project.id}-${index}`}
                onClick={() => {
                  if (!isVisible) return
                  goTo(projects.indexOf(project))
                  if (project.index === '01') setIsProjectOneOpen(true)
                }}
                aria-label={`${project.title}, проект ${project.index}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="card-glow" />
                <span className="card-topline"><span>PROJECT</span><span>{project.index}</span></span>
                <span className="card-number">{project.index}</span>
                <span className="card-title">{project.title}</span>
                <span className="card-description">{project.description}</span>
                <span className="card-bottomline"><span>STAY TUNED</span><span className="card-corner-mark" /></span>
              </button>
            )
          })}
        </div>
      </div>

        <div className="carousel-controls">
          <button className="carousel-arrow" type="button" onClick={() => goTo(activeIndex - 1)} aria-label="Предыдущий проект"><ArrowLeft size={18} /></button>
          <div className="carousel-progress" aria-label={`Проект ${activeIndex + 1} из ${projects.length}`}>
            {projects.map((project, index) => <button className={`progress-dot ${index === activeIndex ? 'is-active' : ''}`} key={project.id} type="button" onClick={() => goTo(index)} aria-label={`Открыть проект ${project.index}`} />)}
          </div>
          <button className="carousel-arrow" type="button" onClick={() => goTo(activeIndex + 1)} aria-label="Следующий проект"><ArrowRight size={18} /></button>
        </div>
      </section>

      {isProjectOneOpen && <ProjectOneDetail onClose={() => setIsProjectOneOpen(false)} />}
    </div>
  )
}
