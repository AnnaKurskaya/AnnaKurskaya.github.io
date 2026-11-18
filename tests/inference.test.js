import assert from 'node:assert/strict'
import test from 'node:test'

import { levelFacts } from '../src/entities/expert-system/model/knowledgeBase.js'
import { normalizeSession, runInference, runPartialInference, sortRanking } from '../src/entities/expert-system/model/inference.js'
import { strategies, userParameters } from '../src/entities/expert-system/model/domain.js'
import { createWorkingDatabase, SessionValidationError } from '../src/entities/expert-system/model/session.js'
import { questionnaire } from '../src/features/expert-system-questionnaire/model/questions.js'

function createCompleteSession({ answerOverrides = {}, factOverrides = {} } = {}) {
  const database = createWorkingDatabase()

  userParameters.forEach((parameter) => {
    const value = answerOverrides[parameter.id]
      ?? (parameter.values ? parameter.values[0].id : parameter.range.min)
    database.setAnswer(parameter.id, value)
  })

  levelFacts.forEach((fact) => {
    const value = factOverrides[fact.id]
      ?? (fact.type === 'boolean' ? false : fact.values ? fact.values[0].id : fact.range.min)
    database.setLevelFact(fact.id, value)
  })

  return database.getSession()
}

test('нормализация приводит числовые, шкальные и категориальные значения к 0..1', () => {
  const session = createCompleteSession({
    answerOverrides: { availableBoosters: 5 },
    factOverrides: { targetCount: 12, goalDistribution: 'clustered' },
  })
  const normalized = normalizeSession(session)

  assert.equal(normalized.answers.availableBoosters, 0.5)
  assert.equal(normalized.levelFacts.targetCount, 11 / 29)
  assert.equal(normalized.levelFacts.goalDistribution, 0.5)
  for (const values of [Object.values(normalized.answers), Object.values(normalized.levelFacts)]) {
    assert.equal(values.every((value) => value >= 0 && value <= 1), true)
  }
})

test('механизм рассчитывает и сохраняет рейтинг всех 20 стратегий', () => {
  const session = createCompleteSession({
    answerOverrides: { remainingMoves: 5, availableBoosters: 2, goalType: 'combined' },
    factOverrides: { obstacleDensity: 0.8, closedZoneRatio: 0.8, hasGroupedObstacles: true },
  })
  const result = runInference(session)

  assert.equal(result.ranking.length, strategies.length)
  assert.equal(result.session.status, 'ranked')
  assert.equal(result.session.intermediateResults.length, strategies.length)
  assert.equal(result.session.finalRanking.length, strategies.length)
  assert.deepEqual(result.ranking.map(({ rank }) => rank), Array.from({ length: 20 }, (_, index) => index + 1))
  assert.equal(result.ranking.every((item, index, ranking) => index === 0 || ranking[index - 1].score >= item.score), true)
  assert.equal(result.ranking.every(({ explanation, contributions }) => explanation.length > 0 && contributions.length > 0), true)
  assert.equal(session.finalRanking.length, 0)
})

test('правила добавляют бонусы и штрафы, а сработавшие правила попадают в объяснение', () => {
  const result = runInference(createCompleteSession({
    answerOverrides: { remainingMoves: 5, resourceReserve: 'high', boosterReadiness: 'avoid' },
    factOverrides: { obstacleDensity: 0.8 },
  }))
  const activeRuleIds = result.activeRules.map(({ id }) => id)
  const bombStrategy = result.ranking.find(({ strategyId }) => strategyId === 'bomb-groups')
  const resourceStrategy = result.ranking.find(({ strategyId }) => strategyId === 'use-all-resources')

  assert.equal(activeRuleIds.includes('few-moves-dense-obstacles'), true)
  assert.equal(activeRuleIds.includes('economy-first'), true)
  assert.equal(bombStrategy.matchedRules.some(({ ruleId, type }) => ruleId === 'few-moves-dense-obstacles' && type === 'bonus'), true)
  assert.equal(resourceStrategy.matchedRules.some(({ ruleId, type }) => ruleId === 'economy-first' && type === 'penalty'), true)
  assert.equal(bombStrategy.explanation.some((item) => item.includes('Бомба')), true)
})

test('сценарии скорости, осторожной игры и повторной попытки активируют свои правила', () => {
  const result = runInference(createCompleteSession({
    answerOverrides: {
      playerExperience: 'beginner',
      playStyle: 'cautious',
      speedPreference: 0.8,
      replayTolerance: 'preferred',
      levelDifficulty: 0.8,
    },
  }))
  const activeRuleIds = new Set(result.activeRules.map(({ id }) => id))
  const quickStrategy = result.ranking.find(({ strategyId }) => strategyId === 'quick-completion')
  const replayStrategy = result.ranking.find(({ strategyId }) => strategyId === 'replay-another-strategy')

  assert.equal(activeRuleIds.has('speed-priority'), true)
  assert.equal(activeRuleIds.has('beginner-safe-plan'), true)
  assert.equal(activeRuleIds.has('replay-is-allowed'), true)
  assert.equal(quickStrategy.matchedRules.some(({ ruleId, type }) => ruleId === 'speed-priority' && type === 'bonus'), true)
  assert.equal(replayStrategy.matchedRules.some(({ ruleId, type }) => ruleId === 'replay-is-allowed' && type === 'bonus'), true)
})

