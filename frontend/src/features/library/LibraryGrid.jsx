import React from 'react';
import LectureCard from './LectureCard';

export default function LibraryGrid({ items, onOpen }) {
  return (
    <div className="lib-grid">
      {items.map((item, idx) => (
        <LectureCard key={item.taskId || item.videoId || idx} item={item} onOpen={onOpen} />
      ))}
    </div>
  );
}
