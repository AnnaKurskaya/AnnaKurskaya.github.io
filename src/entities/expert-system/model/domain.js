/**
 * Доменная модель проекта 1.
 *
 * На этом слое нет React-зависимостей: данные можно использовать в форме,
 * базе знаний, механизме вывода и диагностическом экране независимо от UI.
 */

export const DOMAIN_MODEL_VERSION = '1.0.0'
export const SCORE_RANGE = Object.freeze({ min: 0, max: 1 })

const choice = (id, label, score) => Object.freeze({ id, label, score })

export const userParameters = Object.freeze([
  {
    id: 'playerExperience',
    label: 'Опыт игрока',
    description: 'Насколько уверенно игрок пользуется комбинациями и бустерами.',
    influence: 'Влияет на допустимую сложность комбинаций и стратегий.',
    input: 'single-choice',
    values: Object.freeze([choice('beginner', 'Начинающий', 0.25), choice('intermediate', 'Средний', 0.6), choice('advanced', 'Опытный', 1)]),
  },
  {
    id: 'playStyle',
    label: 'Стиль прохождения',
    description: 'Предпочтение безопасной, сбалансированной или рискованной тактики.',
    influence: 'Определяет баланс между надёжностью, скоростью и риском.',
    input: 'single-choice',
    values: Object.freeze([choice('cautious', 'Осторожный', 0.25), choice('balanced', 'Сбалансированный', 0.6), choice('aggressive', 'Агрессивный', 1)]),
  },
  {
    id: 'availableBoosters',
    label: 'Доступные бустеры',
    description: 'Количество бустеров, которые можно использовать на уровне.',
    influence: 'Ограничивает стратегии, требующие одного или нескольких бустеров.',
    input: 'number',
    range: Object.freeze({ min: 0, max: 10, step: 1, unit: 'шт.' }),
  },
  {
    id: 'resourceReserve',
    label: 'Запас игровых ресурсов',
    description: 'Насколько важно сохранить ресурсы после прохождения.',
    influence: 'Повышает приоритет экономных стратегий при большом запасе ценности ресурсов.',
    input: 'single-choice',
    values: Object.freeze([choice('low', 'Можно потратить', 0.2), choice('medium', 'Частично сохранить', 0.55), choice('high', 'Нужно экономить', 1)]),
  },
  {
    id: 'boosterReadiness',
    label: 'Готовность использовать бустеры',
    description: 'Готовность потратить бустеры ради более надёжного результата.',
    influence: 'Разрешает или снижает бонус стратегиям с высокой потребностью в бустерах.',
    input: 'single-choice',
    values: Object.freeze([choice('avoid', 'Избегаю', 0.2), choice('situational', 'По ситуации', 0.6), choice('ready', 'Готов использовать', 1)]),
  },
  {
    id: 'replayTolerance',
    label: 'Отношение к повторной попытке',
    description: 'Можно ли рекомендовать повторный запуск уровня с другой тактикой.',
    influence: 'Повышает применимость экспериментальных и итеративных стратегий.',
    input: 'single-choice',
    values: Object.freeze([choice('avoid', 'Хочу пройти с первого раза', 0.2), choice('acceptable', 'Допустимо', 0.6), choice('preferred', 'Готов экспериментировать', 1)]),
  },
  {
    id: 'speedPreference',
    label: 'Желание пройти уровень быстро',
    description: 'Приоритет скорости над экономией ресурсов и осторожностью.',
    influence: 'Увеличивает вес свойства скорости прохождения.',
    input: 'scale',
    range: Object.freeze({ min: 0, max: 1, step: 0.1, unit: 'приоритет' }),
  },
  {
    id: 'patience',
    label: 'Терпеливость',
    description: 'Готовность тратить время на подготовку комбинаций и аккуратный план.',
    influence: 'Повышает вес осторожных стратегий и подготовки длинных комбинаций.',
    input: 'scale',
    range: Object.freeze({ min: 0, max: 1, step: 0.1, unit: 'уровень' }),
  },
  {
    id: 'extraMovesAvailable',
    label: 'Доступность дополнительных ходов',
    description: 'Есть ли возможность получить или использовать дополнительные ходы.',
    influence: 'Влияет на целесообразность стратегии получения дополнительных ходов.',
    input: 'single-choice',
    values: Object.freeze([choice('none', 'Нет', 0), choice('limited', 'Ограниченно', 0.5), choice('many', 'Да', 1)]),
  },
  {
    id: 'levelDifficulty',
    label: 'Сложность уровня',
    description: 'Субъективная или заранее известная сложность текущей задачи.',
    influence: 'Усиливает значение надёжности и универсальности на сложных уровнях.',
    input: 'scale',
    range: Object.freeze({ min: 0, max: 1, step: 0.1, unit: 'сложность' }),
  },
  {
    id: 'remainingMoves',
    label: 'Оставшиеся ходы',
    description: 'Количество ходов до завершения попытки.',
    influence: 'При малом остатке повышает приоритет быстрых и массовых стратегий.',
    input: 'number',
    range: Object.freeze({ min: 1, max: 50, step: 1, unit: 'ходов' }),
  },
  {
    id: 'goalType',
    label: 'Тип цели уровня',
    description: 'Главный тип задачи, который нужно выполнить на поле.',
    influence: 'Связывает цель уровня с наиболее эффективными свойствами стратегий.',
    input: 'single-choice',
    values: Object.freeze([choice('obstacles', 'Препятствия', 0.6), choice('goals', 'Цели', 0.6), choice('combined', 'Цели и препятствия', 1), choice('area', 'Очистка области', 0.75)]),
  },
])

