# Соответствие требований проекта 1 реализации

Таблица связывает требования учебного задания с конкретными частями приложения. Она обновляется по мере прохождения roadmap.

| Требование | Реализация | Проверка | Статус |
| --- | --- | --- | --- |
| Система работает без backend | клиентская React/Vite SPA, `HashRouter` | production-сборка и запуск Vite | выполнено |
| Не менее 20 вопросов | `questionnaire` в `features/expert-system-questionnaire/model/questions.js` | `validateQuestionnaire()` и smoke-тест | выполнено: 20 |
| Не менее 10 параметров пользователя | `userParameters` в `entities/expert-system/model/domain.js` | `validateDomainModel()` и smoke-тест | выполнено: 12 |
| Не менее 20 объектов ранжирования | `strategies` в `entities/expert-system/model/domain.js` | `validateDomainModel()` и smoke-тест | выполнено: 20 |
| Не менее 10 свойств объектов | `strategyAttributes` в `entities/expert-system/model/domain.js` | `validateDomainModel()` и smoke-тест | выполнено: 11 |
| Автономная база знаний | `knowledgeRules` и `levelFacts` в `knowledgeBase.js` | `validateKnowledgeBase()` | выполнено |
| Просмотр базы знаний | `KnowledgeBaseInspector.jsx` | ручной сценарий в модальном окне | выполнено |
| Рабочая база данных | `session.js`: ответы, факты, промежуточные и итоговые результаты | smoke-тест и инспектор | выполнено |
| Просмотр рабочей базы | `WorkingDatabaseInspector.jsx` | ручной сценарий в модальном окне | выполнено |
| Интерактивный ввод | `QuestionnairePanel.jsx` | заполнение 20 вопросов | выполнено |
| Вычисляемый рейтинг всех объектов | `runInference()` в `inference.js`, динамический блок `ProjectOneDetail` | `tests/inference.test.js` | выполнено: этап 5 |
| Объяснение рекомендации | вклад каждого фактора и сработавшие правила в `inferenceResult`; полный экран объяснения | `tests/inference.test.js`, экран результата | расчёт выполнен, UI расширяется на этапе 6 |
| Отображение всех объектов с рангом | итоговый массив `finalRanking` и раскрываемый экран результата | `InferenceResultPanel` | выполнено: этап 6 |
| Документация архитектуры и работы системы | `.docs/PROJECT_1_ARCHITECTURE.md`, roadmap и паспорт | проверка ссылок и актуальности | выполнено |