test('одинаковые входные данные дают одинаковый рейтинг', () => {
  const session = createCompleteSession({ answerOverrides: { speedPreference: 1, patience: 0.8 } })
  const first = runInference(session)
  const second = runInference(session)

  assert.deepEqual(
    first.ranking.map(({ strategyId, score, ruleAdjustment }) => ({ strategyId, score, ruleAdjustment })),
    second.ranking.map(({ strategyId, score, ruleAdjustment }) => ({ strategyId, score, ruleAdjustment })),
  )
})

test('неполная рабочая БД не допускается к расчёту', () => {
  assert.throws(() => runInference(createWorkingDatabase().getSession()), SessionValidationError)
})

test('граничные и конфликтующие ответы проходят валидацию предсказуемо', () => {
  const database = createWorkingDatabase()
  assert.throws(() => database.setAnswer('speedPreference', 1.5), SessionValidationError)
  assert.throws(() => database.setLevelFact('hasLineTargets', 'yes'), SessionValidationError)

  const result = runInference(createCompleteSession({
    answerOverrides: { resourceReserve: 'high', boosterReadiness: 'ready', speedPreference: 1 },
    factOverrides: { obstacleDensity: 0, closedZoneRatio: 0, boardSpace: 1 },
  }))
  const activeRuleIds = result.activeRules.map(({ id }) => id)
  assert.equal(activeRuleIds.includes('economy-first'), false)
  assert.equal(result.normalized.answers.speedPreference, 1)
  assert.equal(result.normalized.levelFacts.obstacleDensity, 0)
  assert.equal(result.normalized.levelFacts.boardSpace, 1)
})

test('ничьи разрешаются стабильным порядком strategyId', () => {
  const ranking = sortRanking([
    { strategyId: 'zeta', score: 50 },
    { strategyId: 'alpha', score: 50 },
  ])

  assert.deepEqual(ranking.map(({ strategyId, rank }) => [strategyId, rank]), [['alpha', 1], ['zeta', 2]])
})

test('после каждого из 20 ответов доступен полный промежуточный рейтинг, совпадающий с итоговым', () => {
  const database = createWorkingDatabase()
  for (const question of questionnaire) {
    const value = question.options[0].value
    const session = question.target.type === 'parameter'
      ? database.setAnswer(question.target.id, value)
      : database.setLevelFact(question.target.id, value)
    const result = runPartialInference(session)
    database.saveIntermediateResults(result.ranking)
    assert.equal(result.ranking.length, 20)
    assert.equal(result.ranking.every(({ score }) => Number.isFinite(score) && score >= 0 && score <= 100), true)
    assert.equal(database.getSession().finalRanking.length, 0)
  }
  assert.deepEqual(database.getSession().intermediateResults, runInference(database.getSession()).ranking)
})

test('неизвестные параметры не подменяются ответами и не активируют правила', () => {
  const database = createWorkingDatabase()
  const empty = runPartialInference(database.getSession())
  assert.equal(empty.activeRules.length, 0)
  assert.equal(empty.ranking.every(({ score, contributions }) => score === 50 && contributions.length === 0), true)
  const result = runPartialInference(database.setLevelFact('hasLineTargets', false))
  assert.equal(result.activeRules.length, 0)
  assert.equal(result.ranking.every(({ contributions }) => contributions.length === 1 && contributions[0].label === 'Линейные цели'), true)
})

test('изменение ответа очищает старые оценки, пересчёт не накапливает бонусы, сброс очищает сеанс', () => {
  const database = createWorkingDatabase()
  database.setAnswer('speedPreference', 1)
  const first = runPartialInference(database.getSession())
  database.saveIntermediateResults(first.ranking)
  assert.equal(database.setAnswer('speedPreference', 0).intermediateResults.length, 0)
  const revised = runPartialInference(database.getSession())
  assert.equal(revised.activeRules.some(({ id }) => id === 'speed-priority'), false)
  assert.notDeepEqual(first.ranking, revised.ranking)
  assert.deepEqual(runPartialInference(database.getSession()).ranking, revised.ranking)
  database.saveIntermediateResults(revised.ranking)
  const reset = database.resetSession()
  assert.deepEqual(reset.answers, {})
  assert.deepEqual(reset.intermediateResults, [])
  assert.deepEqual(reset.finalRanking, [])
})

test('нормализация сохраняет различия критического сценария без обрезания до 100', () => {
  const result = runInference(createCompleteSession({
    answerOverrides: { playerExperience: 'advanced', playStyle: 'aggressive', remainingMoves: 5, availableBoosters: 2, resourceReserve: 'low', boosterReadiness: 'ready', speedPreference: 1, patience: 0.5, extraMovesAvailable: 'none', levelDifficulty: 0.9, goalType: 'combined' },
    factOverrides: { obstacleDensity: 0.9, closedZoneRatio: 0.7, targetCount: 20, hasLineTargets: true, hasGroupedObstacles: true, hasFrozenTiles: true, goalDistribution: 'clustered', boardSpace: 0.5 },
  }))
  const { lower, upper } = result.scoreBounds
  for (const item of result.ranking) {
    assert.ok(Math.abs(item.score - 100 * (item.baseScore + item.ruleAdjustment - lower) / (upper - lower)) < 0.02)
    assert.ok(Math.abs(item.ruleAdjustment - item.matchedRules.reduce((sum, rule) => sum + rule.points, 0)) < 0.01)
  }
  assert.ok(new Set(result.ranking.slice(0, 3).map(({ score }) => score)).size > 1)
  assert.equal(result.ranking.filter(({ score }) => score === 100).length, 0)
})
