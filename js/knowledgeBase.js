/** Pure knowledge-base construction and referential validation. No I/O or DOM. */
export function createKnowledgeBase(entityData, questionData, ruleData) {
  const { entities, attributes, factDefinitions } = entityData;
  const { questions } = questionData;
  const { rules } = ruleData;
  const ensure = (condition, message) => { if (!condition) throw new Error(message); };
  const unique = (items, label) => {
    ensure(Array.isArray(items) && items.length > 0, `Пустой раздел: ${label}`);
    ensure(items.every(item => typeof item.id === 'string') && new Set(items.map(item => item.id)).size === items.length, `Повтор идентификаторов: ${label}`);
  };
  unique(entities, 'стратегии'); unique(questions, 'вопросы'); unique(rules, 'правила');
  ensure(attributes && Object.keys(attributes).length > 0 && factDefinitions, 'Нет словаря атрибутов');
  const parameters = Object.fromEntries(questions.map(q => [q.param, { label: q.label, group: q.group, options: q.options }]));
  ensure(Object.keys(parameters).length === questions.length, 'У каждого вопроса должен быть свой параметр');
  const validValue = (param, value) => parameters[param]?.options.some(o => o.value !== null && o.value === value);
  for (const q of questions) {
    ensure(q.text && q.label && q.group && q.options.length >= 3, `Неполный вопрос ${q.id}`);
    ensure(q.options.filter(o => o.value === null).length === 1, `Нет нейтрального ответа ${q.id}`);
    ensure(new Set(q.options.map(o => o.value)).size === q.options.length && q.options.every(o => o.label), `Некорректные ответы ${q.id}`);
  }
  for (const entity of entities) {
    ensure(entity.name && entity.category && entity.description, `Неполное описание ${entity.id}`);
    for (const attr of Object.keys(attributes)) ensure(Number.isInteger(entity.attributes[attr]) && entity.attributes[attr] >= 1 && entity.attributes[attr] <= 5, `Неверный атрибут ${entity.id}: ${attr}`);
    for (const [key, definition] of Object.entries(factDefinitions)) {
      const value = key === 'category' ? entity.category : entity.facts[key];
      ensure(definition.type === 'number' ? Number.isInteger(value) && value >= definition.min && value <= definition.max : definition.values.some(v => v.value === value), `Неверный факт ${entity.id}: ${key}`);
    }
  }
  for (const r of rules) {
    ensure(['derive', 'score'].includes(r.type) && r.explain && validValue(r.if?.param, r.if?.eq), `Неверное условие ${r.id}`);
    ensure(Array.isArray(r.then) && r.then.length > 0, `Нет действий ${r.id}`);
    for (const effect of r.then) {
      if (r.type === 'derive') {
        ensure(validValue(effect.param, effect.value), `Неверный вывод ${r.id}`);
      } else {
        const numeric = Object.hasOwn(attributes, effect.attr) || factDefinitions[effect.attr]?.type === 'number';
        const definition = factDefinitions[effect.attr];
        ensure(numeric || definition, `Неизвестный атрибут ${r.id}: ${effect.attr}`);
        ensure(['high', 'low', 'eq', 'gte', 'lte'].includes(effect.op) && Number.isFinite(effect.weight) && effect.weight !== 0, `Неверная операция ${r.id}`);
        if (effect.op !== 'eq') ensure(numeric, `Операция требует число ${r.id}`);
        if (['eq', 'gte', 'lte'].includes(effect.op)) ensure(numeric ? Number.isInteger(effect.value) && effect.value >= 1 && effect.value <= 5 : definition.values.some(v => v.value === effect.value), `Неверное значение ${r.id}`);
      }
    }
  }
  for (const q of questions) for (const o of q.options.filter(o => o.value !== null)) ensure(rules.some(r => r.if.param === q.param && r.if.eq === o.value), `Нет правила для ${q.id}: ${o.value}`);
  const rankingPolicy = entityData.rankingPolicy;
  ensure(Object.hasOwn(attributes, rankingPolicy?.tieBreakAttribute), "Неизвестный атрибут разрешения ничьих");
  return { rankingPolicy, entities, attributes, factDefinitions, questions, rules, parameters, note: entityData.note };
}

export function valueLabel(kb, param, value) {
  return kb.parameters[param]?.options.find(o => o.value === value)?.label || String(value);
}
