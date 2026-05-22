/** Calculator types and interfaces. */

export interface FunctionItem {
  id: string;
  expression: string;
  color: string;
  error?: string;
}

export interface MathKeyboardButton {
  label: string;
  value: string;
  type: 'number' | 'operator' | 'function' | 'constant' | 'action';
  className?: string;
}

export type CalculatorMode = 'graph' | 'calculator';

export interface CalculatorError {
  message: string;
  type: 'syntax' | 'validation' | 'runtime';
}
