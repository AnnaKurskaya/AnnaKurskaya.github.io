import { createKnowledgeBase, valueLabel } from './knowledgeBase.js';
import { infer, nextQuestion } from './inferenceEngine.js';
import { rankEntities } from './ranking.js';
import { rankingView } from './entityViews.js';
import { knowledgeView, databaseView, workingSnapshot } from './inspectionViews.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const number = value => value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
let kb;
let sourceData;
const selectedSections = { knowledge: 'kb-objects', database: 'db-parameters' };
let answers = [];
let database;
let ranking = [];
let previousPositions = new Map();
let finishedEarly = false;
let lastRenderedLeader;

const tabs = [...document.querySelectorAll('[role="tab"]')];
const compactNavigation = window.matchMedia('(max-width: 960px)');
function updateNavigationOrientation() {
  $('[role="tablist"]').setAttribute('aria-orientation', compactNavigation.matches ? 'horizontal' : 'vertical');
}
compactNavigation.addEventListener('change', updateNavigationOrientation);
updateNavigationOrientation();
function selectTab(tab, focus = false) {
  for (const item of tabs) {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  }
  window.scrollTo({ top: 0, behavior: 'auto' });
  if (focus) tab.focus();
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    const directions = compactNavigation.matches ? { ArrowRight: 1, ArrowLeft: -1 } : { ArrowDown: 1, ArrowUp: -1 };
    let target;
    if (Object.hasOwn(directions, event.key)) target = (index + directions[event.key] + tabs.length) % tabs.length;
    if (event.key === 'Home') target = 0;
    if (event.key === 'End') target = tabs.length - 1;
    if (target !== undefined) { event.preventDefault(); selectTab(tabs[target], true); }
  });
});

