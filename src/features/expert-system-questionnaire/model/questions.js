import { levelFacts } from '../../../entities/expert-system/model/knowledgeBase.js'
import { userParameters } from '../../../entities/expert-system/model/domain.js'

const deepFreeze = (value) => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  Object.values(value).forEach(deepFreeze)
  return value
}

const question = (id, targetType, targetId, prompt, why, options, section) => ({
  id,
  target: { type: targetType, id: targetId },
  prompt,
  why,
  options,
  section,
})

export const questionnaire = deepFreeze([
  question('player-experience', 'parameter', 'playerExperience', 'Как вы оцениваете свой опыт в Homescapes?', 'Опыт определяет, насколько сложные комбинации можно рекомендовать.', [{ value: 'beginner', label: 'Начинающий игрок' }, { value: 'intermediate', label: 'Играю уверенно' }, { value: 'advanced', label: 'Опытный игрок' }], 'ПРОФИЛЬ ИГРОКА'),
  question('play-style', 'parameter', 'playStyle', 'Как вы обычно проходите сложные уровни?', 'Система подберёт баланс риска, скорости и надёжности.', [{ value: 'cautious', label: 'Осторожно и надёжно' }, { value: 'balanced', label: 'Сбалансированно' }, { value: 'aggressive', label: 'Рискую ради скорости' }], 'ПРОФИЛЬ ИГРОКА'),
  question('available-boosters', 'parameter', 'availableBoosters', 'Сколько бустеров доступно для этой попытки?', 'Количество ресурсов ограничивает набор допустимых стратегий.', [{ value: 0, label: 'Нет бустеров' }, { value: 2, label: '1–2 бустера' }, { value: 5, label: '3–5 бустеров' }, { value: 8, label: 'Больше 5' }], 'РЕСУРСЫ'),
  question('resource-reserve', 'parameter', 'resourceReserve', 'Насколько важно сохранить ресурсы после уровня?', 'Это влияет на штраф за дорогие стратегии.', [{ value: 'low', label: 'Можно потратить' }, { value: 'medium', label: 'Желательно сохранить часть' }, { value: 'high', label: 'Важно всё сэкономить' }], 'РЕСУРСЫ'),
  question('booster-readiness', 'parameter', 'boosterReadiness', 'Готовы ли вы использовать бустеры ради победы?', 'Система не будет предлагать дорогую стратегию вопреки вашему выбору.', [{ value: 'avoid', label: 'Предпочитаю не тратить' }, { value: 'situational', label: 'Только при необходимости' }, { value: 'ready', label: 'Готов использовать' }], 'РЕСУРСЫ'),
  question('replay-tolerance', 'parameter', 'replayTolerance', 'Допустима ли повторная попытка с другой тактикой?', 'Это позволяет рекомендовать экспериментальный план вместо гарантированно простого.', [{ value: 'avoid', label: 'Хочу пройти с первого раза' }, { value: 'acceptable', label: 'Допустимо повторить' }, { value: 'preferred', label: 'Готов экспериментировать' }], 'ПОДХОД'),
  question('speed-preference', 'parameter', 'speedPreference', 'Насколько важна скорость прохождения?', 'Высокий приоритет скорости усилит быстрые стратегии.', [{ value: 0.2, label: 'Скорость не важна' }, { value: 0.5, label: 'Средний приоритет' }, { value: 0.8, label: 'Важно пройти быстро' }, { value: 1, label: 'Максимально быстро' }], 'ПОДХОД'),
  question('patience', 'parameter', 'patience', 'Насколько вы готовы потратить время на подготовку комбинации?', 'Терпеливость влияет на стратегии длинных комбинаций и осторожного прохождения.', [{ value: 0.2, label: 'Хочу действовать сразу' }, { value: 0.5, label: 'Готов немного подождать' }, { value: 0.8, label: 'Готов планировать' }, { value: 1, label: 'Люблю продумывать ходы' }], 'ПОДХОД'),
  question('extra-moves', 'parameter', 'extraMovesAvailable', 'Есть ли возможность получить дополнительные ходы?', 'Если запас ходов ограничен, система изменит приоритет стратегий.', [{ value: 'none', label: 'Нет' }, { value: 'limited', label: 'Ограниченно' }, { value: 'many', label: 'Да' }], 'ПАРАМЕТРЫ УРОВНЯ'),
  question('level-difficulty', 'parameter', 'levelDifficulty', 'Какой кажется сложность текущего уровня?', 'На сложных уровнях важнее надёжность и универсальность.', [{ value: 0.2, label: 'Низкая' }, { value: 0.5, label: 'Средняя' }, { value: 0.8, label: 'Высокая' }, { value: 1, label: 'Очень высокая' }], 'ПАРАМЕТРЫ УРОВНЯ'),
  question('remaining-moves', 'parameter', 'remainingMoves', 'Сколько ходов осталось до завершения попытки?', 'Малый остаток ходов повышает приоритет быстрых и массовых решений.', [{ value: 5, label: 'До 5 ходов' }, { value: 8, label: '6–8 ходов' }, { value: 12, label: '9–12 ходов' }, { value: 20, label: 'Больше 12 ходов' }], 'ПАРАМЕТРЫ УРОВНЯ'),
  question('goal-type', 'parameter', 'goalType', 'Какой тип цели является главным на уровне?', 'Тип цели связывается с эффективными свойствами стратегий.', [{ value: 'obstacles', label: 'Убрать препятствия' }, { value: 'goals', label: 'Выполнить цели' }, { value: 'combined', label: 'Цели и препятствия' }, { value: 'area', label: 'Очистить область' }], 'ПАРАМЕТРЫ УРОВНЯ'),
  question('obstacle-density', 'levelFact', 'obstacleDensity', 'Насколько большая часть поля занята препятствиями?', 'Плотность препятствий активирует правила массовой очистки.', [{ value: 0.2, label: 'Мало препятствий' }, { value: 0.5, label: 'Около половины поля' }, { value: 0.8, label: 'Большая часть поля' }, { value: 1, label: 'Почти всё поле' }], 'СОСТОЯНИЕ ПОЛЯ'),
  question('closed-zones', 'levelFact', 'closedZoneRatio', 'Какая доля целей находится в закрытых зонах?', 'Закрытые зоны повышают ценность самолётов и стратегий открытия поля.', [{ value: 0.2, label: 'Почти нет' }, { value: 0.5, label: 'Около половины' }, { value: 0.8, label: 'Большая часть' }, { value: 1, label: 'Все цели' }], 'СОСТОЯНИЕ ПОЛЯ'),
  question('target-count', 'levelFact', 'targetCount', 'Сколько отдельных целей нужно выполнить?', 'Количество целей влияет на полезность массового воздействия.', [{ value: 1, label: '1–2 цели' }, { value: 4, label: '3–5 целей' }, { value: 8, label: '6–10 целей' }, { value: 12, label: 'Больше 10' }], 'СОСТОЯНИЕ ПОЛЯ'),
  question('line-targets', 'levelFact', 'hasLineTargets', 'Расположены ли цели в линии?', 'Линейное расположение помогает определить полезность ракет.', [{ value: true, label: 'Да, цели образуют линии' }, { value: false, label: 'Нет, расположение другое' }], 'СОСТОЯНИЕ ПОЛЯ'),
  question('grouped-obstacles', 'levelFact', 'hasGroupedObstacles', 'Есть ли на поле плотные группы препятствий?', 'Группы препятствий являются хорошей целью для бомб.', [{ value: true, label: 'Да, есть группы' }, { value: false, label: 'Нет, препятствия разрознены' }], 'СОСТОЯНИЕ ПОЛЯ'),
  question('frozen-tiles', 'levelFact', 'hasFrozenTiles', 'Есть ли на поле замороженные элементы?', 'Дополнительное состояние поля учитывается при выборе универсальной стратегии.', [{ value: true, label: 'Да' }, { value: false, label: 'Нет' }], 'СОСТОЯНИЕ ПОЛЯ'),
  question('goal-distribution', 'levelFact', 'goalDistribution', 'Как распределены цели по полю?', 'Распределение целей помогает выбрать точечное или массовое воздействие.', [{ value: 'scattered', label: 'Разрозненно' }, { value: 'clustered', label: 'Сгруппированы' }, { value: 'mixed', label: 'И разрозненно, и группами' }], 'СОСТОЯНИЕ ПОЛЯ'),
  question('board-space', 'levelFact', 'boardSpace', 'Сколько свободного пространства осталось для комбинаций?', 'Свободное пространство определяет возможность подготовить длинную комбинацию.', [{ value: 0.2, label: 'Почти нет места' }, { value: 0.5, label: 'Среднее количество' }, { value: 0.8, label: 'Много места' }, { value: 1, label: 'Поле почти свободно' }], 'СОСТОЯНИЕ ПОЛЯ'),
])

