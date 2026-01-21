'use client';

import { Question } from '@/lib/survey-config';

interface ScaleQuestionProps {
  question: Question;
  value: number | null;
  onChange: (value: number) => void;
}

export default function ScaleQuestion({ question, value, onChange }: ScaleQuestionProps) {
  const min = question.options?.min || 1;
  const max = question.options?.max || 5;
  const labels = question.options?.labels || {};

  return (
    <div className="mb-8">
      <label className="block text-base font-medium text-gray-900 mb-4">
        {question.question}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="flex gap-3">
        {Array.from({ length: max - min + 1 }, (_, i) => {
          const val = min + i;
          const isSelected = value === val;
          return (
            <button
              key={val}
              type="button"
              onClick={() => onChange(val)}
              className={`
                flex-1 py-4 px-3 rounded-lg border-2 transition-all text-center
                ${isSelected
                  ? 'border-blue-500 bg-blue-500 text-white shadow-md scale-105'
                  : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                }
              `}
            >
              <div className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                {val}
              </div>
              {labels[val.toString()] && (
                <div className={`text-xs mt-1 ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                  {labels[val.toString()]}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
