import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createKnowledgeBase} from '../js/knowledgeBase.js';
import {infer,forwardChain,nextQuestion} from '../js/inferenceEngine.js';
import {rankEntities,effectPoints} from '../js/ranking.js';
import {rankingView} from '../js/entityViews.js';
import {knowledgeView,databaseView,workingSnapshot} from '../js/inspectionViews.js';
const read = name => JSON.parse(fs.readFileSync(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
const data=[read('entities'),read('questions'),read('rules')];
const kb=createKnowledgeBase(...data);
const sources=Object.fromEntries(['entities','questions','rules'].map((s,i)=>[s+'.json',data[i]]));
const sourceConditions=new Set(kb.rules.filter(r=>r.type==='derive').map(r=>r.if.param));
export function consult(choices={}) {
  const answers=[],steps=[];
  let db=infer(kb),q;
  while((q=nextQuestion(kb,answers,db))) {
    answers.push({questionId:q.id,value:Object.hasOwn(choices,q.param)?choices[q.param]:null});
    db=infer(kb,answers);
    steps.push({questionId:q.id,param:q.param,value:answers.at(-1).value,ranking:rankEntities(kb,db).slice(0,5).map(r=>({name:r.entity.name,score:r.score})),derived:db.log.filter(l=>l.type==='derive'&&l.step===answers.length)});
  }
  return {answers,steps,db,ranking:rankEntities(kb,db)};
}
test('База: 20 стратегий, 12 свойств, 28 параметров и 94 правила',()=>{
  assert.equal(kb.entities.length,20);assert.equal(Object.keys(kb.attributes).length,12);
  assert.equal(kb.questions.length,28);assert.equal(Object.keys(kb.parameters).length,28);
  assert.equal(kb.rules.filter(r=>r.type==='derive').length,10);
  assert.equal(kb.rules.filter(r=>r.type==='score').length,84);
});
test('Все значимые ответы имеют балльное правило, нейтральные — не имеют',()=>{
  for(const q of kb.questions) for(const o of q.options) assert.equal(kb.rules.some(r=>r.type==='score'&&r.if.param===q.param&&r.if.eq===o.value),o.value!==null);
});
test('Все иллюстрации существуют, это локальные безопасные SVG',()=>{
  for(const src of [...kb.questions.map(q=>q.image),...kb.entities.map(e=>e.illustration.src)]) {
    const text=fs.readFileSync(new URL('../'+src,import.meta.url),'utf8');
    assert.match(text,/<svg/);assert.doesNotMatch(text,/<script|<image|onload=|(?:href|src)=["']https?:/i);
  }
});
for(const [name,mutate] of [
  ['повтор объекта',d=>d[0].entities[1].id=d[0].entities[0].id],
  ['значение свойства вне 1–5',d=>d[0].entities[0].attributes.speed=6],
  ['ссылка на неизвестный параметр',d=>d[2].rules[0].if.param='missing'],
  ['ссылка на неизвестное свойство',d=>d[2].rules.find(r=>r.type==='score').then[0].attr='missing'],
  ['нечисловой вес',d=>d[2].rules.find(r=>r.type==='score').then[0].weight='2'],
  ['недопустимый вывод',d=>d[2].rules.find(r=>r.type==='derive').then[0].value='missing'],
  ['неизвестный критерий равенства',d=>d[0].rankingPolicy.tieBreakAttribute='missing']
]) test('Валидация отклоняет: '+name,()=>{const d=structuredClone(data);mutate(d);assert.throws(()=>createKnowledgeBase(...d));});
test('Нет фактов: все оценки 50, порядок стабилен',()=>{
  const r=rankEntities(kb,infer(kb));assert.ok(r.every(v=>v.score===50&&v.rawScore===0));assert.deepEqual(r,rankEntities(kb,infer(kb)));
});
test('Цепочка: критически мало ходов → скорость → короткая подготовка',()=>{
  const c=consult({movesPressure:'critical'});
  assert.deepEqual(c.db.facts.speedPriority,{value:'high',source:'derived',ruleId:'D04'});
  assert.deepEqual(c.db.facts.planningTime,{value:'short',source:'derived',ruleId:'D05'});
  assert.ok(!c.answers.some(a=>['Q12','Q13'].includes(a.questionId)));
});
test('Цепочка экономии: беречь ресурсы → избегать бустеров → приоритет экономии',()=>{
  const c=consult({resourcePolicy:'save'});
  assert.equal(c.db.facts.resourcePriority.value,'high');assert.equal(c.db.facts.resourcePriority.ruleId,'D07');
  assert.equal(c.answers.length,26);
});
test('Нейтральные ответы учитываются как ответы, не становятся фактами',()=>{
  const c=consult();assert.equal(c.answers.length,28);assert.deepEqual(c.db.facts,{});assert.deepEqual(c.db.log,[]);
});
test('Запуск до неподвижной точки работает при обратном порядке правил',()=>{
  const reversed={...kb,rules:[...kb.rules].reverse()};
  const start={facts:{movesPressure:{value:'critical',source:'user'}},log:[],step:1};
  assert.equal(forwardChain(reversed,start).facts.planningTime.value,'short');
  assert.deepEqual(start.log,[]);assert.equal(Object.keys(start.facts).length,1);
});
test('Вывод не перезаписывает явный факт и не дублирует журнал',()=>{
  const start={facts:{speedPriority:{value:'high',source:'user'},planningTime:{value:'long',source:'user'}},log:[],step:1};
  const first=forwardChain(kb,start);assert.equal(first.facts.planningTime.value,'long');
  assert.deepEqual(forwardChain(kb,first),first);
});
test('Цикл правил завершается, при конфликте выигрывает первое правило',()=>{
  const rule=(id,p,v,t,w)=>({id,type:'derive',if:{param:p,eq:v},then:[{param:t,value:w}],explain:id});
  const mini={rules:[rule('a','x',1,'y',2),rule('b','x',1,'y',3),rule('c','y',2,'x',1)]};
  const r=forwardChain(mini,{facts:{x:{value:1,source:'user'}},log:[],step:1});
  assert.equal(r.facts.y.value,2);assert.equal(r.log.length,1);
});
test('Возврат и другой ответ удаляют прежние производные факты',()=>{
  const prefix=[{questionId:'Q01',value:null},{questionId:'Q02',value:null}];
  const first=infer(kb,[...prefix,{questionId:'Q03',value:'critical'}]);
  assert.ok(first.facts.planningTime);
  const second=infer(kb,[...prefix,{questionId:'Q03',value:'comfortable'}]);
  assert.equal(second.facts.planningTime,undefined);assert.equal(nextQuestion(kb,prefix,infer(kb,prefix)).id,'Q03');
});
test('Неверный порядок вопросов и отсутствующий вариант отвергаются',()=>{
  assert.throws(()=>infer(kb,[{questionId:'Q02',value:null}]));
  assert.throws(()=>infer(kb,[{questionId:'Q01',value:'missing'}]));
});
test('Все варианты пропусков: полная консультация содержит минимум 21 ответ',()=>{
  let leaves=0,min=Infinity,max=0;
  function walk(answers,db) {
    const q=nextQuestion(kb,answers,db);
    if(!q){leaves++;min=Math.min(min,answers.length);max=Math.max(max,answers.length);return;}
    for(const o of sourceConditions.has(q.param)?q.options:[q.options.find(o=>o.value===null)]) {
      const next=[...answers,{questionId:q.id,value:o.value}];
      const pending={...db,facts:{...db.facts},step:next.length};
      if(o.value!==null)pending.facts[q.param]={value:o.value,source:'user',questionId:q.id};
      walk(next,forwardChain(kb,pending));
    }
  }
  walk([],infer(kb));assert.equal(min,21);assert.equal(max,28);assert.ok(leaves>1000);
  console.log(JSON.stringify({skipBranches:leaves,minAnswers:min,maxAnswers:max}));
});
test('Формулы high, low, eq, gte, lte и отрицательный штраф',()=>{
  const e={attributes:{x:4},facts:{focus:'mixed'},category:'combo'};
  for(const [op,value,want] of [['high',undefined,8],['low',undefined,4],['eq',4,2],['eq',3,0],['gte',4,2],['lte',3,0]]) assert.equal(effectPoints({attr:'x',op,weight:2,value},e),want);
  assert.equal(effectPoints({attr:'focus',op:'eq',value:'mixed',weight:-3},e),-3);
  assert.equal(effectPoints({attr:'category',op:'eq',value:'combo',weight:3},e),3);
});
test('Общие границы включают отрицательные веса: концы шкалы 0 и 100',()=>{
  const mini={rankingPolicy:{tieBreakAttribute:'x'},entities:[1,5].map(x=>({id:String(x),name:String(x),attributes:{x},facts:{}})),rules:[{id:'R',type:'score',if:{param:'p',eq:'v'},then:[{attr:'x',op:'high',weight:-2}],explain:'penalty'}]};
  const r=rankEntities(mini,{facts:{p:{value:'v'}}});assert.deepEqual(r.map(v=>v.score),[100,0]);assert.deepEqual(r.map(v=>v.rawScore),[-2,-10]);
});
test('Равенство разрешается свойством, заданным в данных',()=>{
  const alternate={...kb,rankingPolicy:{tieBreakAttribute:'speed'}};
  assert.equal(rankEntities(alternate,infer(kb))[0].entity.attributes.speed,5);
});
test('Суммы вкладов совпадают с оценками, все 20 результатов внутри шкалы',()=>{
  const r=consult(Object.fromEntries(kb.questions.map(q=>[q.param,q.options[0].value]))).ranking;
  assert.equal(r.length,20);for(const row of r){assert.ok(row.score>=0&&row.score<=100);assert.equal(row.rawScore,row.contributions.reduce((s,c)=>s+c.points,0));for(const c of row.contributions)assert.equal(c.points,c.effects.reduce((s,e)=>s+e.points,0));}
  assert.ok(new Set(r.map(r=>r.score)).size>3);
});
test('Живой рейтинг содержит 5 объектов, финальный — 20 с объяснениями',()=>{
  const r=rankEntities(kb,infer(kb));assert.equal((rankingView(kb,r).match(/data-entity=/g)||[]).length,5);
  const full=rankingView(kb,r,{full:true});assert.equal((full.match(/data-entity=/g)||[]).length,20);assert.equal((full.match(/class="explanation"/g)||[]).length,20);
});
test('Просмотр БЗ показывает оба вида правил, все исходники и вопросы',()=>{
  const html=knowledgeView(kb,sources);for(const s of ['kb-derive','kb-score','entities.json','questions.json','rules.json','Q28','D10','R84'])assert.ok(html.includes(s),s);
});
test('Рабочая база и снимок сохраняют происхождение, историю и результаты',()=>{
  const c=consult({movesPressure:'critical'});const html=databaseView(kb,c.db,c.answers,c.ranking);
  for(const s of ['D04','D05','db-parameters','db-log','db-scores'])assert.ok(html.includes(s),s);
  const snapshot=workingSnapshot(c.db,c.answers);snapshot.facts.speedPriority.value='changed';snapshot.answers.length=0;
  assert.equal(c.db.facts.speedPriority.value,'high');assert.ok(c.answers.length>0);
});
test('Названия объектов экранируются в HTML',()=>{
  const r=rankEntities(kb,infer(kb));r[0].entity={...r[0].entity,name:'<img onerror="bad">'};
  assert.ok(rankingView(kb,r).includes('&lt;img onerror='));assert.ok(!rankingView(kb,r).includes('<img onerror='));
});