export const strategyAttributes = Object.freeze([
  { id: 'obstacleEffectiveness', label: 'Эффективность против препятствий', description: 'Насколько хорошо стратегия убирает препятствия.' },
  { id: 'speed', label: 'Скорость прохождения', description: 'Насколько быстро стратегия приводит к результату.' },
  { id: 'requiredExperience', label: 'Требуемый опыт', description: 'Сложность применения для игрока.' },
  { id: 'resourceCost', label: 'Стоимость ресурсов', description: 'Количество бустеров и ресурсов, которое требуется потратить.' },
  { id: 'randomnessDependence', label: 'Зависимость от случайности', description: 'Насколько результат зависит от удачного расположения элементов.' },
  { id: 'manyTargetEffectiveness', label: 'Эффективность против множества целей', description: 'Способность одновременно воздействовать на несколько целей.' },
  { id: 'closedZoneEffectiveness', label: 'Эффективность против закрытых зон', description: 'Способность открывать и очищать недоступные области.' },
  { id: 'applicationComplexity', label: 'Сложность применения', description: 'Количество условий, которые нужно выполнить для использования стратегии.' },
  { id: 'boosterNecessity', label: 'Необходимость бустеров', description: 'Насколько стратегия зависит от наличия бустеров.' },
  { id: 'successProbability', label: 'Вероятность успеха', description: 'Ожидаемая надёжность стратегии в подходящей ситуации.' },
  { id: 'universality', label: 'Универсальность', description: 'Насколько стратегия применима к разным типам уровней.' },
])

const defaultAttributes = Object.freeze({
  obstacleEffectiveness: 0.5,
  speed: 0.5,
  requiredExperience: 0.5,
  resourceCost: 0.5,
  randomnessDependence: 0.5,
  manyTargetEffectiveness: 0.5,
  closedZoneEffectiveness: 0.5,
  applicationComplexity: 0.5,
  boosterNecessity: 0.5,
  successProbability: 0.5,
  universality: 0.5,
})

const strategy = (id, title, description, recommendedWhen, attributes = {}) => Object.freeze({
  id,
  title,
  description,
  recommendedWhen,
  attributes: Object.freeze({ ...defaultAttributes, ...attributes }),
})

