export {
  DOMAIN_MODEL_VERSION,
  SCORE_RANGE,
  domainModel,
  strategyAttributes,
  strategies,
  userParameters,
  validateDomainModel,
} from './model/domain.js'

export {
  KNOWLEDGE_BASE_VERSION,
  getKnowledgeBase,
  knowledgeBase,
  knowledgeRules,
  levelFacts,
  validateKnowledgeBase,
} from './model/knowledgeBase.js'

export {
  WORKING_DATABASE_VERSION,
  SessionValidationError,
  createEmptySession,
  createWorkingDatabase,
  getMissingLevelFacts,
  getMissingParameters,
  getSession,
  isReadyForInference,
  resetSession,
  saveIntermediateResults,
  saveRanking,
  setAnswer,
  setLevelFact,
} from './model/session.js'

export {
  calculateBaseScore,
  normalizeSession,
  runInference,
  sortRanking,
} from './model/inference.js'
