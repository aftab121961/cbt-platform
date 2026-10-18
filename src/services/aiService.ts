import { Question, QuestionDifficulty, QuestionType } from '../types';

export interface AIPerformanceAnalysis {
  overallAssessment: string;
  strongAreas: string[];
  weakAreas: string[];
  actionPlan: string[];
  predictedExamScorePercent: number;
}

export interface AIRecommendation {
  title: string;
  description: string;
  recommendedChapters: string[];
  estimatedTimeMinutes: number;
  priority: 'High' | 'Medium' | 'Low';
}

/**
 * AI Service Abstraction layer.
 * In Version 0.1, provides simulated intelligent responses.
 * Designed for future plug-and-play AI model endpoint integration (Gemini / OpenAI).
 */

export async function generateQuestion(
  subjectName: string,
  chapterName: string,
  difficulty: QuestionDifficulty,
  type: QuestionType = 'mcq'
): Promise<Partial<Question>> {
  // Simulate AI delay
  await new Promise(res => setTimeout(res, 800));

  return {
    question_text: `[AI Generated] What is the key fundamental principle governing ${chapterName} in ${subjectName}?`,
    question_type: type,
    difficulty,
    source_type: 'practice',
    option_a: 'Conservation of energy and momentum',
    option_b: 'Equilibrium of opposing forces',
    option_c: 'Exponential increase over time',
    option_d: 'Linear proportion without boundary',
    correct_answer: 'A',
    solution: `AI Explanation: In ${chapterName}, conservation laws dictate the net equilibrium and state transformations.`,
    marks: 1,
    negative_marks: 0.25
  };
}

export async function analyzePerformance(
  attemptsCount: number,
  averageAccuracy: number,
  subjectBreakdown: Record<string, number>
): Promise<AIPerformanceAnalysis> {
  await new Promise(res => setTimeout(res, 600));

  const isHighAccuracy = averageAccuracy >= 75;

  return {
    overallAssessment: isHighAccuracy 
      ? `Outstanding conceptual mastery! You maintain a strong accuracy of ${averageAccuracy}%. Keep refining speed for advanced competitive PYQs.`
      : `Solid baseline built with ${attemptsCount} tests. Focus on conceptual clarity in weak topics to boost accuracy from ${averageAccuracy}% to 80%+.`,
    strongAreas: Object.entries(subjectBreakdown)
      .filter(([_, acc]) => acc >= 70)
      .map(([subj]) => subj),
    weakAreas: Object.entries(subjectBreakdown)
      .filter(([_, acc]) => acc < 70)
      .map(([subj]) => subj),
    actionPlan: [
      'Take chapter-wise targeted tests on topics scoring below 60%',
      'Review negative marks questions carefully to eliminate silly mistakes',
      'Practice 20 timed PYQ questions daily to build speed and confidence'
    ],
    predictedExamScorePercent: Math.min(98, Math.round(averageAccuracy * 1.05))
  };
}

export async function generateRecommendation(
  weakTopicName: string
): Promise<AIRecommendation> {
  return {
    title: `Targeted Practice: ${weakTopicName}`,
    description: `AI detected lower accuracy in ${weakTopicName}. Attempt a focused 15-minute diagnostic test to improve formula application.`,
    recommendedChapters: [weakTopicName],
    estimatedTimeMinutes: 20,
    priority: 'High'
  };
}

export async function generateExplanation(questionText: string, studentAnswer: string, correctAnswer: string): Promise<string> {
  return `AI Step-by-Step Breakdown: The student selected (${studentAnswer}), whereas the correct option is (${correctAnswer}). Key takeaway: Verify the mathematical formula before applying values.`;
}
