import {
  SCORE_RANGE,
  strategies,
  strategyAttributes,
  userParameters,
  validateDomainModel,
} from './domain.js'

export const KNOWLEDGE_BASE_VERSION = '1.0.0'

const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  Object.values(value).forEach(deepFreeze)
  return value
}

const condition = (fact, operator, value, label) => ({ fact, operator, value, label })
const effect = (strategyId, type, value, reason) => ({ strategyId, type, value, reason })
const rule = (id, title, description, conditions, effects, priority = 0.5) => ({
  id,
  title,
  description,
  mode: 'all',
  priority,
  conditions,
  effects,
})

/** Факты уровня дополняют ответы пользователя и хранятся в рабочей БД сессии. */
export const levelFacts = deepFreeze([
  { id: 'obstacleDensity', label: 'Плотность препятствий', type: 'scale', range: { min: 0, max: 1, step: 0.1 } },
  { id: 'closedZoneRatio', label: 'Доля закрытых зон', type: 'scale', range: { min: 0, max: 1, step: 0.1 } },
  { id: 'targetCount', label: 'Количество целей', type: 'number', range: { min: 1, max: 30, step: 1 } },
  { id: 'hasLineTargets', label: 'Есть цели, расположенные линиями', type: 'boolean' },
  { id: 'hasGroupedObstacles', label: 'Есть группы препятствий', type: 'boolean' },
  { id: 'hasFrozenTiles', label: 'Есть замороженные элементы', type: 'boolean' },
  { id: 'goalDistribution', label: 'Распределение целей', type: 'single-choice', values: [{ id: 'scattered', label: 'Разрозненные' }, { id: 'clustered', label: 'Сгруппированные' }, { id: 'mixed', label: 'Смешанные' }] },
  { id: 'boardSpace', label: 'Свободное пространство на поле', type: 'scale', range: { min: 0, max: 1, step: 0.1 } },
])

/**
 * Декларативные правила базы знаний. Механизм вывода интерпретирует
 * conditions/effects и применяет их к текущей рабочей сессии.
 */
export const knowledgeRules = deepFreeze([
  rule(
    'few-moves-dense-obstacles',
    'Мало ходов и много препятствий',
    'В критической ситуации массовое воздействие получает дополнительный приоритет.',
    [condition('remainingMoves', 'lte', 8, 'Осталось не больше 8 ходов'), condition('obstacleDensity', 'gte', 0.65, 'Плотность препятствий от 65%')],
    [effect('bomb-groups', 'bonus', 0.18, 'Бомба быстро убирает группу препятствий.'), effect('bomb-rocket-combo', 'bonus', 0.22, 'Комбинация очищает большую область за один ход.'), effect('use-all-resources', 'bonus', 0.12, 'В критической ситуации ресурсы можно потратить на победу.')],
    0.95,
  ),
  rule(
    'economy-first',
    'Приоритет экономии ресурсов',
    'Если сохранение ресурсов важно, система усиливает стратегии с низкой стоимостью.',
    [condition('resourceReserve', 'gte', 0.75, 'Ресурсы нужно сохранять'), condition('boosterReadiness', 'in', ['avoid', 'situational'], 'Игрок не хочет тратить бустеры без необходимости')],
    [effect('economical-boosters', 'bonus', 0.24, 'Стратегия почти не расходует бустеры.'), effect('cautious-completion', 'bonus', 0.1, 'Осторожное прохождение снижает риск лишних трат.'), effect('use-all-resources', 'penalty', 0.22, 'Стратегия расходует весь запас ресурсов.')],
    0.9,
  ),
  rule(
    'speed-priority',
    'Приоритет скорости',
    'Высокое желание пройти уровень быстро повышает вес быстрых тактик.',
    [condition('speedPreference', 'gte', 0.7, 'Приоритет скорости не ниже 70%')],
    [effect('quick-completion', 'bonus', 0.25, 'Тактика напрямую оптимизирует время прохождения.'), effect('rockets-lines', 'bonus', 0.1, 'Ракеты быстро открывают линии.'), effect('cautious-completion', 'penalty', 0.12, 'Осторожный режим требует больше ходов.')],
    0.8,
  ),
  rule(
    'patient-planning',
    'Время на подготовку',
    'Терпеливый игрок может получить выгоду от подготовки сильной комбинации.',
    [condition('patience', 'gte', 0.7, 'Терпеливость не ниже 70%'), condition('levelDifficulty', 'gte', 0.55, 'Уровень требует планирования')],
    [effect('long-combos', 'bonus', 0.2, 'Длинные комбинации требуют времени на подготовку.'), effect('start-boosters', 'bonus', 0.14, 'Подготовка бустеров становится оправданной.')],
    0.72,
  ),
  rule(
    'closed-zones',
    'Закрытые зоны',
    'Если цели находятся в закрытых областях, приоритет получают стратегии открытия зон.',
    [condition('closedZoneRatio', 'gte', 0.6, 'Закрыто не менее 60% зон')],
    [effect('unlock-closed-zones', 'bonus', 0.28, 'Стратегия специально открывает недоступные зоны.'), effect('aircraft-distant-targets', 'bonus', 0.15, 'Самолёты достают до удалённых целей.')],
    0.88,
  ),
  rule(
    'combined-goals',
    'Смешанная цель уровня',
    'При одновременных целях и препятствиях выгоднее универсальный план.',
    [condition('goalType', 'eq', 'combined', 'На уровне есть цели и препятствия')],
    [effect('combined-strategy', 'bonus', 0.25, 'Комбинированная стратегия учитывает несколько типов задач.'), effect('obstacles-then-goals', 'bonus', 0.1, 'Сначала освобождается поле, затем выполняются цели.')],
    0.82,
  ),
  rule(
    'few-boosters',
    'Ограниченный запас бустеров',
    'При малом запасе система исключает чрезмерно зависимые от бустеров тактики.',
    [condition('availableBoosters', 'lte', 2, 'Доступно не больше 2 бустеров')],
    [effect('economical-boosters', 'bonus', 0.18, 'Экономная стратегия подходит для ограниченного запаса.'), effect('bomb-rocket-combo', 'penalty', 0.14, 'Комбинация требует редких ресурсов.'), effect('start-boosters', 'penalty', 0.12, 'Подготовка бустеров может быть недоступна.')],
    0.76,
  ),
  rule(
    'beginner-safe-plan',
    'Безопасный план для новичка',
    'Начинающему игроку предлагаются простые и надёжные действия.',
    [condition('playerExperience', 'eq', 'beginner', 'Опыт игрока — начинающий'), condition('playStyle', 'eq', 'cautious', 'Игрок выбрал осторожный стиль')],
    [effect('cautious-completion', 'bonus', 0.2, 'Тактика имеет низкую сложность применения.'), effect('goals-first', 'bonus', 0.08, 'Прямые цели проще контролировать.'), effect('combined-strategy', 'penalty', 0.1, 'Сложная комбинация требует большего опыта.')],
    0.78,
  ),
  rule(
    'replay-is-allowed',
    'Повторная попытка допустима',
    'Готовность повторить уровень делает экспериментальные стратегии полезнее.',
    [condition('replayTolerance', 'eq', 'preferred', 'Игрок готов повторять уровень'), condition('levelDifficulty', 'gte', 0.6, 'Уровень сложный')],
    [effect('replay-another-strategy', 'bonus', 0.28, 'Можно проверить другой план без потери объяснимости результата.'), effect('long-combos', 'bonus', 0.08, 'Подготовка комбинации может быть проверена в новой попытке.')],
    0.7,
  ),
  rule(
    'no-extra-moves',
    'Нет дополнительных ходов',
    'При отсутствии дополнительного запаса ходов приоритет получают надёжные быстрые решения.',
    [condition('extraMovesAvailable', 'eq', 'none', 'Дополнительные ходы недоступны'), condition('remainingMoves', 'lte', 12, 'Осталось не больше 12 ходов')],
    [effect('quick-completion', 'bonus', 0.16, 'Нужно завершить уровень в текущем запасе ходов.'), effect('extra-moves', 'bonus', 0.12, 'Получение дополнительных ходов становится ценным.'), effect('long-combos', 'penalty', 0.08, 'Подготовка комбинации может не окупиться по времени.')],
    0.84,
  ),
  rule(
    'line-targets',
    'Линейное расположение целей',
    'Линии целей увеличивают полезность ракет.',
    [condition('hasLineTargets', 'eq', true, 'На поле есть линейные цели')],
    [effect('rockets-lines', 'bonus', 0.22, 'Ракета эффективно очищает линию целей.')],
    0.66,
  ),
  rule(
    'grouped-obstacles',
    'Группы препятствий',
    'Плотные группы препятствий являются хорошей целью для взрывных бустеров.',
    [condition('hasGroupedObstacles', 'eq', true, 'На поле есть группы препятствий')],
    [effect('bomb-groups', 'bonus', 0.2, 'Бомба воздействует сразу на группу препятствий.')],
    0.68,
  ),
])

