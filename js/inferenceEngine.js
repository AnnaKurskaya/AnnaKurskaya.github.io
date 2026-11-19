/** Monotonic forward chaining: known facts are never overwritten. First rule wins. */
export function forwardChain(kb, database) {
  const facts = Object.fromEntries(Object.entries(database.facts).map(([key, fact]) => [key, { ...fact }]));
  const log = database.log.map(entry => entry.assignments
    ? { ...entry, assignments: entry.assignments.map(a => ({ ...a })) }
    : { ...entry });
  let changed;
  do {
    changed = false;
    for (const rule of kb.rules.filter(r => r.type === 'derive')) {
      if (facts[rule.if.param]?.value !== rule.if.eq) continue;
      const assignments = rule.then.filter(action => !Object.hasOwn(facts, action.param));
      if (!assignments.length) continue;
      for (const { param, value } of assignments) facts[param] = { value, source: 'derived', ruleId: rule.id };
      log.push({ ruleId: rule.id, type: 'derive', explain: rule.explain, step: database.step, assignments: assignments.map(a => ({ ...a })) });
      changed = true;
    }
  } while (changed);
  const fired = new Set(log.filter(entry => entry.type === 'score').map(entry => entry.ruleId));
  for (const rule of kb.rules.filter(r => r.type === 'score')) {
    if (facts[rule.if.param]?.value === rule.if.eq && !fired.has(rule.id)) log.push({ ruleId: rule.id, type: 'score', explain: rule.explain, step: database.step });
  }
  return { facts, log, step: database.step };
}

export function nextQuestion(kb, answers, database) {
  const answered = new Set(answers.map(a => a.questionId));
  return kb.questions.find(q => !answered.has(q.id) && !Object.hasOwn(database.facts, q.param)) || null;
}

/** Replay user events in order; used equally for answering, undo and restarting. */
export function infer(kb, answers = []) {
  let database = { facts: {}, log: [], step: 0 };
  const processed = [];
  for (const answer of answers) {
    const q = nextQuestion(kb, processed, database);
    if (!q || q.id !== answer.questionId || !q.options.some(o => o.value === answer.value)) throw new Error('Ответ не соответствует текущему вопросу');
    database = { ...database, step: processed.length + 1 };
    if (answer.value !== null) database.facts[q.param] = { value: answer.value, source: 'user', questionId: q.id };
    processed.push(answer);
    database = forwardChain(kb, database);
  }
  return database;
}
