import { useMemo } from 'react'
import Particles from '@tsparticles/react'

export function ParticleField() {
  const options = useMemo(() => ({
    fullScreen: { enable: false },
    background: { color: { value: 'transparent' } },
    fpsLimit: 60,
    detectRetina: true,
    particles: {
      number: { value: 78, density: { enable: true, area: 980 } },
      color: { value: ['#ff4f9a', '#ff92bf', '#b84b86'] },
      links: { enable: true, color: '#f85b9e', distance: 170, opacity: 0.24, width: 1 },
      move: { enable: true, speed: 0.5, direction: 'none', outModes: { default: 'bounce' }, attract: { enable: true, rotateX: 600, rotateY: 1200 } },
      opacity: { value: { min: 0.15, max: 0.65 } },
      size: { value: { min: 1, max: 2.4 } },
    },
    interactivity: { detectsOn: 'window', events: { onHover: { enable: true, mode: 'grab' }, resize: true }, modes: { grab: { distance: 190, links: { opacity: 0.38 } } } },
  }), [])

  return <Particles id="portfolio-particles" className="particle-field" options={options} />
}
