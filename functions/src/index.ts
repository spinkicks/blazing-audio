import { initializeApp } from 'firebase-admin/app';

// Initialize the Admin SDK once for all callables (used for caching + quotas).
initializeApp();

export { generateReviewQuestions, verifyFillBlankAnswer } from './review';
export { explainConcept } from './tutor';
export { evaluateCapstone } from './capstone';
