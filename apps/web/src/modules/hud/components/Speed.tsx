import React from 'react';

export type SpeedProps = {
  speed?: number | null;
  className?: string;
};

export default function Speed({ speed, className }: SpeedProps) {
  return (
    <div className={`text-3xl ${className ?? ''}`}>
      {typeof speed === 'number' ? `${speed.toFixed(0)} km/h` : '— km/h'}
    </div>
  );
}
