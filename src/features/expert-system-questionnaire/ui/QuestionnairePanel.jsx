import { useEffect, useMemo, useState } from 'react'
import { runInference } from '../../../entities/expert-system/model/inference.js'
import { InferenceResultPanel } from '../../expert-system-result/ui/InferenceResultPanel.jsx'
import { questionnaire } from '../model/questions.js'

const getValue = (session, currentQuestion) => {
  const { type, id } = currentQuestion.target
  return type === 'parameter' ? session.answers[id] : session.levelFacts[id]
}

export function QuestionnairePanel({ workingDatabase, session, onSessionChange, onConfirm }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState('')
  const [isConfirmationStep, setIsConfirmationStep] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [inferenceResult, setInferenceResult] = useState(null)
  const currentQuestion = questionnaire[currentIndex]
  const selectedValue = getValue(session, currentQuestion)
  const answeredCount = useMemo(() => questionnaire.filter((item) => getValue(session, item) !== undefined).length, [session])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'ArrowLeft' && currentIndex > 0) {
        event.preventDefault()
        setCurrentIndex((index) => index - 1)
        setError('')
      }
      if (event.key === 'ArrowRight' && selectedValue !== undefined && currentIndex < questionnaire.length - 1) {
        event.preventDefault()
        setCurrentIndex((index) => index + 1)
        setError('')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentIndex, selectedValue])

  useEffect(() => {
    if (session.status === 'idle') {
      setIsConfirmationStep(false)
      setIsSubmitted(false)
      setInferenceResult(null)
    }
  }, [session.status])

  const chooseAnswer = (value) => {
    try {
      const nextSession = currentQuestion.target.type === 'parameter'
        ? workingDatabase.setAnswer(currentQuestion.target.id, value)
        : workingDatabase.setLevelFact(currentQuestion.target.id, value)
      onSessionChange(nextSession)
      setError('')
      setIsSubmitted(false)
      setInferenceResult(null)
    } catch (validationError) {
      setError(validationError.message)
    }
  }

  const goNext = () => {
    if (selectedValue === undefined) {
      setError('Выберите один вариант, чтобы продолжить.')
      return
    }
    if (currentIndex === questionnaire.length - 1) {
      setIsConfirmationStep(true)
      return
    }
    setCurrentIndex((index) => index + 1)
    setError('')
  }

  const goBack = () => {
    if (isConfirmationStep) {
      setIsConfirmationStep(false)
      setIsSubmitted(false)
      setInferenceResult(null)
      return
    }
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1)
      setError('')
    }
  }

  const reset = () => {
    onSessionChange(workingDatabase.resetSession())
    setCurrentIndex(0)
    setIsConfirmationStep(false)
    setIsSubmitted(false)
    setInferenceResult(null)
    setError('')
  }

  const confirm = () => {
    try {
      const result = runInference(session)
      workingDatabase.saveIntermediateResults(result.session.intermediateResults)
      const storedSession = workingDatabase.saveRanking(result.ranking)
      const storedResult = { ...result, session: storedSession }
      onSessionChange(storedSession)
      setInferenceResult(storedResult)
      setIsSubmitted(true)
      setError('')
      onConfirm?.(storedResult)
    } catch (inferenceError) {
      setInferenceResult(null)
      setIsSubmitted(false)
      setError(inferenceError.message)
    }
  }

  return (
    <section className="questionnaire-panel" aria-labelledby="questionnaire-title">
      <div className="questionnaire-heading">
        <div>
          <p className="detail-kicker">02 / ВОПРОСЫ</p>
          <h2 id="questionnaire-title">Профиль уровня</h2>
          <p>Ответьте на вопросы, чтобы заполнить рабочую базу данных. После подтверждения система применит правила и рассчитает рейтинг всех стратегий.</p>
        </div>
        <div className="questionnaire-counter"><strong>{answeredCount}</strong><span>/ {questionnaire.length} заполнено</span></div>
      </div>

      <div className="questionnaire-progress" aria-label={`Заполнено ${answeredCount} из ${questionnaire.length}`}><i style={{ '--progress': `${(answeredCount / questionnaire.length) * 100}%` }} /></div>

      {isConfirmationStep ? (
        <div className="questionnaire-confirmation">
          <span className="confirmation-mark">✓</span>
          <p className="detail-kicker">ПРОВЕРКА ОТВЕТОВ</p>
          <h3>Данные готовы к анализу</h3>
          <p>Все 20 ответов сохранены в рабочей базе. Проверьте профиль или запустите механизм вывода, чтобы получить детерминированный рейтинг.</p>
          {error && <p className="questionnaire-error" role="alert">{error}</p>}
          {isSubmitted && inferenceResult ? <InferenceResultPanel result={inferenceResult} questions={questionnaire} onEdit={() => { setIsSubmitted(false); setInferenceResult(null); setIsConfirmationStep(false); setCurrentIndex(questionnaire.length - 1) }} onRestart={reset} /> : null}
        </div>
      ) : (
        <div className="questionnaire-question" key={currentQuestion.id}>
          <div className="questionnaire-question-meta"><span>Вопрос {String(currentIndex + 1).padStart(2, '0')} / {String(questionnaire.length).padStart(2, '0')}</span><span>{currentQuestion.section}</span></div>
          <h3>{currentQuestion.prompt}</h3>
          <p className="questionnaire-why"><span>ЗАЧЕМ</span>{currentQuestion.why}</p>
          <div className="questionnaire-options" role="radiogroup" aria-label={currentQuestion.prompt}>
            {currentQuestion.options.map((option) => {
              const isSelected = Object.is(selectedValue, option.value)
              return <button className={`questionnaire-option ${isSelected ? 'is-selected' : ''}`} type="button" role="radio" aria-checked={isSelected} key={String(option.value)} onClick={() => chooseAnswer(option.value)}><span className="questionnaire-radio" />{option.label}</button>
            })}
          </div>
          {error && <p className="questionnaire-error" role="alert">{error}</p>}
        </div>
      )}

      <div className="questionnaire-actions">
        <button className="questionnaire-secondary" type="button" onClick={reset}>Начать заново</button>
        <div className="questionnaire-navigation">
          {(currentIndex > 0 || isConfirmationStep) && <button className="questionnaire-secondary" type="button" onClick={goBack}>Назад</button>}
          {isConfirmationStep ? (!isSubmitted && <button className="questionnaire-primary" type="button" onClick={confirm}>Рассчитать рейтинг</button>) : <button className="questionnaire-primary" type="button" onClick={goNext}>{currentIndex === questionnaire.length - 1 ? 'Проверить ответы' : 'Следующий вопрос'}<span>→</span></button>}
        </div>
      </div>
    </section>
  )
}
