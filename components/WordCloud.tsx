'use client';

import { useMemo } from 'react';
import { WordCloud as ReactWordCloud } from '@isoterik/react-word-cloud';

interface WordCloudProps {
  words: Array<{ word: string; count: number }>;
  width?: number;
  height?: number;
}

export default function WordCloud({ words, width = 600, height = 400 }: WordCloudProps) {
  // Transform data to match the library's expected format
  const wordData = useMemo(() => {
    return words.map(w => ({
      text: w.word,
      value: w.count,
    }));
  }, [words]);

  if (words.length === 0) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ width, height }}
      >
        <p className="text-gray-400 italic">No data to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-inner" style={{ width, height }}>
      <ReactWordCloud
        words={wordData}
        width={width}
        height={height}
      />
    </div>
  );
}
