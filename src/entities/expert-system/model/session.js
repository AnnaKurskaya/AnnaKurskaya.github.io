import { levelFacts } from './knowledgeBase.js'
import { userParameters } from './domain.js'

export const WORKING_DATABASE_VERSION = '1.0.0'

export class SessionValidationError extends Error {
  constructor(message, details = []) {
    super(message)
    this.name = 'SessionValidationError'
    this.details = details
  }
}

const clone = (value) => {
  if (Array.isArray(value)) return value.map(clone)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, clone(nestedValue)]))
  return value
}

const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  Object.values(value).forEach(deepFreeze)
  return value
}

const timestamp = () => new Date().toISOString()

export function createEmptySession() {
  return {
    version: WORKING_DATABASE_VERSION,
    status: 'idle',
    answers: {},
    levelFacts: {},
    intermediateResults: [],
    finalRanking: [],
    lastUpdatedAt: null,
  }
}

const getParameter = (parameterId) => userParameters.find(({ id }) => id === parameterId)
const getLevelFact = (factId) => levelFacts.find(({ id }) => id === factId)

function validateValue(field, value, descriptor) {
  if (descriptor.values) {
    if (!descriptor.values.some(({ id }) => id === value)) throw new SessionValidationError(`Недопустимое значение для поля ${field}.`)
    return
  }
  if (!descriptor.range || typeof value !== 'number' || Number.isNaN(value) || value < descriptor.range.min || value > descriptor.range.max) {
    throw new SessionValidationError(`Значение поля ${field} не соответствует диапазону.`)
  }
}

function validateLevelFactValue(factId, value, descriptor) {
  if (descriptor.type === 'boolean' && typeof value !== 'boolean') throw new SessionValidationError(`Факт ${factId} должен иметь логическое значение.`)
  if (descriptor.type !== 'boolean') validateValue(factId, value, descriptor)
}

export function getMissingParameters(session) {
  return userParameters.filter(({ id }) => session.answers[id] === undefined).map(({ id }) => id)
}

export function getMissingLevelFacts(session) {
  return levelFacts.filter(({ id }) => session.levelFacts[id] === undefined).map(({ id }) => id)
}

export function isReadyForInference(session) {
  return getMissingParameters(session).length === 0 && getMissingLevelFacts(session).length === 0
}

export function setAnswer(session, parameterId, value) {
  const parameter = getParameter(parameterId)
  if (!parameter) throw new SessionValidationError(`Неизвестный параметр пользователя: ${parameterId}.`)
  validateValue(parameterId, value, parameter)
  return {
    ...session,
    status: 'collecting',
    answers: { ...session.answers, [parameterId]: value },
    finalRanking: [],
    lastUpdatedAt: timestamp(),
  }
}

export function setLevelFact(session, factId, value) {
  const fact = getLevelFact(factId)
  if (!fact) throw new SessionValidationError(`Неизвестная характеристика уровня: ${factId}.`)
  validateLevelFactValue(factId, value, fact)
  return {
    ...session,
    status: 'collecting',
    levelFacts: { ...session.levelFacts, [factId]: value },
    finalRanking: [],
    lastUpdatedAt: timestamp(),
  }
}

export function saveIntermediateResults(session, results) {
  if (!Array.isArray(results)) throw new SessionValidationError('Промежуточные результаты должны быть массивом.')
  return {
    ...session,
    status: 'analyzing',
    intermediateResults: clone(results),
    lastUpdatedAt: timestamp(),
  }
}

export function saveRanking(session, ranking) {
  const missingParameters = getMissingParameters(session)
  const missingLevelFacts = getMissingLevelFacts(session)
  if (missingParameters.length || missingLevelFacts.length) {
    throw new SessionValidationError('Нельзя сохранить рейтинг: рабочая БД заполнена не полностью.', [...missingParameters, ...missingLevelFacts])
  }
  if (!Array.isArray(ranking)) throw new SessionValidationError('Итоговый рейтинг должен быть массивом.')
  return {
    ...session,
    status: 'ranked',
    finalRanking: clone(ranking),
    lastUpdatedAt: timestamp(),
  }
}

export function getSession(session) {
  return deepFreeze(clone(session))
}

export function resetSession() {
  return createEmptySession()
}

/**
 * Императивная обёртка для будущего questionnaire/store слоя.
 * Внутреннее состояние не отдаётся напрямую: наружу возвращаются snapshots.
 */
export function createWorkingDatabase(initialSession = createEmptySession()) {
  let state = clone(initialSession)
  const snapshot = () => getSession(state)

  return Object.freeze({
    getSession: snapshot,
    setAnswer(parameterId, value) {
      state = setAnswer(state, parameterId, value)
      return snapshot()
    },
    setLevelFact(factId, value) {
      state = setLevelFact(state, factId, value)
      return snapshot()
    },
    saveIntermediateResults(results) {
      state = saveIntermediateResults(state, results)
      return snapshot()
    },
    saveRanking(ranking) {
      state = saveRanking(state, ranking)
      return snapshot()
    },
    resetSession() {
      state = resetSession()
      return snapshot()
    },
  })
}
