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
| Топ-5 после каждого ответа | `runPartialInference()`, `intermediateResults`, блок «Топ-5 по текущим ответам» | 20 промежуточных шагов в двух сценариях, изменение ответа, возврат и сброс в Chromium | выполнено |
| Оценка по известным данным без насыщения шкалы | исключение неизвестных факторов; общие теоретические границы активных правил | тесты частичного расчёта и критического сценария | выполнено |
| Вычисляемый рейтинг всех объектов | `runInference()` в `inference.js`, динамический блок `ProjectOneDetail` | `tests/inference.test.js` | выполнено: этап 5 |
| Объяснение рекомендации | вклад каждого фактора и сработавшие правила с учётом приоритета; общий диапазон нормализации | `tests/inference.test.js`, экран результата | выполнено |
| Отображение всех объектов с рангом | итоговый массив `finalRanking` и раскрываемый экран результата | `InferenceResultPanel` | выполнено: этап 6 |
| Документация архитектуры и работы системы | `.docs/PROJECT_1_ARCHITECTURE.md`, roadmap и паспорт | проверка ссылок и актуальности | выполнено |
