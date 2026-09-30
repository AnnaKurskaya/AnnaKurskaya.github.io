import { useCallback, useEffect, useMemo, useRef } from 'react'
import Particles from '@tsparticles/react'

export function ParticleField({ paused = false }) {
  const containerRef = useRef(null)
  const options = useMemo(() => ({
    fullScreen: { enable: false },
    background: { color: { value: 'transparent' } },
    fpsLimit: 30,
    detectRetina: false,
    particles: {
      number: { value: 112, density: { enable: true, area: 2200 } },
      color: { value: ['#ff4f9a', '#ff92bf', '#b84b86'] },
      links: { enable: true, color: '#f85b9e', distance: 115, opacity: 0.14, width: 0.55 },
      move: { enable: true, speed: 0.3, direction: 'none', outModes: { default: 'bounce' }, attract: { enable: false } },
      opacity: { value: { min: 0.2, max: 0.65 } },
      size: { value: { min: 1.1, max: 2.4 } },
    },
    interactivity: { detectsOn: 'window', events: { onHover: { enable: false }, resize: true } },
  }), [])

  const syncPlayback = useCallback((container = containerRef.current) => {
    if (!container) return
    if (paused || document.hidden) container.pause()
    else container.play()
  }, [paused])

  const onParticlesLoaded = useCallback((container) => {
    containerRef.current = container
    syncPlayback(container)
  }, [syncPlayback])

  useEffect(() => {
    syncPlayback()
    const onVisibilityChange = () => syncPlayback()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [syncPlayback])

  return <Particles id="portfolio-particles" className={`particle-field ${paused ? 'is-paused' : ''}`} options={options} particlesLoaded={onParticlesLoaded} />
}
