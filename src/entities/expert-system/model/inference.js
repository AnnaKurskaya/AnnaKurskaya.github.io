import { strategies, strategyAttributes, userParameters } from './domain.js'
import { knowledgeRules, levelFacts } from './knowledgeBase.js'
import { getMissingLevelFacts, getMissingParameters, isReadyForInference, saveIntermediateResults, saveRanking, SessionValidationError } from './session.js'

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value))
const similarity = (left, right) => 1 - Math.abs(clamp(left) - clamp(right))
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0

const numericFacts = new Set(['remainingMoves', 'availableBoosters', 'targetCount'])

const getDescriptor = (id) => userParameters.find(({ id: parameterId }) => parameterId === id)
  ?? strategyAttributes.find(({ id: attributeId }) => attributeId === id)
  ?? levelFacts.find(({ id: factId }) => factId === id)

function normalizeValue(descriptor, value) {
  if (descriptor?.values) {
    const optionIndex = descriptor.values.findIndex(({ id }) => id === value)
    if (optionIndex < 0) return 0
    const option = descriptor.values[optionIndex]
    if (typeof option.score === 'number') return clamp(option.score)
    return descriptor.values.length > 1 ? optionIndex / (descriptor.values.length - 1) : 1
  }
  if (descriptor?.range) {
    const span = descriptor.range.max - descriptor.range.min
    return span === 0 ? 0 : clamp((value - descriptor.range.min) / span)
  }
  if (typeof value === 'boolean') return value ? 1 : 0
  return typeof value === 'number' ? clamp(value) : 0
}

export function normalizeSession(session) {
  const answers = Object.fromEntries(Object.entries(session.answers).map(([id, value]) => [id, normalizeValue(getDescriptor(id), value)]))
  const levelFacts = Object.fromEntries(Object.entries(session.levelFacts).map(([id, value]) => [id, normalizeValue(getDescriptor(id), value)]))
  return Object.freeze({ answers: Object.freeze(answers), levelFacts: Object.freeze(levelFacts) })
}

const styleProfile = {
  cautious: { speed: 0.3, randomness: 0.2, success: 0.86 },
  balanced: { speed: 0.6, randomness: 0.5, success: 0.65 },
  aggressive: { speed: 0.9, randomness: 0.8, success: 0.5 },
}

function getBaseContributions(strategy, session, normalized) {
  const attributes = strategy.attributes
  const answers = session.answers
  const facts = session.levelFacts
  const playerStyle = styleProfile[answers.playStyle] ?? styleProfile.balanced
  const goalMatches = {
    obstacles: attributes.obstacleEffectiveness,
    goals: average([attributes.speed, attributes.universality]),
    combined: average([attributes.obstacleEffectiveness, attributes.manyTargetEffectiveness, attributes.universality]),
    area: attributes.manyTargetEffectiveness,
  }
  const extraMovesMatch = answers.extraMovesAvailable === 'none'
    ? average([attributes.speed, attributes.successProbability])
    : answers.extraMovesAvailable === 'many'
      ? attributes.successProbability
      : average([attributes.speed, attributes.successProbability])
  const reserveMatch = answers.resourceReserve === 'high'
    ? 1 - attributes.resourceCost
    : answers.resourceReserve === 'low'
      ? attributes.resourceCost
      : 1 - Math.abs(0.5 - attributes.resourceCost)
  const readinessMatch = answers.boosterReadiness === 'ready'
    ? attributes.boosterNecessity
    : answers.boosterReadiness === 'avoid'
      ? 1 - attributes.boosterNecessity
      : 1 - Math.abs(0.5 - attributes.boosterNecessity)
  const goalDistributionMatch = facts.goalDistribution === 'scattered'
    ? attributes.universality
    : facts.goalDistribution === 'clustered'
      ? attributes.manyTargetEffectiveness
      : average([attributes.universality, attributes.manyTargetEffectiveness])
  const contributions = [
    ['Опыт игрока → требуемый опыт', similarity(normalized.answers.playerExperience, attributes.requiredExperience), 0.1],
    ['Стиль прохождения', average([similarity(playerStyle.speed, attributes.speed), similarity(playerStyle.randomness, attributes.randomnessDependence), similarity(playerStyle.success, attributes.successProbability)]), 0.1],
    ['Доступные бустеры', similarity(normalized.answers.availableBoosters, attributes.boosterNecessity), 0.07],
    ['Сохранение ресурсов', reserveMatch, 0.1],
    ['Готовность использовать бустеры', readinessMatch, 0.07],
    ['Готовность к повторной попытке', strategy.id === 'replay-another-strategy' ? 1 : attributes.universality, 0.05],
    ['Приоритет скорости', similarity(normalized.answers.speedPreference, attributes.speed), 0.1],
    ['Терпеливость и сложность плана', similarity(normalized.answers.patience, attributes.applicationComplexity), 0.08],
    ['Дополнительные ходы', extraMovesMatch, 0.05],
    ['Сложность и надёжность', average([similarity(normalized.answers.levelDifficulty, attributes.requiredExperience), attributes.successProbability]), 0.1],
    ['Оставшиеся ходы', similarity(1 - normalized.answers.remainingMoves, attributes.speed), 0.1],
    ['Тип цели', goalMatches[answers.goalType] ?? attributes.universality, 0.08],
    ['Плотность препятствий', average([similarity(normalized.levelFacts.obstacleDensity, attributes.obstacleEffectiveness), similarity(normalized.levelFacts.obstacleDensity, attributes.manyTargetEffectiveness)]), 0.1],
    ['Закрытые зоны', similarity(normalized.levelFacts.closedZoneRatio, attributes.closedZoneEffectiveness), 0.07],
    ['Количество целей', similarity(normalized.levelFacts.targetCount, attributes.manyTargetEffectiveness), 0.07],
    ['Линейные цели', facts.hasLineTargets ? (strategy.id === 'rockets-lines' ? 1 : attributes.universality) : 0.5, 0.04],
    ['Группы препятствий', facts.hasGroupedObstacles ? (strategy.id === 'bomb-groups' ? 1 : attributes.obstacleEffectiveness) : 0.5, 0.04],
    ['Замороженные элементы', facts.hasFrozenTiles ? average([attributes.closedZoneEffectiveness, attributes.universality]) : 0.5, 0.03],
    ['Распределение целей', goalDistributionMatch, 0.04],
    ['Свободное пространство', similarity(normalized.levelFacts.boardSpace, attributes.applicationComplexity), 0.05],
  ]

  const totalWeight = contributions.reduce((sum, [, , weight]) => sum + weight, 0)
  return contributions.map(([label, match, weight]) => ({ label, match: clamp(match), weight, points: (clamp(match) * weight / totalWeight) * 100 }))
}

