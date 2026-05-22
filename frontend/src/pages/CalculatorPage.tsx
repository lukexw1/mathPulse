/** CalculatorPage — Math calculator with graph plotter and expression evaluator. */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GraphPlotter } from "../components/calculator/GraphPlotter";
import { ExpressionCalculator } from "../components/calculator/ExpressionCalculator";

export function CalculatorPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'graph' | 'calculator'>('graph');

  return (
    <div className="pt-6 pt-safe pb-20 px-6 max-w-5xl mx-auto">
      {/* Header */}
      <h1 className="text-2xl font-bold text-on-surface mb-2">
        {t("calculator.title")}
      </h1>
      
      {/* Info about trig functions */}
      <p className="text-xs text-on-surface-variant mb-6">
        {t("calculator.trig_info")}
        <br />
        {t("calculator.log_info")}
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('graph')}
          className={`
            flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98]
            ${activeTab === 'graph'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }
          `}
        >
          {t("calculator.graphs_tab")}
        </button>
        <button
          onClick={() => setActiveTab('calculator')}
          className={`
            flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98]
            ${activeTab === 'calculator'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            }
          `}
        >
          {t("calculator.calculator_tab")}
        </button>
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {activeTab === 'graph' ? (
          <GraphPlotter />
        ) : (
          <ExpressionCalculator />
        )}
      </div>
    </div>
  );
}
