import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import test from 'node:test'

import { strategies, strategyAttributes, userParameters, validateDomainModel } from '../src/entities/expert-system/model/domain.js'
import { knowledgeRules, levelFacts, validateKnowledgeBase } from '../src/entities/expert-system/model/knowledgeBase.js'
import { questionnaire, validateQuestionnaire } from '../src/features/expert-system-questionnaire/model/questions.js'

const kebabCase = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
const lowerCamelCase = /^[a-z][a-zA-Z0-9]*$/
const unique = (values) => new Set(values).size === values.length

test('минимальные требования доменной модели соблюдены', () => {
  assert.equal(validateDomainModel().valid, true)
  assert.equal(validateKnowledgeBase().valid, true)
  assert.equal(validateQuestionnaire().valid, true)
  assert.equal(userParameters.length, 12)
  assert.equal(strategies.length, 20)
  assert.equal(strategyAttributes.length, 11)
  assert.equal(questionnaire.length, 20)
})

test('идентификаторы стабильны, уникальны и соответствуют соглашению', () => {
  const kebabIds = [
    ...questionnaire.map(({ id }) => id),
    ...knowledgeRules.map(({ id }) => id),
    ...strategies.map(({ id }) => id),
  ]
  const camelIds = [
    ...userParameters.map(({ id }) => id),
    ...levelFacts.map(({ id }) => id),
    ...strategyAttributes.map(({ id }) => id),
  ]

  assert.equal(kebabIds.every((id) => kebabCase.test(id)), true)
  assert.equal(camelIds.every((id) => lowerCamelCase.test(id)), true)
  assert.equal(unique(questionnaire.map(({ id }) => id)), true)
  assert.equal(unique(knowledgeRules.map(({ id }) => id)), true)
  assert.equal(unique(strategies.map(({ id }) => id)), true)
  assert.equal(unique(camelIds), true)
})

test('каждый вопрос ссылается на существующий параметр или факт', () => {
  const targets = new Set([
    ...userParameters.map(({ id }) => `parameter:${id}`),
    ...levelFacts.map(({ id }) => `levelFact:${id}`),
  ])

  for (const currentQuestion of questionnaire) {
    assert.equal(targets.has(`${currentQuestion.target.type}:${currentQuestion.target.id}`), true, currentQuestion.id)
  }
})

test('доменный model-слой не зависит от React, JSX и CSS', () => {
  const modelDirectory = new URL('../src/entities/expert-system/model/', import.meta.url)
  const modelFiles = readdirSync(modelDirectory).filter((fileName) => fileName.endsWith('.js') && !fileName.endsWith('.test.js'))

  for (const fileName of modelFiles) {
    const source = readFileSync(new URL(fileName, modelDirectory), 'utf8')
    assert.doesNotMatch(source, /from\s+['"]react(?:\/[^'"]*)?['"]/, fileName)
    assert.doesNotMatch(source, /import\s+['"][^'"]+\.css['"]/, fileName)
    assert.doesNotMatch(source, /<\/?[A-Z][A-Za-z0-9]*/, fileName)
  }
})
