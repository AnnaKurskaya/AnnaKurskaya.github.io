const formatValue = (value) => {
  if (typeof value === 'boolean') return value ? 'да' : 'нет'
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : `${Math.round(value * 100)}%`
  return String(value)
}

const getAnswerLabel = (question, value) => question.options.find((option) => Object.is(option.value, value))?.label ?? formatValue(value)

function AnswerList({ result }) {
  const { session } = result

  return (
    <div className="result-answer-columns">
      <div>
        <h4>Профиль пользователя</h4>
        <dl className="result-answer-list">
          {result.questions.filter(({ target }) => target.type === 'parameter').map((question) => {
            const value = session.answers[question.target.id]
            return <div key={question.id}><dt>{question.prompt}</dt><dd>{getAnswerLabel(question, value)}</dd></div>
          })}
        </dl>
      </div>
      <div>
        <h4>Характеристики уровня</h4>
        <dl className="result-answer-list">
          {result.questions.filter(({ target }) => target.type === 'levelFact').map((question) => {
            const value = session.levelFacts[question.target.id]
            return <div key={question.id}><dt>{question.prompt}</dt><dd>{getAnswerLabel(question, value)}</dd></div>
          })}
        </dl>
      </div>
    </div>
  )
}

function StrategyDetails({ item }) {
  return (
    <details className="result-strategy" open={item.rank === 1}>
      <summary>
        <span className="result-rank">{String(item.rank).padStart(2, '0')}</span>
        <strong>{item.title}</strong>
        <b>{item.score.toFixed(2)}</b>
      </summary>
      <div className="result-strategy-body">
        <div className="result-explanation-block">
          <h4>Почему эта стратегия получила оценку</h4>
          <ul>{item.explanation.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </div>
        <div className="result-contribution-block">
          <h4>Совпадения параметров</h4>
          <div className="result-contributions">
            {item.contributions.map((contribution) => <div className="result-contribution" key={contribution.label}><span>{contribution.label}</span><i><em style={{ width: `${contribution.match * 100}%` }} /></i><b>{Math.round(contribution.match * 100)}%</b></div>)}
          </div>
        </div>
        {item.matchedRules.length ? (
          <div className="result-rules-block">
            <h4>Сработавшие правила</h4>
            <ul className="result-rule-list">{item.matchedRules.map((rule) => <li key={`${rule.ruleId}-${rule.type}`}><span className={rule.type === 'penalty' ? 'is-penalty' : 'is-bonus'}>{rule.type === 'penalty' ? '−' : '+'}{Math.round(Math.abs(rule.value) * 100)}%</span><div><strong>{rule.title}</strong><small>{rule.reason}</small></div></li>)}</ul>
          </div>
        ) : <p className="result-no-rules">Для этой стратегии отдельные правила не сработали.</p>}
      </div>
    </details>
  )
}

export function InferenceResultPanel({ result, questions, onEdit, onRestart }) {
  const bestStrategy = result.ranking[0]

  return (
    <div className="inference-result" aria-live="polite">
      <div className="result-hero">
        <div>
          <p className="detail-kicker">RESULT / RECOMMENDATION</p>
          <h3>{bestStrategy.title}</h3>
          <p>Лучшая стратегия по текущему профилю и характеристикам уровня.</p>
          <ul className="result-hero-reasons">{bestStrategy.explanation.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        </div>
        <div className="result-score"><strong>{bestStrategy.score.toFixed(2)}</strong><span>итоговый балл</span></div>
      </div>

      <div className="result-meta"><span>Активных правил: <b>{result.activeRules.length}</b></span><span>Стратегий в рейтинге: <b>{result.ranking.length}</b></span><span>Расчёт: <b>детерминированный</b></span></div>

      <section className="result-section" aria-labelledby="full-ranking-title">
        <div className="result-section-heading"><div><p className="detail-kicker">FULL RANKING</p><h4 id="full-ranking-title">Все стратегии</h4></div><span>Нажмите на строку, чтобы раскрыть детали</span></div>
        <div className="result-strategy-list">{result.ranking.map((item) => <StrategyDetails item={item} key={item.strategyId} />)}</div>
      </section>

      <section className="result-section" aria-labelledby="answers-title">
        <div className="result-section-heading"><div><p className="detail-kicker">INPUT SNAPSHOT</p><h4 id="answers-title">Исходные ответы</h4></div><span>Данные, на которых построен рейтинг</span></div>
        <AnswerList result={{ ...result, questions }} />
      </section>

      <div className="result-actions"><button className="questionnaire-secondary" type="button" onClick={onEdit}>Изменить ответы</button><button className="questionnaire-primary" type="button" onClick={onRestart}>Пройти заново</button></div>
    </div>
  )
}
