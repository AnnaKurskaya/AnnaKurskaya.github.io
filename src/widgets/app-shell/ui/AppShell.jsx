import { ParticlesProvider } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { ParticleField } from '../../../shared/ui/ParticleField.jsx'

const initParticles = async (engine) => {
  await loadSlim(engine)
}

export function PortfolioShell({ children, particlesPaused = false }) {
  return (
    <ParticlesProvider init={initParticles}>
      <div className={`portfolio-shell ${particlesPaused ? 'is-modal-open' : ''}`}>
        <div className="ambient ambient-one" />
        <div className="ambient ambient-two" />
        <ParticleField paused={particlesPaused} />
        <main className="portfolio-main">{children}</main>
      </div>
    </ParticlesProvider>
  )
}