export const strategies = Object.freeze([
  strategy('aircraft-distant-targets', 'Самолёты для дальних целей', 'Использование самолётиков для удаления удалённых или труднодоступных элементов.', 'На поле есть разрозненные цели и закрытые зоны.', { obstacleEffectiveness: 0.62, speed: 0.64, requiredExperience: 0.55, resourceCost: 0.38, randomnessDependence: 0.56, manyTargetEffectiveness: 0.66, closedZoneEffectiveness: 0.9, applicationComplexity: 0.5, boosterNecessity: 0.7, successProbability: 0.72, universality: 0.7 }),
  strategy('bomb-groups', 'Бомбы для групп препятствий', 'Взрывное удаление группы препятствий вокруг точки применения.', 'Препятствия собраны плотной группой.', { obstacleEffectiveness: 0.92, speed: 0.78, requiredExperience: 0.42, resourceCost: 0.5, randomnessDependence: 0.35, manyTargetEffectiveness: 0.94, closedZoneEffectiveness: 0.58, applicationComplexity: 0.38, boosterNecessity: 0.62, successProbability: 0.84, universality: 0.78 }),
  strategy('rockets-lines', 'Ракеты для очистки линий', 'Очистка горизонтальной или вертикальной линии поля.', 'Цели выстроены в линии или нужно быстро открыть проход.', { obstacleEffectiveness: 0.78, speed: 0.82, requiredExperience: 0.38, resourceCost: 0.42, randomnessDependence: 0.4, manyTargetEffectiveness: 0.76, closedZoneEffectiveness: 0.62, applicationComplexity: 0.32, boosterNecessity: 0.58, successProbability: 0.8, universality: 0.82 }),
  strategy('bomb-rocket-combo', 'Комбинация бомба + ракета', 'Мощная комбинация для очистки пересекающихся линий и большой области.', 'На уровне много препятствий и мало оставшихся ходов.', { obstacleEffectiveness: 0.98, speed: 0.9, requiredExperience: 0.72, resourceCost: 0.68, randomnessDependence: 0.48, manyTargetEffectiveness: 0.98, closedZoneEffectiveness: 0.78, applicationComplexity: 0.7, boosterNecessity: 0.82, successProbability: 0.9, universality: 0.76 }),
  strategy('bomb-aircraft-combo', 'Комбинация бомба + самолёт', 'Взрыв с последующим направленным воздействием на удалённые цели.', 'Нужно одновременно убрать группу препятствий и дальнюю цель.', { obstacleEffectiveness: 0.9, speed: 0.83, requiredExperience: 0.76, resourceCost: 0.7, randomnessDependence: 0.55, manyTargetEffectiveness: 0.86, closedZoneEffectiveness: 0.92, applicationComplexity: 0.74, boosterNecessity: 0.86, successProbability: 0.86, universality: 0.72 }),
  strategy('rainbow-ball', 'Радужный шар', 'Замена всех элементов выбранного цвета для массового продвижения к цели.', 'На поле много элементов одного цвета и есть время подготовить комбинацию.', { obstacleEffectiveness: 0.54, speed: 0.72, requiredExperience: 0.68, resourceCost: 0.34, randomnessDependence: 0.68, manyTargetEffectiveness: 0.96, closedZoneEffectiveness: 0.5, applicationComplexity: 0.64, boosterNecessity: 0.52, successProbability: 0.7, universality: 0.68 }),
  strategy('start-boosters', 'Создание бустеров в начале уровня', 'Подготовка сильных комбинаций до активной очистки поля.', 'Уровень сложный, а игрок готов потратить время на подготовку.', { obstacleEffectiveness: 0.72, speed: 0.62, requiredExperience: 0.62, resourceCost: 0.48, randomnessDependence: 0.72, manyTargetEffectiveness: 0.74, closedZoneEffectiveness: 0.6, applicationComplexity: 0.7, boosterNecessity: 0.64, successProbability: 0.76, universality: 0.7 }),
  strategy('obstacles-then-goals', 'Сначала препятствия, затем цели', 'Приоритетное открытие поля перед выполнением основных целей.', 'Препятствия блокируют доступ к большей части поля.', { obstacleEffectiveness: 0.88, speed: 0.66, requiredExperience: 0.32, resourceCost: 0.4, randomnessDependence: 0.28, manyTargetEffectiveness: 0.7, closedZoneEffectiveness: 0.84, applicationComplexity: 0.3, boosterNecessity: 0.42, successProbability: 0.86, universality: 0.9 }),
  strategy('goals-first', 'Сначала цели уровня', 'Фокус на непосредственном выполнении задач уровня без лишних ходов.', 'Цели доступны, а препятствия не блокируют поле.', { obstacleEffectiveness: 0.4, speed: 0.86, requiredExperience: 0.28, resourceCost: 0.26, randomnessDependence: 0.3, manyTargetEffectiveness: 0.58, closedZoneEffectiveness: 0.32, applicationComplexity: 0.24, boosterNecessity: 0.28, successProbability: 0.8, universality: 0.72 }),
  strategy('economical-boosters', 'Экономное использование бустеров', 'Минимизация расхода бустеров с опорой на обычные комбинации.', 'Игрок хочет сохранить ресурсы для следующих уровней.', { obstacleEffectiveness: 0.62, speed: 0.48, requiredExperience: 0.52, resourceCost: 0.08, randomnessDependence: 0.42, manyTargetEffectiveness: 0.5, closedZoneEffectiveness: 0.46, applicationComplexity: 0.52, boosterNecessity: 0.08, successProbability: 0.68, universality: 0.86 }),
  strategy('use-all-resources', 'Использование всех доступных ресурсов', 'Агрессивное применение бустеров и запасов ради завершения текущего уровня.', 'Приоритетом является текущая победа, а не сохранение ресурсов.', { obstacleEffectiveness: 0.86, speed: 0.9, requiredExperience: 0.36, resourceCost: 0.98, randomnessDependence: 0.2, manyTargetEffectiveness: 0.88, closedZoneEffectiveness: 0.76, applicationComplexity: 0.32, boosterNecessity: 0.98, successProbability: 0.92, universality: 0.74 }),
  strategy('quick-completion', 'Быстрое завершение уровня', 'Выбор самых быстрых действий с допустимым расходом ресурсов.', 'Игрок хочет закончить уровень как можно быстрее.', { obstacleEffectiveness: 0.7, speed: 0.98, requiredExperience: 0.42, resourceCost: 0.72, randomnessDependence: 0.3, manyTargetEffectiveness: 0.7, closedZoneEffectiveness: 0.62, applicationComplexity: 0.3, boosterNecessity: 0.7, successProbability: 0.78, universality: 0.82 }),
  strategy('cautious-completion', 'Осторожное прохождение', 'Постепенная очистка поля с минимальным риском неудачной комбинации.', 'Игрок не готов рисковать и предпочитает надёжный план.', { obstacleEffectiveness: 0.7, speed: 0.36, requiredExperience: 0.34, resourceCost: 0.3, randomnessDependence: 0.16, manyTargetEffectiveness: 0.54, closedZoneEffectiveness: 0.68, applicationComplexity: 0.36, boosterNecessity: 0.32, successProbability: 0.9, universality: 0.88 }),
  strategy('clear-center', 'Очистка центральной части поля', 'Освобождение центра, чтобы увеличить количество доступных комбинаций.', 'Центральные препятствия ограничивают дальнейшие ходы.', { obstacleEffectiveness: 0.76, speed: 0.56, requiredExperience: 0.3, resourceCost: 0.28, randomnessDependence: 0.22, manyTargetEffectiveness: 0.64, closedZoneEffectiveness: 0.42, applicationComplexity: 0.28, boosterNecessity: 0.3, successProbability: 0.82, universality: 0.84 }),
  strategy('clear-edges', 'Очистка краёв поля', 'Приоритетное удаление элементов на краях и в углах поля.', 'Основные цели или препятствия расположены по периметру.', { obstacleEffectiveness: 0.72, speed: 0.5, requiredExperience: 0.46, resourceCost: 0.34, randomnessDependence: 0.46, manyTargetEffectiveness: 0.58, closedZoneEffectiveness: 0.74, applicationComplexity: 0.48, boosterNecessity: 0.46, successProbability: 0.74, universality: 0.7 }),
  strategy('unlock-closed-zones', 'Открытие закрытых зон', 'Последовательное снятие блокировок с недоступных участков.', 'Цели находятся в закрытых или изолированных областях.', { obstacleEffectiveness: 0.9, speed: 0.5, requiredExperience: 0.48, resourceCost: 0.42, randomnessDependence: 0.3, manyTargetEffectiveness: 0.62, closedZoneEffectiveness: 0.99, applicationComplexity: 0.46, boosterNecessity: 0.5, successProbability: 0.86, universality: 0.76 }),
  strategy('long-combos', 'Создание длинных комбинаций', 'Накопление ходов для крупных цепочек и усиленных элементов.', 'На поле есть пространство для подготовки комбинаций.', { obstacleEffectiveness: 0.68, speed: 0.62, requiredExperience: 0.78, resourceCost: 0.2, randomnessDependence: 0.74, manyTargetEffectiveness: 0.84, closedZoneEffectiveness: 0.54, applicationComplexity: 0.82, boosterNecessity: 0.26, successProbability: 0.66, universality: 0.68 }),
  strategy('extra-moves', 'Получение дополнительных ходов', 'Приоритет действий, которые продлевают попытку и создают запас времени.', 'Оставшихся ходов мало, а цель требует последовательных действий.', { obstacleEffectiveness: 0.48, speed: 0.42, requiredExperience: 0.54, resourceCost: 0.24, randomnessDependence: 0.6, manyTargetEffectiveness: 0.52, closedZoneEffectiveness: 0.38, applicationComplexity: 0.52, boosterNecessity: 0.4, successProbability: 0.72, universality: 0.74 }),
  strategy('replay-another-strategy', 'Повторная попытка с другой стратегией', 'Анализ неудачи и повторное прохождение с изменённым планом.', 'Игрок готов повторить уровень и использовать накопленную информацию.', { obstacleEffectiveness: 0.7, speed: 0.2, requiredExperience: 0.6, resourceCost: 0.18, randomnessDependence: 0.22, manyTargetEffectiveness: 0.62, closedZoneEffectiveness: 0.62, applicationComplexity: 0.5, boosterNecessity: 0.2, successProbability: 0.82, universality: 0.9 }),
  strategy('combined-strategy', 'Комбинированная стратегия', 'Сочетание нескольких тактик в зависимости от состояния поля.', 'Уровень содержит несколько разных типов целей и препятствий.', { obstacleEffectiveness: 0.9, speed: 0.7, requiredExperience: 0.86, resourceCost: 0.58, randomnessDependence: 0.42, manyTargetEffectiveness: 0.86, closedZoneEffectiveness: 0.82, applicationComplexity: 0.9, boosterNecessity: 0.64, successProbability: 0.88, universality: 0.99 }),
])

