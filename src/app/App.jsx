import { useEffect, useState } from 'react'
import { PortfolioShell } from '../widgets/app-shell/ui/AppShell.jsx'
import { HomePage } from '../pages/home/ui/HomePage.jsx'
import { projects } from '../entities/project/model/projects.js'

export default function App() {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = 'dark-pink'
  }, [])

  return (
    <PortfolioShell particlesPaused={isProjectModalOpen}>
      <HomePage projects={projects} onProjectModalChange={setIsProjectModalOpen} />
    </PortfolioShell>
  )
}
