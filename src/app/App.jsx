import { useEffect } from 'react'
import { PortfolioShell } from '../widgets/app-shell/ui/AppShell.jsx'
import { HomePage } from '../pages/home/ui/HomePage.jsx'
import { projects } from '../entities/project/model/projects.js'

export default function App() {
  useEffect(() => {
    document.documentElement.dataset.theme = 'dark-pink'
  }, [])

  return (
    <PortfolioShell>
      <HomePage projects={projects} />
    </PortfolioShell>
  )
}
