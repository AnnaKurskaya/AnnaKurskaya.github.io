import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('карточка проекта запускает SPA-сценарий без статического рейтинга', () => {
  const source = read('src/widgets/project-detail/ui/ProjectOneDetail.jsx')
  assert.match(source, /Запустить экспертную систему/)
  assert.match(source, /setIsSystemStarted\(true\)/)
  assert.match(source, /<QuestionnairePanel/)
  assert.match(source, /session\.finalRanking/)
  assert.doesNotMatch(source, /94 - index \* 13/)
})

test('опрос содержит клавиатурную навигацию, а результат — действия редактирования и сброса', () => {
  const questionnaireSource = read('src/features/expert-system-questionnaire/ui/QuestionnairePanel.jsx')
  const resultSource = read('src/features/expert-system-result/ui/InferenceResultPanel.jsx')
  const styles = read('src/app/styles/index.css')

  assert.match(questionnaireSource, /event\.key === 'ArrowLeft'/)
  assert.match(questionnaireSource, /event\.key === 'ArrowRight'/)
  assert.match(resultSource, /Изменить ответы/)
  assert.match(resultSource, /Пройти заново/)
  assert.match(styles, /@media \(max-width: 720px\)/)
})

test('GitHub Pages workflow проверяет проект до публикации', () => {
  const workflow = read('.github/workflows/deploy.yml')
  assert.match(workflow, /npm ci/)
  assert.match(workflow, /npm run build/)
  assert.match(workflow, /npm test/)
  assert.match(workflow, /source_branch/)
  assert.match(workflow, /inputs\.source_branch \|\| github\.ref_name/)
  assert.match(workflow, /actions\/deploy-pages/)
})