const factIds = new Set([...userParameters.map(({ id }) => id), ...levelFacts.map(({ id }) => id)])
const strategyIds = new Set(strategies.map(({ id }) => id))
const ruleIdsAreUnique = (rules) => new Set(rules.map(({ id }) => id)).size === rules.length

export const knowledgeBase = deepFreeze({
  version: KNOWLEDGE_BASE_VERSION,
  modelVersion: '1.0.0',
  parameters: userParameters,
  levelFacts,
  attributes: strategyAttributes,
  strategies,
  rules: knowledgeRules,
})

export function getKnowledgeBase() {
  return knowledgeBase
}

export function validateKnowledgeBase() {
  const errors = [...validateDomainModel().errors]
  if (knowledgeRules.length < 10) errors.push('В базе знаний меньше 10 правил.')
  if (!ruleIdsAreUnique(knowledgeRules)) errors.push('В базе знаний есть повторяющиеся идентификаторы правил.')
  if (!Object.isFrozen(knowledgeBase) || !Object.isFrozen(knowledgeRules)) errors.push('База знаний должна быть защищена от случайной мутации.')

  for (const currentRule of knowledgeRules) {
    if (!currentRule.conditions.length || !currentRule.effects.length) errors.push(`Правило ${currentRule.id} должно иметь условия и эффекты.`)
    if (currentRule.priority < SCORE_RANGE.min || currentRule.priority > SCORE_RANGE.max) errors.push(`Приоритет правила ${currentRule.id} находится вне диапазона 0..1.`)
    currentRule.conditions.forEach(({ fact }) => {
      if (!factIds.has(fact)) errors.push(`Правило ${currentRule.id} ссылается на неизвестный факт ${fact}.`)
    })
    currentRule.effects.forEach(({ strategyId, value }) => {
      if (!strategyIds.has(strategyId)) errors.push(`Правило ${currentRule.id} ссылается на неизвестную стратегию ${strategyId}.`)
      if (value < -1 || value > 1) errors.push(`Эффект правила ${currentRule.id} находится вне диапазона -1..1.`)
    })
  }

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) })
}
