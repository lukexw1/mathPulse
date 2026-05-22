import React from 'react';

interface ParameterSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  color?: string;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  color = 'var(--tg-theme-button-color, #3390ec)',
}) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
          {label}
        </label>
        <span className="text-sm font-mono px-2 py-1 rounded" style={{ 
          backgroundColor: 'var(--tg-theme-secondary-bg-color)',
          color: 'var(--tg-theme-text-color)'
        }}>
          {value.toFixed(1)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${((value - min) / (max - min)) * 100}%, var(--tg-theme-secondary-bg-color) ${((value - min) / (max - min)) * 100}%, var(--tg-theme-secondary-bg-color) 100%)`,
        }}
      />
    </div>
  );
};
