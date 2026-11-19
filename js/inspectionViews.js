import { valueLabel } from './knowledgeBase.js';
import { entityThumbnail } from './entityViews.js';

// Представления хранилищ: только формирование разметки, без логического вывода и DOM.
const e = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const n = value => value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const signed = value => `${value > 0 ? '+' : ''}${n(value)}`;
const code = value => `<code>${e(value === null ? 'null' : value)}</code>`;
const list = items => `<ul class="cell-list">${items.map(item => `<li>${item}</li>`).join('')}</ul>`;
const table = (label, headers, rows, className = '') => `<div class="table-wrap" tabindex="0" role="region" aria-label="${e(label)}"><table class="${className}"><caption>${e(label)}</caption><thead><tr>${headers.map(h => `<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
const jsonView = (value, label) => `<pre class="json-view" tabindex="0" aria-label="${e(label)}">${e(JSON.stringify(value, null, 2))}</pre>`;
const section = (id, title, content) => `<section id="${id}" class="inspection-section" data-inspection-section hidden><h2 tabindex="-1">${title}</h2>${content}</section>`;
const navigation = (store, items) => `<nav class="subnav" aria-label="${store === 'knowledge' ? 'Разделы базы знаний' : 'Разделы рабочей базы данных'}">${items.map(([id, label, count]) => `<button type="button" data-store="${store}" data-section="${id}" aria-controls="${id}" aria-pressed="false">${label} <span>${count}</span></button>`).join('')}</nav>`;
const ruleLink = rule => `<a class="rule-ref" href="#rule-${e(rule.id)}" data-open-store="knowledge" data-open-section="kb-${rule.type}" data-rule="${e(rule.id)}">${e(rule.id)}</a>`;
const factLabel = (kb, attr, value) => kb.factDefinitions[attr]?.values?.find(v => v.value === value)?.label || String(value);
const search = (kind, label) => `<label class="search-label"><span>${label}</span><span class="search-box"><svg class="search-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input type="search" data-filter="${kind}" placeholder="Введите текст, параметр или код правила" autocomplete="off"></span></label>`;
const noResults = '<p class="empty filter-empty" hidden>По вашему запросу ничего не найдено.</p>';
function assignment(kb, effect) {
  return `${e(kb.parameters[effect.param].label)} ${code(effect.param)} → ${e(valueLabel(kb, effect.param, effect.value))} ${code(effect.value)}`;
}
function effect(kb, action) {
  const name = kb.attributes[action.attr]?.name || kb.factDefinitions[action.attr].name;
  const operations = { high: 'высокое значение', low: 'низкое значение', eq: 'равно', gte: 'не ниже', lte: 'не выше' };
  return `${e(name)} ${code(action.attr)}: ${operations[action.op]}${Object.hasOwn(action, 'value') ? ` ${e(factLabel(kb, action.attr, action.value))} ${code(action.value)}` : ''}<br><span class="muted small">Операция ${code(action.op)} · вес ${signed(action.weight)}</span>`;
}
export function workingSnapshot(database, answers) {
  return structuredClone({ facts: database.facts, log: database.log, answers, step: database.step });
}
export function knowledgeView(kb, sourceData) {
  const attrs = Object.entries(kb.attributes);
  const definitions = Object.entries(kb.factDefinitions);
  const facts = definitions.filter(([key]) => key !== 'category');
  const derive = kb.rules.filter(r => r.type === 'derive');
  const score = kb.rules.filter(r => r.type === 'score');
  const nav = navigation('knowledge', [['kb-objects', 'Объекты', kb.entities.length], ['kb-attributes', 'Атрибуты', attrs.length], ['kb-questions', 'База вопросов', kb.questions.length], ['kb-derive', 'Параметр → параметр', derive.length], ['kb-score', 'Параметр → атрибут', score.length], ['kb-json', 'Исходные JSON', 3]]);
  const objects = table('Все стратегии и свойства', ['Стратегия / класс тактики', ...attrs.map(([, a]) => a.name), ...facts.map(([, f]) => f.name), 'Описание'], kb.entities.map(d => `<tr><th scope="row"><div class="table-entity">${entityThumbnail(d)}<div>${e(d.name)}<br><span class="muted small">${e(factLabel(kb, 'category', d.category))}</span></div></div></th>${attrs.map(([key]) => `<td>${d.attributes[key]}</td>`).join('')}${facts.map(([key]) => `<td>${e(factLabel(kb, key, d.facts[key]))}</td>`).join('')}<td class="description-cell">${e(d.description)}</td></tr>`).join(''), 'entities-table');
  const dictionary = `<dl class="dictionary">${attrs.map(([key, a]) => `<div><dt>${e(a.name)} ${code(key)}</dt><dd>${e(a.description)}</dd><dd>${e(a.scale)}</dd></div>`).join('')}</dl><h3>Дополнительные факты (${definitions.length})</h3><dl class="dictionary">${definitions.map(([key, f]) => `<div><dt>${e(f.name)} ${code(key)}</dt><dd>${e(f.description || f.values.map(v => v.label).join(', '))}</dd></div>`).join('')}</dl>`;
  const questions = table('Вопросы, ответы и связи с правилами', ['№ / id', 'Иллюстрация', 'Вопрос', 'Группа', 'Параметр', 'Все ответы и коды', 'Связанные правила'], kb.questions.map((q, i) => {
    const conditions = kb.rules.filter(r => r.if.param === q.param);
    const targets = derive.filter(r => r.then.some(a => a.param === q.param));
    return `<tr data-search-row="questions"><th scope="row">${i + 1}<br>${e(q.id)}</th><td><img class="question-thumb" src="./${e(q.image)}" alt="${e(q.imageAlt)}" width="96" height="60" loading="lazy"></td><td>${e(q.text)}</td><td>${e(q.group)}</td><td>${e(q.label)}<br>${code(q.param)}</td><td>${list(q.options.map(o => `${e(o.label)}<br>${code(o.value)}`))}</td><td><p>В условии: ${conditions.map(ruleLink).join(', ') || 'нет'}</p>${targets.length ? list(targets.map(r => `Может быть пропущен по правилу ${ruleLink(r)} (параметр в выводе)`)) : '<p class="muted">Вывод не пропускает этот вопрос.</p>'}</td></tr>`;
  }).join(''), 'questions-table');
  const ruleSection = (type, rules, title) => section(`kb-${type}`, `${title} (<span data-result-count>${rules.length}</span> из ${rules.length})`, search('rules', 'Поиск по обоим видам правил') + table(title, ['id', 'ЕСЛИ', 'ТО', 'Пояснение'], rules.map(r => `<tr id="rule-${e(r.id)}" tabindex="-1" data-search-row="rules"><th scope="row">${e(r.id)}</th><td>ЕСЛИ ${e(kb.parameters[r.if.param].label)} ${code(r.if.param)} = ${e(valueLabel(kb, r.if.param, r.if.eq))} ${code(r.if.eq)}</td><td>ТО ${list(r.then.map(a => type === 'derive' ? assignment(kb, a) : effect(kb, a)))}</td><td>${e(r.explain)}</td></tr>`).join(''), 'rules-table') + noResults);
  const sources = Object.entries(sourceData).map(([name, data]) => `<details class="json-details"><summary>${e(name)} (${name === 'entities.json' ? `${kb.entities.length} объектов` : name === 'questions.json' ? `${kb.questions.length} вопросов` : `${kb.rules.length} правил`})</summary>${jsonView(data, name)}</details>`).join('');
  return `<div class="page-intro"><h1>База знаний</h1><p>${kb.entities.length} стратегий · ${attrs.length} атрибутов · ${kb.questions.length} вопросов · ${kb.rules.length} правил</p></div>${nav}
    ${section('kb-objects', `Объекты (${kb.entities.length})`, `<p class="empty">${e(kb.note)}</p><p class="muted small">Шкала 1–5. Все свойства доступны при горизонтальной прокрутке таблицы.</p>${objects}`)}
    ${section('kb-attributes', `Атрибуты (${attrs.length})`, dictionary)}
    ${section('kb-questions', `База вопросов (<span data-result-count>${kb.questions.length}</span> из ${kb.questions.length})`, search('questions', 'Поиск по вопросам, ответам, параметрам и правилам') + questions + noResults)}
    ${ruleSection('derive', derive, 'Правила «параметр → параметр»')}${ruleSection('score', score, 'Правила «параметр → атрибут»')}
    ${section('kb-json', 'Исходные данные (3 JSON-файла)', '<p class="muted">Содержимое файлов, загруженных через fetch(). Только чтение: это автономная база знаний приложения.</p>' + sources)}`;
}
export function databaseView(kb, database, answers, ranking) {
  const known = Object.keys(database.facts).length;
  const nav = navigation('database', [['db-parameters', 'Параметры', kb.questions.length], ['db-history', 'История ответов', answers.length], ['db-log', 'Журнал правил', database.log.length], ['db-scores', 'Оценки объектов', ranking.length], ['db-json', 'Снимок JSON', known]]);
  const params = table('Текущие параметры пользователя', ['Параметр', 'Состояние вопроса', 'Значение', 'Источник / основание'], kb.questions.map(q => {
    const fact = database.facts[q.param];
    const answer = answers.find(a => a.questionId === q.id);
    const status = fact?.source === 'derived'
      ? answer ? `Ответ: не важно; затем выведен правилом ${fact.ruleId}` : `Пропущен (выведен правилом ${fact.ruleId})`
      : answer ? answer.value === null ? 'Ответ: не важно' : 'Ответ пользователя' : 'Не задан';
    const source = fact ? `<span class="source ${fact.source}">${fact.source === 'user' ? 'Пользователь' : 'Логический вывод'}</span><br>${e(fact.questionId || fact.ruleId)}` : 'Нет факта';
    return `<tr><th scope="row">${e(q.label)}<br>${code(q.param)}</th><td>${e(status)}</td><td>${fact ? `${e(valueLabel(kb, q.param, fact.value))}<br>${code(fact.value)}` : '—'}</td><td>${source}</td></tr>`;
  }).join(''), 'parameters-table');
  const history = answers.length ? table('История явных ответов', ['Шаг', 'Вопрос', 'Ответ', 'Выведенные факты на этом шаге'], answers.map((a, index) => {
    const q = kb.questions.find(item => item.id === a.questionId);
    const derived = database.log.filter(entry => entry.type === 'derive' && entry.step === index + 1);
    return `<tr><th scope="row">${index + 1}</th><td>${e(q.id)}. ${e(q.text)}</td><td>${e(valueLabel(kb, q.param, a.value))}<br>${code(a.value)}</td><td>${derived.length ? list(derived.flatMap(entry => entry.assignments.map(action => `${e(entry.ruleId)}: ${assignment(kb, action)}`))) : 'Нет новых фактов'}</td></tr>`;
  }).join(''), 'history-table') : '<p class="empty">Ответов пока нет. Начните консультацию.</p>';
  const log = database.log.length ? `<ol class="log">${database.log.map(entry => `<li><strong>${e(entry.ruleId)}</strong> · Шаг ${entry.step} · ${entry.type === 'derive' ? 'Вывод факта' : 'Начисление баллов'}<p>${e(entry.explain)}</p>${entry.assignments ? list(entry.assignments.map(a => assignment(kb, a))) : ''}</li>`).join('')}</ol>` : '<p class="empty">Правила ещё не срабатывали.</p>';
  const scores = table('Текущие оценки всех объектов', ['Место', 'Стратегия', 'Исходная сумма', 'Оценка 0–100', 'Активных правил', 'Вклады правил'], ranking.map((row, i) => `<tr><th scope="row">${i + 1}</th><td><div class="table-entity">${entityThumbnail(row.entity)}<div>${e(row.entity.name)}</div></div></td><td>${n(row.rawScore)}</td><td>${n(row.score)}</td><td>${row.contributions.length}</td><td><details class="score-contributions"><summary>Вклады (${row.contributions.length})</summary>${row.contributions.length ? list(row.contributions.map(c => `<strong>${e(c.ruleId)}: ${signed(c.points)}</strong><p>${e(c.explain)}</p>${list(c.effects.map(action => `${effect(kb, action)} → ${signed(action.points)}`))}`)) : '<p>Нет активных правил. Нейтральная оценка — 50.</p>'}</details></td></tr>`).join(''), 'scores-table');
  return `<div class="page-intro"><h1>Рабочая база данных</h1><p>Текущий сеанс: ${answers.length} ответов, ${known} фактов, ${database.log.length} срабатываний правил.</p></div>${nav}
    ${section('db-parameters', `Параметры пользователя (${kb.questions.length}, задано ${known})`, params)}
    ${section('db-history', `История ответов (${answers.length})`, history)}
    ${section('db-log', `Журнал сработавших правил (${database.log.length})`, '<p class="muted small">Записи расположены в порядке срабатывания. Шаг — номер явного ответа; каждое правило записывается один раз.</p>' + log)}
    ${section('db-scores', `Текущие оценки всех объектов (${ranking.length})`, '<p class="muted small">Число активных правил включает правила с нулевым вкладом для данной стратегии. Рейтинг обновляется после каждого ответа и возврата.</p>' + scores)}
    ${section('db-json', `Снимок РБД (${known} фактов · ${answers.length} ответов · ${database.log.length} срабатываний)`, '<p class="muted">Точное текущее состояние: факты, журнал, упорядоченные ответы и номер шага. Снимок обновляется при пересчёте.</p><button type="button" class="button primary" data-download-database>Скачать JSON</button>' + jsonView(workingSnapshot(database, answers), 'Снимок рабочей базы данных'))}`;
}
