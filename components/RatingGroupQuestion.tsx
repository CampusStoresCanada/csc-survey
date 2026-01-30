'use client';

import { Question } from '@/lib/survey-config';

interface RatingGroupQuestionProps {
  question: Question;
  value: Record<string, number | null>;
  onChange: (value: Record<string, number | null>) => void;
}

export default function RatingGroupQuestion({ question, value, onChange }: RatingGroupQuestionProps) {
  const items = question.options?.items || [];
  const min = question.options?.min || 1;
  const max = question.options?.max || 5;
  const labels = question.options?.labels || {};
  const includeNotAttended = question.options?.includeNotAttended || false;

  const handleRating = (item: string, rating: number | null) => {
    onChange({
      ...value,
      [item]: rating
    });
  };

  return (
    <div className="mb-10">
      <label className="block text-base font-medium text-gray-900 mb-5">
        {question.question}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="bg-gray-50 rounded-lg p-5 space-y-5">
        {items.map((item) => (
          <div key={item} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="font-medium text-gray-800 mb-3">{item}</div>
            <div className="flex gap-2">
              {Array.from({ length: max - min + 1 }, (_, i) => {
                const val = min + i;
                const isSelected = value[item] === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleRating(item, val)}
                    className={`
                      flex-1 py-2 px-3 rounded-lg border-2 transition-all font-semibold
                      ${isSelected
                        ? 'border-blue-500 bg-blue-500 text-white shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                      }
                    `}
                  >
                    {val}
                  </button>
                );
              })}
              {includeNotAttended && (
                <button
                  type="button"
                  onClick={() => handleRating(item, null)}
                  className={`
                    flex-1 py-2 px-3 rounded-lg border-2 transition-all font-semibold
                    ${value[item] === null
                      ? 'border-gray-500 bg-gray-500 text-white shadow-md'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }
                  `}
                >
                  N/A
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-sm text-gray-500 mt-3 px-2">
        <span>{labels[min.toString()]}</span>
        <span>{labels[max.toString()]}</span>
      </div>
    </div>
  );
}
