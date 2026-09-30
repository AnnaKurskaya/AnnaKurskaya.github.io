import { useMemo } from 'react'
import { createWorkingDatabase, getMissingLevelFacts, getMissingParameters, userParameters } from '../../../entities/expert-system/index.js'

export function WorkingDatabaseInspector({ workingDatabase, session, onSessionChange }) {
  const fallbackStore = useMemo(() => createWorkingDatabase(), [])
  const store = workingDatabase ?? fallbackStore
  const missingParameters = getMissingParameters(session)
  const missingLevelFacts = getMissingLevelFacts(session)
  const answerCount = Object.keys(session.answers).length
  const levelFactCount = Object.keys(session.levelFacts).length

  return (
    <section className="working-db-inspector" aria-labelledby="working-db-title">
      <div className="working-db-heading">
        <div>
          <p className="detail-kicker">08 / WORKING DATABASE</p>
          <h2 id="working-db-title">Рабочая база текущей сессии</h2>
          <p>Здесь хранятся ответы пользователя, характеристики уровня, промежуточный анализ и итоговый рейтинг механизма вывода.</p>
        </div>
        <button className="working-db-reset" type="button" onClick={() => onSessionChange(store.resetSession())}>Сбросить</button>
      </div>

      <div className="working-db-summary" aria-label="Состояние рабочей базы">
        <div><strong>{answerCount}/{userParameters.length}</strong><span>ответов</span></div>
        <div><strong>{levelFactCount}</strong><span>фактов уровня</span></div>
        <div><strong>{session.intermediateResults.length}</strong><span>промежуточных результатов</span></div>
        <div><strong>{session.finalRanking.length}</strong><span>объектов рейтинга</span></div>
      </div>

      <div className="working-db-state"><span className={`knowledge-status ${session.status === 'ranked' ? 'is-valid' : ''}`}>{session.status === 'idle' ? 'ДАННЫЕ НЕ СОБРАНЫ' : session.status.toUpperCase()}</span><span>{missingParameters.length + missingLevelFacts.length ? `Ожидается ещё ${missingParameters.length + missingLevelFacts.length} полей` : session.status === 'ranked' ? 'Расчёт завершён' : 'Готово к расчёту'}</span></div>

      <div className="working-db-panels">
        <details className="working-db-json"><summary>Ответы пользователя ({answerCount})</summary><pre>{JSON.stringify(session.answers, null, 2)}</pre></details>
        <details className="working-db-json"><summary>Факты текущего уровня ({levelFactCount})</summary><pre>{JSON.stringify(session.levelFacts, null, 2)}</pre></details>
        <details className="working-db-json"><summary>Промежуточные оценки ({session.intermediateResults.length})</summary><pre>{JSON.stringify(session.intermediateResults, null, 2)}</pre></details>
        <details className="working-db-json"><summary>Итоговый рейтинг ({session.finalRanking.length})</summary><pre>{JSON.stringify(session.finalRanking, null, 2)}</pre></details>
      </div>
    </section>
  )
}
