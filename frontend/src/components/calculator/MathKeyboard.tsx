/** MathKeyboard — Mathematical keyboard with numbers, operators, and functions. */

interface MathKeyboardProps {
  onInput: (value: string, cursorOffset?: number) => void;
  onCalculate?: () => void;
  onClear?: () => void;
  mode: 'graph' | 'calculator';
  angleMode?: 'rad' | 'deg';
}

interface KeyButton {
  label: string;
  value: string;
  type: 'number' | 'operator' | 'function' | 'constant' | 'action';
  cursorOffset?: number; // For positioning cursor inside parentheses
  className?: string;
}

const MAIN_KEYS: KeyButton[][] = [
  [
    { label: '7', value: '7', type: 'number' },
    { label: '8', value: '8', type: 'number' },
    { label: '9', value: '9', type: 'number' },
    { label: '/', value: '/', type: 'operator' },
    { label: 'sin', value: 'sin()', type: 'function', cursorOffset: -1 },
  ],
  [
    { label: '4', value: '4', type: 'number' },
    { label: '5', value: '5', type: 'number' },
    { label: '6', value: '6', type: 'number' },
    { label: '×', value: '*', type: 'operator' },
    { label: 'cos', value: 'cos()', type: 'function', cursorOffset: -1 },
  ],
  [
    { label: '1', value: '1', type: 'number' },
    { label: '2', value: '2', type: 'number' },
    { label: '3', value: '3', type: 'number' },
    { label: '−', value: '-', type: 'operator' },
    { label: 'tan', value: 'tan()', type: 'function', cursorOffset: -1 },
  ],
  [
    { label: '0', value: '0', type: 'number' },
    { label: '.', value: '.', type: 'number' },
    { label: '=', value: '=', type: 'action' },
    { label: '+', value: '+', type: 'operator' },
    { label: '^', value: '^', type: 'operator' },
  ],
];

const EXTRA_KEYS: KeyButton[] = [
  { label: '√', value: 'sqrt()', type: 'function', cursorOffset: -1 },
  { label: '(', value: '(', type: 'operator' },
  { label: ')', value: ')', type: 'operator' },
  { label: 'π', value: 'pi', type: 'constant' },
  { label: 'e', value: 'e', type: 'constant' },
  { label: 'x', value: 'x', type: 'constant' },
  { label: 'log₁₀', value: 'log10()', type: 'function', cursorOffset: -1 },
  { label: 'ln', value: 'log()', type: 'function', cursorOffset: -1 },
  { label: 'log', value: 'log()', type: 'function', cursorOffset: -1 },
  { label: ',', value: ', ', type: 'operator' },
  { label: 'C', value: 'clear', type: 'action' },
];

export function MathKeyboard({ onInput, onCalculate, onClear, mode }: MathKeyboardProps) {
  const handleKeyPress = (key: KeyButton) => {
    // Haptic feedback
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }

    if (key.value === '=') {
      onCalculate?.();
    } else if (key.value === 'clear') {
      onClear?.();
    } else {
      onInput(key.value, key.cursorOffset);
    }
  };

  const getButtonStyle = (type: string) => {
    switch (type) {
      case 'operator':
        return 'bg-primary/10 text-primary hover:bg-primary/20';
      case 'function':
        return 'bg-secondary/10 text-secondary hover:bg-secondary/20';
      case 'constant':
        return 'bg-tertiary/10 text-tertiary hover:bg-tertiary/20';
      case 'action':
        return 'bg-primary text-on-primary hover:bg-primary/90';
      default:
        return 'bg-surface-container-low text-on-surface hover:bg-surface-container';
    }
  };

  // Filter out 'x' key if mode is calculator
  const filteredExtraKeys = mode === 'calculator' 
    ? EXTRA_KEYS.filter(key => key.value !== 'x')
    : EXTRA_KEYS;

  return (
    <div className="w-full">
      {/* Main keyboard grid */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {MAIN_KEYS.flat().map((key, index) => (
          <button
            key={index}
            onClick={() => handleKeyPress(key)}
            className={`
              h-14 rounded-lg font-medium text-base transition-all active:scale-95
              ${getButtonStyle(key.type)}
            `}
          >
            {key.label}
          </button>
        ))}
      </div>

      {/* Extra keys - horizontal scroll */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-2 min-w-max">
          {filteredExtraKeys.map((key, index) => (
            <button
              key={index}
              onClick={() => handleKeyPress(key)}
              className={`
                h-12 px-4 rounded-lg font-medium text-base transition-all active:scale-95 whitespace-nowrap
                ${getButtonStyle(key.type)}
              `}
            >
              {key.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
