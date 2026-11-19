// Представления оригинальных схем и рейтинга. Механизм вывода не зависит от них.
const e = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const n = value => value.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const signed = value => `${value > 0 ? '+' : ''}${n(value)}`;
const pointsClass = value => value > 0 ? 'points positive' : value < 0 ? 'points negative' : 'points zero';
export function illustrationImage(entity, className = '') {
  const p = entity.illustration;
  return `<img class="${className}" src="./${e(p.src)}" alt="${e(p.alt)}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async">`;
}
export function entityThumbnail(entity) {
  return `<span class="thumbnail-stage" data-family="${e(entity.category)}">${illustrationImage(entity, 'entity-thumb')}</span>`;
}
export function topReasons(row) {
  return row.contributions.filter(c => c.points > 0).sort((a, b) => b.points - a.points || a.ruleId.localeCompare(b.ruleId)).slice(0, 3);
}
function movement(id, index, previous) {
  if (!previous.has(id)) return '';
  const difference = previous.get(id) - index;
  const label = difference > 0 ? `Поднялся на ${difference}` : difference < 0 ? `Опустился на ${-difference}` : 'Позиция не изменилась';
  return `<span class="movement ${difference > 0 ? 'up' : difference < 0 ? 'down' : ''}" aria-label="${label}" title="${label}">${difference > 0 ? '↑' : difference < 0 ? '↓' : '→'}${difference ? Math.abs(difference) : ''}</span>`;
}
function explanation(row) {
  return `<details class="explanation"><summary>Почему такое место</summary><p>Исходная сумма: <strong>${n(row.rawScore)}</strong>. Нормированная оценка: <strong>${n(row.score)} из 100</strong>. При равной сумме учитываются надёжность и название.</p>${row.contributions.length ? `<ul>${row.contributions.map(c => `<li><span class="rule-ref">${e(c.ruleId)}</span>: <strong class="${pointsClass(c.points)}">${signed(c.points)}</strong> балла. ${e(c.explain)}<ul>${c.effects.map(action => `<li><code>${e(action.attr)} · ${e(action.op)}</code> · вес ${signed(action.weight)}${Object.hasOwn(action, 'value') ? ` · порог ${e(action.value)}` : ''} → <span class="${pointsClass(action.points)}">${signed(action.points)}</span></li>`).join('')}</ul></li>`).join('')}</ul>` : '<p>Активных правил пока нет. Все стратегии имеют равную оценку 50.</p>'}</details>`;
}
function leader(kb, row, { full, previousPositions, changed, allEqual }) {
  const { entity } = row;
  const reasons = topReasons(row);
  const reasonText = reasons.length ? `<ul class="leader-reasons">${reasons.map(c => {
    const rule = kb.rules.find(r => r.id === c.ruleId);
    const param = kb.parameters[rule.if.param];
    const answer = param.options.find(o => o.value === rule.if.eq).label;
    return `<li><a class="rule-ref" href="#rule-${e(c.ruleId)}" data-open-store="knowledge" data-open-section="kb-score" data-rule="${e(c.ruleId)}">${e(c.ruleId)}</a><span>${e(param.label)}: ${e(answer)}</span><strong>${signed(c.points)}</strong></li>`;
  }).join('')}</ul>` : `<p class="leader-empty">${allEqual ? 'Рейтинг начнёт меняться после ответов. Первое место определено надёжностью и названием.' : 'Положительных вкладов пока нет. Полный расчёт доступен в рабочей базе.'}</p>`;
  return `<li class="rank-item leader-card${changed ? ' leader-changed' : ''}" data-entity="${e(entity.id)}"><div class="leader-ribbon"><strong>01 · Лидер подбора</strong><span>${allEqual ? 'Пока все варианты равны' : 'Лучшее соответствие сейчас'}</span></div><div class="leader-heading"><h3 class="entity-name">${e(entity.name)}${movement(entity.id, 0, previousPositions)}</h3><div class="hero-score"><strong class="score">${n(row.score)}</strong><span>/ 100</span></div></div><span class="rank-bar" aria-hidden="true"><span style="width:${row.score}%"></span></span><div class="leader-body"><figure class="leader-illustration"><div class="illustration-stage">${illustrationImage(entity, 'hero-illustration')}</div></figure><p class="leader-description">${e(entity.description)}</p></div><div class="entity-badges">${Object.entries(kb.factDefinitions).filter(([key]) => key !== "category").slice(0,3).map(([key,definition]) => `<span>${e(definition.values.find(v => v.value === entity.facts[key])?.label ?? entity.facts[key])}</span>`).join("")}</div><div class="leader-reason-block"><h4>${reasons.length ? 'Почему эта стратегия' : 'С чего начинается выбор'}</h4>${reasonText}</div>${full ? explanation(row) : ''}</li>`;

}
export function rankingView(kb, ranking, { full = false, previousPositions = new Map(), changed = false } = {}) {
  const allEqual = ranking.every(row => row.rawScore === ranking[0].rawScore);
  return (full ? ranking : ranking.slice(0, 5)).map((row, index) => index === 0
    ? leader(kb, row, { full, previousPositions, changed, allEqual })
    : `<li class="rank-item compact-entity" data-place="${index + 1}" data-entity="${e(row.entity.id)}" data-family="${e(kb.factDefinitions.category.values.find(v => v.value === row.entity.category)?.label ?? row.entity.category)}"><div class="compact-main"><span class="place">${index + 1}</span>${entityThumbnail(row.entity)}<div class="compact-name"><span class="entity-name">${e(row.entity.name)}${movement(row.entity.id, index, previousPositions)}</span><span class="muted small">${e(kb.factDefinitions.category.values.find(v => v.value === row.entity.category)?.label ?? row.entity.category)}</span></div><span class="score">${n(row.score)}</span></div><span class="rank-bar" aria-hidden="true"><span style="width:${row.score}%"></span></span>${full ? explanation(row) : ''}</li>`).join('');
}
