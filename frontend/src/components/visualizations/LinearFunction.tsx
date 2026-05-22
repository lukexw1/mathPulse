import React, { useState, useMemo } from 'react';
import { InteractiveGraph } from './InteractiveGraph';
import { ParameterSlider } from './ParameterSlider';
import { InlineMath } from 'react-katex';

export const LinearFunction: React.FC = () => {
  const [m, setM] = useState(1);
  const [b, setB] = useState(0);

  const data = useMemo(() => {
    const points = [];
    for (let x = -10; x <= 10; x += 0.5) {
      points.push({ x, y: m * x + b });
    }
    return points;
  }, [m, b]);

  return (
    <div className="my-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color)' }}>
      <h3 className="text-lg font-semibold mb-4 text-center" style={{ color: 'var(--tg-theme-text-color)' }}>
        Интерактивный график линейной функции
      </h3>
      
      <div className="mb-4 text-center">
        <div className="inline-block px-4 py-2 rounded" style={{ backgroundColor: 'var(--tg-theme-bg-color)' }}>
          <InlineMath math={`y = ${m.toFixed(1)}x ${b >= 0 ? '+' : ''} ${b.toFixed(1)}`} />
        </div>
      </div>

      <InteractiveGraph
        data={data}
        xDomain={[-10, 10]}
        yDomain={[-10, 10]}
      />

      <div className="mt-4">
        <ParameterSlider
          label="Наклон (m)"
          value={m}
          min={-5}
          max={5}
          step={0.1}
          onChange={setM}
        />
        <ParameterSlider
          label="Сдвиг (b)"
          value={b}
          min={-10}
          max={10}
          step={0.5}
          onChange={setB}
        />
      </div>

      <div className="mt-4 text-sm" style={{ color: 'var(--tg-theme-hint-color)' }}>
        <p className="mb-2">
          <strong>m</strong> (наклон) — определяет крутизну линии
        </p>
        <p>
          <strong>b</strong> (сдвиг) — точка пересечения с осью Y
        </p>
      </div>
    </div>
  );
};
