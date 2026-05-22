/** ExpressionCalculator — Calculator for evaluating mathematical expressions. */

import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { evaluate } from "mathjs";
import { MathKeyboard } from "./MathKeyboard";
import { Icon } from "../Icon";

export function ExpressionCalculator() {
  const { t } = useTranslation();
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [angleMode, setAngleMode] = useState<'rad' | 'deg'>('rad');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = (value: string, cursorOffset?: number) => {
    if (inputRef.current) {
      const start = inputRef.current.selectionStart || 0;
      const end = inputRef.current.selectionEnd || 0;
      const newExpression = expression.slice(0, start) + value + expression.slice(end);
      setExpression(newExpression);
      
      // Set cursor position after inserted text
      setTimeout(() => {
        if (inputRef.current) {
          // If cursorOffset is provided (e.g., -1 for inside parentheses), use it
          // Otherwise, place cursor at the end of inserted text
          const newPos = start + value.length + (cursorOffset || 0);
          inputRef.current.setSelectionRange(newPos, newPos);
          inputRef.current.focus();
        }
      }, 0);
    } else {
      setExpression(prev => prev + value);
    }
    setError(null);
  };

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      const message = err.message.toLowerCase();
      
      if (message.includes('undefined symbol') || message.includes('undefined variable')) {
        return t("calculator.error_unknown_var");
      }
      if (message.includes('division by zero') || message.includes('divide by zero')) {
        return t("calculator.error_div_by_zero");
      }
      if (message.includes('syntax error') || message.includes('unexpected')) {
        return t("calculator.error_syntax");
      }
      if (message.includes('parenthesis')) {
        return t("calculator.error_parenthesis");
      }
      
      return t("calculator.error_generic");
    }
    
    return t("calculator.unknown_error");
  };

  const convertTrigExpression = (expr: string): string => {
    if (angleMode === 'deg') {
      // Convert degrees to radians for trig functions
      return expr
        .replace(/sin\(/g, 'sin((pi/180)*')
        .replace(/cos\(/g, 'cos((pi/180)*')
        .replace(/tan\(/g, 'tan((pi/180)*');
    }
    return expr;
  };

  const calculate = () => {
    if (!expression.trim()) {
      setError(t("calculator.enter_expression"));
      return;
    }

    try {
      const convertedExpr = convertTrigExpression(expression);
      const res = evaluate(convertedExpr);
      
      // Check for invalid results
      if (res === Infinity) {
        setError(t("calculator.error_infinity"));
        setResult(null);
        return;
      }
      if (res === -Infinity) {
        setError(t("calculator.error_neg_infinity"));
        setResult(null);
        return;
      }
      if (Number.isNaN(res)) {
        setError(t("calculator.error_nan"));
        setResult(null);
        return;
      }
      
      // Format result
      const formattedResult = typeof res === 'number' 
        ? (Math.abs(res) < 0.0001 || Math.abs(res) > 1e10 
            ? res.toExponential(4) 
            : res.toString())
        : String(res);
      
      setResult(formattedResult);
      setError(null);

      // Haptic feedback on success
      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setResult(null);

      // Haptic feedback on error
      const tg = window.Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
      }
    }
  };

  const clear = () => {
    setExpression('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Angle Mode Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setAngleMode(prev => prev === 'rad' ? 'deg' : 'rad')}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm transition-all active:scale-95
            ${angleMode === 'rad' 
              ? 'bg-primary text-on-primary' 
              : 'bg-secondary text-on-secondary'
            }
          `}
        >
          {angleMode === 'rad' ? 'RAD' : 'DEG'}
        </button>
      </div>

      {/* Input */}
      <div className="bg-surface-container-low rounded-xl p-4">
        <input
          ref={inputRef}
          type="text"
          value={expression}
          onChange={(e) => {
            setExpression(e.target.value);
            setError(null);
          }}
          placeholder="2 + 2 * 3"
          className="w-full bg-transparent text-on-surface text-lg font-mono outline-none"
        />
      </div>

      {/* Result */}
      <div className="bg-surface-container-low rounded-xl p-6 min-h-24 flex items-center justify-center">
        {error ? (
          <div className="text-center">
            <Icon name="error_outline" size={32} className="text-error mb-2 mx-auto" />
            <p className="text-error text-sm">{error}</p>
          </div>
        ) : result !== null ? (
          <p className="text-3xl font-bold text-primary tabular-nums break-all text-center">= {result}</p>
        ) : (
          <p className="text-on-surface-variant text-sm">{t("calculator.result_placeholder")}</p>
        )}
      </div>

      {/* Keyboard */}
      <MathKeyboard
        mode="calculator"
        angleMode={angleMode}
        onInput={handleInput}
        onCalculate={calculate}
        onClear={clear}
      />
    </div>
  );
}