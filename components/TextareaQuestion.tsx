'use client';

import { Question } from '@/lib/survey-config';

interface TextareaQuestionProps {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}

export default function TextareaQuestion({ question, value, onChange }: TextareaQuestionProps) {
  return (
    <div className="mb-8">
      <label className="block text-base font-medium text-gray-900 mb-4">
        {question.question}
        {question.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
        placeholder="Share your thoughts..."
      />
    </div>
  );
}