export function validateQuestionnaire() {
  const errors = []
  const ids = new Set()
  const targets = new Map([...userParameters.map((item) => [`parameter:${item.id}`, item]), ...levelFacts.map((item) => [`levelFact:${item.id}`, item])])

  if (questionnaire.length < 20) errors.push('В опросе меньше 20 вопросов.')
  questionnaire.forEach((item) => {
    if (ids.has(item.id)) errors.push(`Повторяющийся идентификатор вопроса: ${item.id}.`)
    ids.add(item.id)
    const descriptor = targets.get(`${item.target.type}:${item.target.id}`)
    if (!descriptor) errors.push(`Вопрос ${item.id} ссылается на неизвестную цель.`)
    if (!item.options.length) errors.push(`У вопроса ${item.id} нет вариантов ответа.`)
    if (descriptor?.values && item.options.some(({ value }) => !descriptor.values.some(({ id }) => id === value))) errors.push(`Вопрос ${item.id} содержит значение, которого нет в доменной модели.`)
    if (descriptor?.range && item.options.some(({ value }) => typeof value !== 'number' || value < descriptor.range.min || value > descriptor.range.max)) errors.push(`Вопрос ${item.id} содержит значение вне допустимого диапазона.`)
    if (descriptor?.type === 'boolean' && item.options.some(({ value }) => typeof value !== 'boolean')) errors.push(`Вопрос ${item.id} должен содержать логические варианты.`)
  })
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) })
}
