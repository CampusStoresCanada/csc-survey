'use client';

import { useState, useEffect } from 'react';
import { SurveyPage } from '@/lib/survey-config';
import ScaleQuestion from './ScaleQuestion';
import TextareaQuestion from './TextareaQuestion';
import RatingGroupQuestion from './RatingGroupQuestion';

interface SurveyFormProps {
  surveyId: string;
  pages: SurveyPage[];
  participantType: 'delegate' | 'exhibitor';
  userName: string;
  initialPage?: number;
  initialResponses?: Record<string, any>;
  onPageSave: (page: number, responses: Record<string, any>) => Promise<void>;
  onSubmit: (responses: Record<string, any>) => Promise<void>;
}

export default function SurveyForm({
  surveyId,
  pages,
  participantType,
  userName,
  initialPage = 0,
  initialResponses = {},
  onPageSave,
  onSubmit
}: SurveyFormProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [responses, setResponses] = useState<Record<string, any>>(initialResponses);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPageData = pages[currentPage];
  const isLastPage = currentPage === pages.length - 1;
  const isFirstPage = currentPage === 0;

  const handleChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateCurrentPage = () => {
    const missingRequired = currentPageData.questions
      .filter(q => q.required)
      .find(q => !responses[q.id] || responses[q.id] === '');

    if (missingRequired) {
      setError('Please answer all required questions before continuing.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentPage()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Save progress
      await onPageSave(currentPage + 1, responses);
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError('Failed to save progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setCurrentPage(prev => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateCurrentPage()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(responses);
    } catch (err) {
      setError('Failed to submit survey. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderQuestion = (question: any) => {
    switch (question.type) {
      case 'scale':
        return (
          <ScaleQuestion
            key={question.id}
            question={question}
            value={responses[question.id] || null}
            onChange={(value) => handleChange(question.id, value)}
          />
        );
      case 'textarea':
        return (
          <TextareaQuestion
            key={question.id}
            question={question}
            value={responses[question.id] || ''}
            onChange={(value) => handleChange(question.id, value)}
          />
        );
      case 'rating_group':
        return (
          <RatingGroupQuestion
            key={question.id}
            question={question}
            value={responses[question.id] || {}}
            onChange={(value) => handleChange(question.id, value)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
        {/* Header */}
        <div className="mb-10 pb-8 border-b-2 border-gray-100">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            2026 Conference Feedback
          </h1>
          <p className="text-lg text-gray-600">
            Hey {userName}, help us improve! Share your experience from the conference.
          </p>
        </div>

        {/* Privacy Notice - Only show on first page */}
        {isFirstPage && (
          <div className="mb-8 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <p className="text-sm text-gray-700">
              <strong>Privacy Notice:</strong> Your responses will be anonymized when aggregated for analysis.
              However, your progress through this survey is tracked to allow you to save and return to complete it later.
            </p>
          </div>
        )}

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">{currentPageData.title}</span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentPage + 1) / pages.length) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentPage + 1) / pages.length) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-700">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-2">
          {currentPageData.questions.map(renderQuestion)}
        </div>

        {/* Navigation */}
        <div className="mt-12 pt-8 border-t-2 border-gray-100">
          <div className="flex gap-4">
            {!isFirstPage && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex-1 py-5 px-8 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-800 text-lg font-semibold rounded-xl transition-all"
              >
                Back
              </button>
            )}
            {!isLastPage ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex-1 py-5 px-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isSubmitting ? 'Saving...' : 'Next'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-5 px-8 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-lg font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isSubmitting ? 'Submitting Your Feedback...' : 'Submit Survey'}
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
