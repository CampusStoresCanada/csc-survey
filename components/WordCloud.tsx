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

  // Configure word cloud options for better visibility
  const options = {
    colors: ['#1e40af', '#2563eb', '#3b82f6', '#059669', '#10b981', '#0d9488', '#0891b2'],
    enableTooltip: true,
    deterministic: true,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSizes: [24, 72] as [number, number],
    fontStyle: 'normal',
    fontWeight: '600',
    padding: 4,
    rotations: 1,
    rotationAngles: [0, 0] as [number, number],
    scale: 'linear',
    spiral: 'rectangular',
    transitionDuration: 0,
  };

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200" style={{ width, height }}>
      <ReactWordCloud
        words={wordData}
        options={options}
        width={width}
        height={height}
      />
    </div>
  );
}