function selectInspection(store, id, focus = false) {
  const root = document.getElementById(store);
  const section = document.getElementById(id);
  if (!root || !section || !root.contains(section)) return;
  selectedSections[store] = id;
  for (const panel of root.querySelectorAll('[data-inspection-section]')) panel.hidden = panel !== section;
  for (const button of root.querySelectorAll('[data-section]')) button.setAttribute('aria-pressed', String(button.dataset.section === id));
  if (focus) {
    const heading = section.querySelector('h2');
    heading.focus({ preventScroll: true });
    heading.scrollIntoView({ block: 'start' });
  }
}
function addInspectionLinks() {
  const target = $('#consultation .final-header') || $('#consultation .page-intro');
  target.insertAdjacentHTML('afterend', '<div class="inspection-shortcuts"><a href="#db-parameters" data-open-store="database" data-open-section="db-parameters">Рабочая база ↗</a><a href="#kb-questions" data-open-store="knowledge" data-open-section="kb-questions">Все вопросы ↗</a></div>');
}
function filterRows(kind, query) {
  const normalized = query.trim().toLocaleLowerCase('ru');
  for (const input of document.querySelectorAll(`[data-filter="${kind}"]`)) if (input.value !== query) input.value = query;
  for (const section of $('#knowledge').querySelectorAll('[data-inspection-section]')) {
    const rows = [...section.querySelectorAll(`[data-search-row="${kind}"]`)];
    if (!rows.length) continue;
    for (const row of rows) row.hidden = !row.textContent.toLocaleLowerCase('ru').includes(normalized);
    const visible = rows.filter(row => !row.hidden).length;
    section.querySelector('[data-result-count]').textContent = visible;
    section.querySelector('.filter-empty').hidden = visible !== 0;
  }
}
document.addEventListener('input', event => {
  if (event.target.matches('[data-filter]')) filterRows(event.target.dataset.filter, event.target.value);
});
document.addEventListener('click', event => {
  const shortcut = event.target.closest('[data-open-store]');
  if (shortcut) {
    event.preventDefault();
    const { openStore, openSection, rule } = shortcut.dataset;
    selectTab(document.getElementById(`tab-${openStore}`));
    if (rule) filterRows('rules', '');
    selectInspection(openStore, openSection, true);
    if (rule) {
      const row = document.getElementById(`rule-${rule}`);
      row.focus({ preventScroll: true });
      row.scrollIntoView({ block: 'center' });
    }
    return;
  }
  const sectionButton = event.target.closest('[data-section]');
  if (sectionButton) selectInspection(sectionButton.dataset.store, sectionButton.dataset.section, true);
  if (event.target.closest('[data-download-database]') && kb) {
    const blob = new Blob([JSON.stringify(workingSnapshot(database, answers), null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'homescapes-expert-session.json';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
});

function rankingRows(full = false) {
  const changed = Boolean(lastRenderedLeader && lastRenderedLeader !== ranking[0].entity.id);
  lastRenderedLeader = ranking[0].entity.id;
  return rankingView(kb, ranking, { full, previousPositions, changed });
}
function derivedPanel() {
  const answered = new Set(answers.map(a => a.questionId));
  const facts = Object.entries(database.facts).filter(([, fact]) => fact.source === 'derived');
  return `<section class="panel inferred"><h2>Что уже известно</h2>${facts.length
    ? `<p class="muted small">Выведенные факты автоматически пропускают вопросы, ответы на которые уже известны.</p><ul class="fact-chips">${facts.map(([param, fact]) => {
      const question = kb.questions.find(q => q.param === param);
      return `<li class="fact-chip"><div class="fact-chip-head"><span class="rule-ref">${escape(fact.ruleId)}</span><span class="muted small">${answered.has(question.id) ? 'После нейтрального ответа' : `Пропущен ${escape(question.id)}`}</span></div><strong>${escape(kb.parameters[param].label)}:</strong> <span>${escape(valueLabel(kb, param, fact.value))}</span></li>`;
    }).join('')}</ul>`
    : `<p class="empty">${answers.length ? 'Пока нет выведенных фактов. Система учитывает ваши явные ответы.' : 'Здесь появятся ответы и выводы системы.'}</p>`}</section>`;
}
function chain() {
  if (!answers.length) return '<p class="empty">Консультация завершена без ответов. Все объекты имеют равный рейтинг.</p>';
  return `<ol class="chain">${answers.map((answer, index) => {
    const q = kb.questions.find(item => item.id === answer.questionId);
    const derived = database.log.filter(entry => entry.type === 'derive' && entry.step === index + 1);
    return `<li><img class="chain-thumb" src="./${escape(q.image)}" alt="${escape(q.imageAlt)}" width="64" height="40" loading="lazy"><strong>${escape(q.id)}. ${escape(q.text)}</strong><span class="answer-value">${escape(valueLabel(kb, q.param, answer.value))}</span>${derived.map(entry => `<p class="small"><span class="rule-ref">${escape(entry.ruleId)}</span> → ${entry.assignments.map(a => `${escape(kb.parameters[a.param].label)}: ${escape(valueLabel(kb, a.param, a.value))}`).join('; ')}</p>`).join('')}</li>`;
  }).join('')}</ol>`;
}
function renderConsultation() {
  const q = nextQuestion(kb, answers, database);
  const isFinal = finishedEarly || !q;
  const derivedCount = Object.values(database.facts).filter(f => f.source === 'derived').length;
  if (isFinal) {
    $('#consultation').innerHTML = `<div class="final-header"><div class="page-intro"><h1 id="consultation-heading" tabindex="-1">Ваш итоговый рейтинг</h1><p>Все ${ranking.length} стратегий · Ответов: ${answers.length} · Выведено фактов: ${derivedCount}</p></div><div class="session-actions">${q ? '<button class="button primary" data-action="continue">Продолжить</button>' : ''}<button class="button" data-action="back" ${answers.length ? '' : 'disabled'}>Назад</button><button class="text-button" data-action="restart">Начать заново</button></div></div>
      <p class="muted small">Оценка — условное соответствие предпочтениям по шкале 0–100. Стрелки показывают изменение места относительно предыдущего шага.</p>
      <div class="final-layout"><section class="panel final-ranking" aria-label="Полный рейтинг"><ol class="rank-list">${rankingRows(true)}</ol></section><aside><section class="panel chain-panel"><h2>Цепочка ответов</h2><p class="muted small">Последовательность для построения графа выбора в отчёте. Стрелками показаны выведенные факты.</p>${chain()}</section>${derivedPanel()}</aside></div>`;
    addInspectionLinks();
    return;
  }
  const questionIndex = kb.questions.indexOf(q) + 1;
  const completed = kb.questions.filter(item => answers.some(a => a.questionId === item.id) || Object.hasOwn(database.facts, item.param)).length;
  const skippedCount = Object.values(database.facts).filter(f => f.source === 'derived').length;
  const meaningfulOptions = q.options.filter(o => o.value !== null);
  const useGrid = meaningfulOptions.length >= 4 && meaningfulOptions.every(o => o.label.length <= 36);
  const progressPct = Math.round(completed / kb.questions.length * 100);
  $('#consultation').innerHTML = `<div class="page-intro"><h1>Найдём подход к вашему уровню</h1><p>Опишите ситуацию на поле — сравним 20 стратегий.</p></div>
    <div class="consultation-grid"><div><section class="panel question-panel" aria-labelledby="question-heading"><div class="question-main"><div class="question-meta"><div class="question-meta-left"><strong>Вопрос ${questionIndex} из ${kb.questions.length}</strong><span class="group-pill">${escape(q.group)}</span>${skippedCount ? `<span class="skip-pill">Пропущено выводом: ${skippedCount}</span>` : ''}</div><span class="progress-pct">${progressPct}%</span></div><progress max="${kb.questions.length}" value="${completed}" aria-label="Пройдено вопросов: ${completed} из ${kb.questions.length}"></progress><div class="question-prompt"><h2 class="question-title" id="question-heading" tabindex="-1">${escape(q.text)}</h2><img class="question-illustration" src="./${escape(q.image)}" alt="${escape(q.imageAlt)}" width="320" height="200" decoding="async"></div><div class="answers${useGrid ? ' answers-grid' : ''}">${q.options.map((option, index) => `<button class="answer ${option.value === null ? 'neutral' : ''}" data-option="${index}"><span class="answer-label">${escape(option.label)}</span>${option.value === null ? '' : '<span class="answer-arrow" aria-hidden="true">→</span>'}</button>`).join('')}</div></div><div class="question-actions"><button class="button" data-action="back" ${answers.length ? '' : 'disabled'}>Назад</button><button class="button primary" data-action="finish">Завершить досрочно</button></div></section><div class="session-actions"><button class="text-button" data-action="restart">Начать заново</button></div>${derivedPanel()}</div>
    <aside class="panel ranking-panel" aria-label="Живой рейтинг"><h2>Подходящие стратегии</h2><p class="ranking-caption">Топ-5 · обновляется после ответа</p><ol class="rank-list">${rankingRows()}</ol><p class="ranking-note">${database.log.some(entry => entry.type === 'score') ? 'Рейтинг пересчитан с учётом всех известных фактов. Стрелки — изменение места с предыдущего шага.' : 'Баллы отражают соответствие вашим ответам. Сейчас все оценки равны; порядок задан надёжностью и названием.'}</p></aside></div>`;
  addInspectionLinks();
}
function renderDatabase() {
  $('#database').innerHTML = databaseView(kb, database, answers, ranking);
  selectInspection('database', selectedSections.database);
}
function renderKnowledge() {
  $('#knowledge').innerHTML = knowledgeView(kb, sourceData);
  selectInspection('knowledge', selectedSections.knowledge);
}
function recompute({ reset = false, focus = true } = {}) {
  previousPositions = reset ? new Map() : new Map(ranking.map((row, index) => [row.entity.id, index]));
  database = infer(kb, answers);
  ranking = rankEntities(kb, database);
  renderConsultation();
  renderDatabase();
  if (focus) {
    const target = $('#question-heading') || $('#consultation-heading');
    target?.focus({ preventScroll: true });
    $('#announcement').textContent = `Рейтинг обновлён. Лидер: ${ranking[0].entity.name}, ${number(ranking[0].score)} балла. ${nextQuestion(kb, answers, database) && !finishedEarly ? 'Следующий вопрос готов.' : 'Показан полный рейтинг.'}`;
  }
}
$('#consultation').addEventListener('click', event => {
  if (!kb) return;
  const button = event.target.closest('button');
  if (!button) return;
  if (button.hasAttribute('data-option')) {
    const q = nextQuestion(kb, answers, database);
    const option = q?.options[Number(button.dataset.option)];
    if (!option || finishedEarly) return;
    answers.push({ questionId: q.id, value: option.value });
    recompute();
    return;
  }
  switch (button.dataset.action) {
    case 'back': answers.pop(); finishedEarly = false; recompute(); break;
    case 'restart': answers = []; finishedEarly = false; recompute({ reset: true }); break;
    case 'finish': finishedEarly = true; renderConsultation(); $('#consultation-heading').focus(); break;
    case 'continue': finishedEarly = false; renderConsultation(); $('#question-heading').focus(); break;
  }
});

async function load() {
  try {
    const data = await Promise.all(['entities', 'questions', 'rules'].map(async name => {
      const response = await fetch(new URL(`../data/${name}.json`, import.meta.url));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    }));
    kb = createKnowledgeBase(...data);
    sourceData = Object.fromEntries(['entities.json', 'questions.json', 'rules.json'].map((name, i) => [name, data[i]]));
    renderKnowledge();
    recompute({ reset: true, focus: false });
  } catch {
    $('#load-error').hidden = false;
  } finally {
    $('#loading').hidden = true;
  }
}
load();
