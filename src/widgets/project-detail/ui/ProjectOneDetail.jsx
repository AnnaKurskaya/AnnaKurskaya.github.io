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
const userParams = knowledgeBase.parameters.map(({ label }) => label)
const strategies = knowledgeBase.strategies.map(({ title }) => title)

function FlowArrow() {
  return <span className="flow-arrow" aria-hidden="true"><span /><span /><span /></span>
}

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
          <p className="detail-kicker">PROJECT 01 · ОИС</p>
          <h1 id="project-one-title">Экспертная система выбора стратегии в Homescapes</h1>
          <p className="detail-lead">Интерактивная система собирает профиль игрока и характеристики уровня, а затем объяснимо ранжирует тактики прохождения — от подходящих бустеров до порядка очистки поля.</p>
        </div>
        <div className="detail-badge" aria-label="Формат проекта"><span>JS</span><small>knowledge<br />system</small></div>
      </div>

      <div className="detail-stats" aria-label="Масштаб системы">
        {projectStats.map(([value, label]) => <div className="detail-stat" key={label}><strong>{value}</strong><span>{label}</span></div>)}
      </div>

      {!isSystemStarted ? (
        <section className="project-launch" aria-labelledby="project-launch-title">
          <div><p className="detail-kicker">START / EXPERT SYSTEM</p><h2 id="project-launch-title">Готовы проверить стратегию?</h2><p>Запустите интерактивный сценарий: 20 ответов заполнят рабочую БД, после чего система рассчитает полный объяснимый рейтинг.</p></div>
          <button className="questionnaire-primary project-launch-button" type="button" onClick={() => setIsSystemStarted(true)}>Запустить экспертную систему <span>→</span></button>
        </section>
      ) : <QuestionnairePanel workingDatabase={workingDatabase} session={session} onSessionChange={setSession} />}

      <div className="detail-section detail-architecture">
        <div className="section-heading"><p className="detail-kicker">01 / ARCHITECTURE</p><h2>Как работает система</h2><p>Каждый ответ превращается в данные, данные — в оценку, а оценка — в понятный список рекомендаций.</p></div>
        <div className="flow-diagram" aria-label="Схема работы экспертной системы">
          <div className="flow-node flow-node-accent"><span className="flow-index">01</span><strong>Игрок</strong><small>отвечает на вопросы</small></div><FlowArrow />
          <div className="flow-node"><span className="flow-index">02</span><strong>Рабочая БД</strong><small>профиль и уровень</small></div><FlowArrow />
          <div className="flow-node"><span className="flow-index">03</span><strong>Механизм вывода</strong><small>правила и веса</small></div><FlowArrow />
          <div className="flow-node flow-node-accent"><span className="flow-index">04</span><strong>Результат</strong><small>рейтинг стратегий</small></div>
        </div>
      </div>

      <div className="detail-grid">
        <article className="detail-panel"><p className="detail-kicker">02 / INPUT</p><h3>Профиль игрока</h3><p>Система задаёт последовательность вопросов и сохраняет ответы в рабочей базе данных.</p><div className="tag-cloud">{userParams.map((param) => <span key={param}>{param}</span>)}</div></article>
        <article className="detail-panel"><p className="detail-kicker">03 / KNOWLEDGE BASE</p><h3>База знаний</h3><p>В ней хранятся объекты ранжирования, их свойства и экспертные правила предметной области.</p><div className="knowledge-graph" aria-label="Связи в базе знаний"><div className="graph-node graph-node-main">Уровень</div><div className="graph-link graph-link-one" /><div className="graph-link graph-link-two" /><div className="graph-node graph-node-small graph-node-top">Цели</div><div className="graph-node graph-node-small graph-node-bottom">Препятствия</div><div className="graph-node graph-node-small graph-node-right">Стратегии</div></div></article>
      </div>

      <KnowledgeBaseInspector />
      <WorkingDatabaseInspector workingDatabase={workingDatabase} session={session} onSessionChange={setSession} />

      <div className="detail-section ranking-section">
        <div className="section-heading"><p className="detail-kicker">04 / INFERENCE</p><h2>Ранжирование кандидатов</h2><p>Для каждого объекта вычисляется совместимость с профилем: совпадения усиливают оценку, противопоказания уменьшают её.</p></div>
        <div className="formula-card"><span className="formula-label">Итоговая оценка</span><strong>Score(strategy) = Σ&nbsp; weightᵢ × matchᵢ − penalty</strong><span className="formula-note">где matchᵢ — степень соответствия параметру, а weightᵢ — его важность</span></div>
        {session.finalRanking.length ? (
          <div className="ranking-list" aria-label="Рассчитанный рейтинг стратегий">{session.finalRanking.slice(0, 5).map((item) => <div className="ranking-row" key={item.strategyId}><span className="ranking-place">{String(item.rank).padStart(2, '0')}</span><span className="ranking-name" title={item.title}>{item.title}</span><span className="ranking-bar"><i style={{ '--score': `${item.score}%` }} /></span><strong>{item.score.toFixed(2)}</strong></div>)}</div>
        ) : <div className="ranking-empty">Заполните профиль и подтвердите ответы — здесь появится рейтинг, рассчитанный механизмом вывода.</div>}
      </div>

      <div className="detail-section strategy-section">
        <div className="section-heading"><p className="detail-kicker">05 / OUTPUT</p><h2>Что система умеет рекомендовать</h2><p>В учебной версии предусмотрен набор из 20 объектов — это не готовый совет, а прозрачный список кандидатов с итоговыми баллами.</p></div>
        <ol className="strategy-list">{strategies.map((strategy, index) => <li key={strategy}><span>{String(index + 1).padStart(2, '0')}</span>{strategy}</li>)}</ol>
      </div>

      <div className="detail-footer-grid">
        <article className="detail-panel detail-panel-wide"><p className="detail-kicker">06 / IMPLEMENTATION PLAN</p><h3>План реализации</h3><div className="timeline">{['Описать предметную область Homescapes', 'Сформировать автономную базу знаний', 'Собрать интерфейс вопросов и результатов', 'Реализовать правила и взвешенное ранжирование', 'Проверить сценарии и объяснимость ответа'].map((step, index) => <div className="timeline-item" key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></div>)}</div></article>
        <article className="detail-panel detail-panel-note"><p className="detail-kicker">PROJECT NOTE</p><h3>Почему это экспертная система</h3><p>Решение опирается на формализованные знания эксперта, учитывает неполный профиль пользователя и показывает, почему стратегия оказалась выше в рейтинге.</p><a href="#project-1" className="back-to-project">К началу проекта <span>↗</span></a></article>
      </div>
        </section>
      </div>
    </div>
  )
}