const idsAreUnique = (items) => new Set(items.map(({ id }) => id)).size === items.length
const attributeIds = strategyAttributes.map(({ id }) => id)

export function validateDomainModel() {
  const errors = []
  if (userParameters.length < 10) errors.push('Параметров пользователя меньше 10.')
  if (strategies.length < 20) errors.push('Стратегий ранжирования меньше 20.')
  if (strategyAttributes.length < 10) errors.push('Свойств стратегий меньше 10.')
  if (!idsAreUnique(userParameters) || !idsAreUnique(strategies) || !idsAreUnique(strategyAttributes)) errors.push('В доменной модели есть повторяющиеся идентификаторы.')
  for (const parameter of userParameters) {
    if (!parameter.influence) errors.push(`У параметра ${parameter.id} не описано влияние на вывод.`)
    if (parameter.values && (!idsAreUnique(parameter.values) || parameter.values.some(({ score }) => score < SCORE_RANGE.min || score > SCORE_RANGE.max))) errors.push(`У параметра ${parameter.id} некорректная шкала значений.`)
    if (parameter.range && (parameter.range.min >= parameter.range.max || parameter.range.step <= 0)) errors.push(`У параметра ${parameter.id} некорректный диапазон.`)
  }

  for (const item of strategies) {
    const keys = Object.keys(item.attributes)
    if (keys.length !== attributeIds.length || attributeIds.some((id) => !keys.includes(id))) errors.push(`У стратегии ${item.id} заполнен неполный набор свойств.`)
    if (keys.some((id) => item.attributes[id] < SCORE_RANGE.min || item.attributes[id] > SCORE_RANGE.max)) errors.push(`У стратегии ${item.id} есть значение вне диапазона 0..1.`)
  }

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) })
}

export const domainModel = Object.freeze({
  version: DOMAIN_MODEL_VERSION,
  scoreRange: SCORE_RANGE,
  userParameters,
  strategyAttributes,
  strategies,
})
