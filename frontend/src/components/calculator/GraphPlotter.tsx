/** GraphPlotter — Interactive function plotter with function-plot. */

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import functionPlotLib from "function-plot";
import { Icon } from "../Icon";
import type { FunctionItem } from "../../types/calculator";

// @ts-ignore - function-plot has module resolution issues
const functionPlot = functionPlotLib.default || functionPlotLib;

const COLORS = ['#3390ec', '#e74c3c', '#2ecc71'];

const EXAMPLES = [
  { label: 'y = x²', value: 'x^2' },
  { label: 'y = sin(x)', value: 'sin(x)' },
  { label: 'y = 2x + 1', value: '2*x + 1' },
  { label: 'y = |x|', value: 'abs(x)' },
];

export function GraphPlotter() {
  const { t } = useTranslation();
  const [functions, setFunctions] = useState<FunctionItem[]>([
    { id: '1', expression: '', color: COLORS[0] }
  ]);
  const [activeInputId, setActiveInputId] = useState<string>('1');
  const [plotError, setPlotError] = useState<string | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);

  const addFunction = () => {
    if (functions.length >= 3) return;
    
    const newId = String(Date.now());
    setFunctions(prev => [
      ...prev,
      { id: newId, expression: '', color: COLORS[prev.length % COLORS.length] }
    ]);
    setActiveInputId(newId);
  };

  const removeFunction = (id: string) => {
    if (functions.length === 1) return;
    
    setFunctions(prev => prev.filter(fn => fn.id !== id));
    if (activeInputId === id) {
      setActiveInputId(functions[0].id);
    }
  };

  const validateFunction = (expression: string): string | null => {
    if (!expression.trim()) return null;
    
    // Check if expression contains variable 'x'
    if (!expression.includes('x')) {
      return t("calculator.graph_no_x");
    }
    
    return null;
  };

  const updateFunction = (id: string, expression: string) => {
    const error = validateFunction(expression);
    setFunctions(prev => prev.map(fn => 
      fn.id === id ? { ...fn, expression, error: error || undefined } : fn
    ));
  };

  const setExample = (value: string) => {
    updateFunction(activeInputId, value);
  };

  // Render graph
  useEffect(() => {
    if (!plotRef.current) return;

    const validFunctions = functions.filter(fn => 
      fn.expression.trim() && !fn.error
    );
    
    // Always create a fresh container to avoid React/D3 conflicts
    const container = plotRef.current;
    const newDiv = document.createElement('div');
    newDiv.style.width = '100%';
    newDiv.style.height = '400px';
    
    // Clear and replace container content
    container.innerHTML = '';
    container.appendChild(newDiv);
    
    if (validFunctions.length === 0) {
      setPlotError(null);
      return;
    }

    try {
      const width = container.clientWidth || 600;
      const height = 400;
      
      functionPlot({
        target: newDiv,
        width,
        height,
        xAxis: { domain: [-10, 10] },
        yAxis: { domain: [-10, 10] },
        grid: true,
        data: validFunctions.map(fn => ({
          fn: fn.expression,
          color: fn.color,
          graphType: 'polyline' as const,
        })),
      });
      
      setPlotError(null);
    } catch (err) {
      console.error('Function plot error:', err);
      setPlotError(t("calculator.graph_error", { error: err instanceof Error ? err.message : t("calculator.unknown_error") }));
    }
  }, [functions, t]);

  return (
    <div className="space-y-6">
      {/* Function inputs */}
      <div className="space-y-3">
        {functions.map((fn) => (
          <div key={fn.id}>
            <div
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-all
                ${activeInputId === fn.id 
                  ? 'bg-surface-container ring-2 ring-primary/30' 
                  : 'bg-surface-container-low'
                }
                ${fn.error ? 'ring-2 ring-error/30' : ''}
              `}
            >
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: fn.color }}
              />
              <span className="text-on-surface-variant">y =</span>
              <input
                type="text"
                value={fn.expression}
                onChange={(e) => updateFunction(fn.id, e.target.value)}
                onFocus={() => setActiveInputId(fn.id)}
                placeholder="x^2"
                className="flex-1 bg-transparent text-on-surface font-mono outline-none text-base"
              />
              {functions.length > 1 && (
                <button
                  onClick={() => removeFunction(fn.id)}
                  className="text-on-surface-variant hover:text-error transition-colors"
                >
                  <Icon name="cancel" size={20} />
                </button>
              )}
            </div>
            {fn.error && (
              <p className="text-error text-xs mt-1 ml-7">{fn.error}</p>
            )}
          </div>
        ))}

        {functions.length < 3 && (
          <button
            onClick={addFunction}
            className="w-full py-3 px-4 rounded-xl bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            <span>{t("calculator.add_function")}</span>
          </button>
        )}
      </div>

      {/* Examples */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {EXAMPLES.map((example, index) => (
          <button
            key={index}
            onClick={() => setExample(example.value)}
            className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface-variant hover:bg-surface-container transition-colors whitespace-nowrap text-sm"
          >
            {example.label}
          </button>
        ))}
      </div>

      {/* Error message - outside graph container */}
      {plotError && (
        <div className="bg-error/10 border border-error/30 rounded-xl p-4 flex items-center gap-3">
          <Icon name="error_outline" size={24} className="text-error flex-shrink-0" />
          <p className="text-error text-sm">{plotError}</p>
        </div>
      )}

      {/* Graph */}
      <div 
        ref={plotRef} 
        className="w-full bg-surface-container-low rounded-xl overflow-hidden"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
}