import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { createWorkingDatabase, getKnowledgeBase } from '../../../entities/expert-system/index.js'
import { QuestionnairePanel } from '../../../features/expert-system-questionnaire/ui/QuestionnairePanel.jsx'
import { KnowledgeBaseInspector } from './KnowledgeBaseInspector.jsx'
import { WorkingDatabaseInspector } from './WorkingDatabaseInspector.jsx'

const projectStats = [
  ['20+', 'вопросов пользователю'],
  ['12', 'параметров профиля'],
  ['20', 'стратегий прохождения'],
  ['11', 'атрибутов объектов'],
]

const knowledgeBase = getKnowledgeBase()
const strategies = knowledgeBase.strategies.map(({ title }) => title)

export function ProjectOneDetail({ onClose }) {
  const workingDatabase = useMemo(() => createWorkingDatabase(), [])
  const [session, setSession] = useState(() => workingDatabase.getSession())
  const [isSystemStarted, setIsSystemStarted] = useState(false)

  return (
    <div className="project-modal" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="project-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="project-one-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="project-modal-close" type="button" onClick={onClose} aria-label="Закрыть описание проекта"><X size={20} /></button>
        <section className="project-detail" id="project-1">
      <div className="detail-heading">
        <div>
          <p className="detail-kicker">ПРОЕКТ 01 · ОИС</p>
          <h1 id="project-one-title">Экспертная система выбора стратегии в Homescapes</h1>
          <p className="detail-lead">Интерактивная система собирает профиль игрока и характеристики уровня, а затем объяснимо ранжирует тактики прохождения — от подходящих бустеров до порядка очистки поля.</p>
        </div>
      </div>

      <div className="detail-stats" aria-label="Масштаб системы">
        {projectStats.map(([value, label]) => <div className="detail-stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </div>

      <nav className="project-detail-nav" aria-label="Навигация по проекту">
        <a href="#project-launch">Запуск</a>
        <a href="#knowledge-view">База знаний</a>
        <a href="#working-db-view">Рабочая БД</a>
        <a href="#ranking-view">Рейтинг</a>
        <a href="#strategies-view">Стратегии</a>
      </nav>

      {!isSystemStarted ? (
        <section className="project-launch" id="project-launch" aria-labelledby="project-launch-title">
          <div><p className="detail-kicker">01 / ЗАПУСК СИСТЕМЫ</p><h2 id="project-launch-title">Готовы проверить стратегию?</h2><p>Запустите интерактивный сценарий: 20 ответов заполнят рабочую БД, после чего система рассчитает полный объяснимый рейтинг.</p></div>
          <button className="questionnaire-primary project-launch-button" type="button" onClick={() => setIsSystemStarted(true)}>Запустить экспертную систему <span>→</span></button>
        </section>
      ) : <QuestionnairePanel workingDatabase={workingDatabase} session={session} onSessionChange={setSession} />}

      <KnowledgeBaseInspector id="knowledge-view" />
      <WorkingDatabaseInspector id="working-db-view" workingDatabase={workingDatabase} session={session} onSessionChange={setSession} />

      <div className="detail-section ranking-section" id="ranking-view">
        <div className="section-heading"><p className="detail-kicker">05 / РАНЖИРОВАНИЕ</p><h2>Ранжирование кандидатов</h2><p>Для каждого объекта вычисляется совместимость с профилем: совпадения усиливают оценку, противопоказания уменьшают её.</p></div>
        <div className="formula-card"><span className="formula-label">Итоговая оценка</span><strong>Оценка стратегии = Σ&nbsp; весᵢ × совпадениеᵢ − штраф</strong><span className="formula-note">где совпадениеᵢ — степень соответствия параметру, а весᵢ — его важность</span></div>
        {session.finalRanking.length ? (
          <div className="ranking-list" aria-label="Рассчитанный рейтинг стратегий">{session.finalRanking.slice(0, 5).map((item) => <div className="ranking-row" key={item.strategyId}><span className="ranking-place">{String(item.rank).padStart(2, '0')}</span><span className="ranking-name" title={item.title}>{item.title}</span><span className="ranking-bar"><i style={{ '--score': `${item.score}%` }} /></span><strong>{item.score.toFixed(2)}</strong></div>)}</div>
        ) : <div className="ranking-empty">Заполните профиль и подтвердите ответы — здесь появится рейтинг, рассчитанный механизмом вывода.</div>}
      </div>

      <div className="detail-section strategy-section" id="strategies-view">
        <div className="section-heading"><p className="detail-kicker">06 / СТРАТЕГИИ</p><h2>Что система умеет рекомендовать</h2><p>В учебной версии предусмотрен набор из 20 объектов — это не готовый совет, а прозрачный список кандидатов с итоговыми баллами.</p></div>
        <ol className="strategy-list">{strategies.map((strategy, index) => <li key={strategy}><span>{String(index + 1).padStart(2, '0')}</span>{strategy}</li>)}</ol>
      </div>

        </section>
      </div>
    </div>
  )
}
