import { useMemo } from 'react'
import Particles from '@tsparticles/react'

export function ParticleField() {
  const options = useMemo(() => ({
    fullScreen: { enable: false },
    background: { color: { value: 'transparent' } },
    fpsLimit: 45,
    detectRetina: false,
    particles: {
      number: { value: 52, density: { enable: true, area: 1120 } },
      color: { value: ['#ff4f9a', '#ff92bf', '#b84b86'] },
      links: { enable: true, color: '#f85b9e', distance: 145, opacity: 0.18, width: 0.7 },
      move: { enable: true, speed: 0.38, direction: 'none', outModes: { default: 'bounce' }, attract: { enable: false } },
      opacity: { value: { min: 0.15, max: 0.65 } },
      size: { value: { min: 1, max: 2.4 } },
    },
    interactivity: { detectsOn: 'window', events: { onHover: { enable: false }, resize: true } },
  }), [])

  return <Particles id="portfolio-particles" className="particle-field" options={options} />
}