function getRawFact(session, factId) {
  return session.answers[factId] ?? session.levelFacts[factId]
}

function getComparableFact(session, normalized, factId, operator) {
  const rawValue = getRawFact(session, factId)
  if (operator === 'eq' || operator === 'in') return rawValue
  if (numericFacts.has(factId)) return rawValue
  return normalized.answers[factId] ?? normalized.levelFacts[factId]
}

function conditionMatches(session, normalized, currentCondition) {
  const { fact, operator, value } = currentCondition
  const currentValue = getComparableFact(session, normalized, fact, operator)
  if (operator === 'eq') return currentValue === value
  if (operator === 'in') return Array.isArray(value) && value.includes(currentValue)
  if (operator === 'gte') return currentValue >= value
  if (operator === 'lte') return currentValue <= value
  if (operator === 'gt') return currentValue > value
  if (operator === 'lt') return currentValue < value
  return false
}

function evaluateRules(session, normalized) {
  return knowledgeRules.filter((currentRule) => currentRule.conditions.every((item) => conditionMatches(session, normalized, item)))
}

function applyRuleEffects(strategy, activeRules) {
  let adjustment = 0
  const matchedRules = []
  for (const currentRule of activeRules) {
    for (const currentEffect of currentRule.effects.filter(({ strategyId }) => strategyId === strategy.id)) {
      const signedValue = currentEffect.type === 'penalty' ? -currentEffect.value : currentEffect.value
      adjustment += signedValue * currentRule.priority * 100
      matchedRules.push({ ruleId: currentRule.id, title: currentRule.title, type: currentEffect.type, value: signedValue, reason: currentEffect.reason })
    }
  }
  return { adjustment, matchedRules }
}

export function sortRanking(items) {
  return [...items]
    .sort((left, right) => right.score - left.score || (left.strategyId < right.strategyId ? -1 : left.strategyId > right.strategyId ? 1 : 0))
    .map((item, index) => ({ ...item, rank: index + 1 }))
}

export function runInference(session) {
  if (!isReadyForInference(session)) {
    const missing = [...getMissingParameters(session), ...getMissingLevelFacts(session)]
    throw new SessionValidationError('Нельзя запустить механизм вывода: рабочая БД заполнена не полностью.', missing)
  }

  const normalized = normalizeSession(session)
  const activeRules = evaluateRules(session, normalized)
  const evaluated = strategies.map((strategy) => {
    const contributions = getBaseContributions(strategy, session, normalized)
    const baseScore = contributions.reduce((sum, contribution) => sum + contribution.points, 0)
    const { adjustment, matchedRules } = applyRuleEffects(strategy, activeRules)
    const score = clamp((baseScore + adjustment) / 100, 0, 1) * 100
    const strongestSignals = [...contributions].sort((left, right) => right.points - left.points).slice(0, 3)
    const explanation = [
      ...strongestSignals.map(({ label }) => label),
      ...matchedRules.map(({ reason }) => reason),
    ]
    return {
      strategyId: strategy.id,
      title: strategy.title,
      baseScore: Number(baseScore.toFixed(2)),
      ruleAdjustment: Number(adjustment.toFixed(2)),
      score: Number(score.toFixed(2)),
      matchedRules,
      contributions,
      explanation,
    }
  })

  const ranking = sortRanking(evaluated)
  const intermediateResults = ranking.map(({ strategyId, baseScore, ruleAdjustment, matchedRules, contributions }) => ({ strategyId, baseScore, ruleAdjustment, matchedRules, contributions }))
  let nextSession = saveIntermediateResults(session, intermediateResults)
  nextSession = saveRanking(nextSession, ranking)

  return Object.freeze({ session: nextSession, ranking, activeRules, normalized })
}

export function calculateBaseScore(strategy, session) {
  if (!isReadyForInference(session)) throw new SessionValidationError('Для расчёта базовой оценки нужно заполнить рабочую БД.')
  const normalized = normalizeSession(session)
  const contributions = getBaseContributions(strategy, session, normalized)
  return Number(contributions.reduce((sum, contribution) => sum + contribution.points, 0).toFixed(2))
}
