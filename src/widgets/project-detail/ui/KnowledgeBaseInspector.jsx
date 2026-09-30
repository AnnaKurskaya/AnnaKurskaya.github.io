import { useState } from 'react'
import { getKnowledgeBase, validateKnowledgeBase } from '../../../entities/expert-system/index.js'

const sections = [
  ['rules', 'Правила', 'rules'],
  ['parameters', 'Параметры', 'parameters'],
  ['levelFacts', 'Факты уровня', 'levelFacts'],
  ['strategies', 'Стратегии', 'strategies'],
  ['attributes', 'Свойства', 'attributes'],
]

const formatValue = (value) => typeof value === 'boolean' ? (value ? 'да' : 'нет') : String(value)
const formatDescriptor = (item) => item.values ? item.values.map(({ id, label }) => `${label} (${id})`).join(' · ') : `${item.range.min}…${item.range.max} ${item.range.unit ?? ''}`
const formatCondition = ({ fact, operator, value }) => `${fact} ${operator} ${Array.isArray(value) ? value.join(', ') : formatValue(value)}`

export function KnowledgeBaseInspector() {
  const [activeSection, setActiveSection] = useState('rules')
  const knowledgeBase = getKnowledgeBase()
  const validation = validateKnowledgeBase()
  const items = knowledgeBase[activeSection]

  return (
    <section className="knowledge-inspector" aria-labelledby="knowledge-inspector-title">
      <div className="knowledge-inspector-heading">
        <div>
          <p className="detail-kicker">07 / KNOWLEDGE VIEW</p>
          <h2 id="knowledge-inspector-title">Содержимое базы знаний</h2>
          <p>Это реальные данные, которые будут использоваться механизмом вывода: факты уровня, стратегии, свойства и декларативные правила.</p>
        </div>
        <span className={`knowledge-status ${validation.valid ? 'is-valid' : 'is-invalid'}`}>{validation.valid ? 'MODEL VALID' : 'MODEL ERROR'}</span>
      </div>

      <div className="knowledge-summary" aria-label="Состав базы знаний">
        <span><strong>{knowledgeBase.rules.length}</strong> правил</span>
        <span><strong>{knowledgeBase.parameters.length}</strong> параметров</span>
        <span><strong>{knowledgeBase.strategies.length}</strong> стратегий</span>
        <span><strong>{knowledgeBase.attributes.length}</strong> свойств</span>
      </div>

      <div className="knowledge-tabs" role="tablist" aria-label="Разделы базы знаний">
        {sections.map(([id, label]) => <button className={activeSection === id ? 'is-active' : ''} type="button" role="tab" aria-selected={activeSection === id} key={id} onClick={() => setActiveSection(id)}>{label}</button>)}
      </div>

      <div className="knowledge-items" role="tabpanel">
        {activeSection === 'rules' && items.map((item) => <article className="knowledge-item" key={item.id}><div className="knowledge-item-topline"><span>{item.id}</span><b>{Math.round(item.priority * 100)}%</b></div><h3>{item.title}</h3><p>{item.description}</p><div className="knowledge-rule-meta"><span>{item.conditions.length} условия</span><span>{item.effects.length} эффекта</span></div><ul className="knowledge-rule-list">{item.conditions.map((condition) => <li key={`${item.id}-${condition.fact}`}>ЕСЛИ {formatCondition(condition)}</li>)}{item.effects.map((effect) => <li key={`${item.id}-${effect.strategyId}`} className={effect.type === 'penalty' ? 'is-penalty' : 'is-bonus'}>{effect.type === 'penalty' ? 'ШТРАФ' : 'БОНУС'} {effect.strategyId}: {effect.reason}</li>)}</ul></article>)}
        {activeSection === 'parameters' && items.map((item) => <article className="knowledge-item" key={item.id}><div className="knowledge-item-topline"><span>{item.input}</span><b>{item.id}</b></div><h3>{item.label}</h3><p>{item.description}</p><small>{item.influence}</small><div className="knowledge-values">Допустимые значения: {formatDescriptor(item)}</div></article>)}
        {activeSection === 'levelFacts' && items.map((item) => <article className="knowledge-item" key={item.id}><div className="knowledge-item-topline"><span>{item.type}</span><b>{item.id}</b></div><h3>{item.label}</h3><div className="knowledge-values">Допустимые значения: {formatDescriptor(item)}</div></article>)}
        {activeSection === 'strategies' && items.map((item) => <article className="knowledge-item" key={item.id}><div className="knowledge-item-topline"><span>{item.id}</span><b>{Math.round(item.attributes.successProbability * 100)}% success</b></div><h3>{item.title}</h3><p>{item.description}</p><small>{item.recommendedWhen}</small><div className="knowledge-attribute-grid">{Object.entries(item.attributes).map(([attribute, value]) => <span key={attribute}><b>{attribute}</b><em>{Math.round(value * 100)}%</em></span>)}</div></article>)}
        {activeSection === 'attributes' && items.map((item) => <article className="knowledge-item" key={item.id}><div className="knowledge-item-topline"><span>0..1</span><b>{item.id}</b></div><h3>{item.label}</h3><p>{item.description}</p></article>)}
      </div>
    </section>
  )
}
