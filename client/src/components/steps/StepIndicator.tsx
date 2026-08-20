import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  number: number;
  title: string;
}

export const STEPS: StepItem[] = [
  { number: 1, title: '主揪與主題' },
  { number: 2, title: '模式選擇' },
  { number: 3, title: '成員名單' },
  { number: 4, title: '餐點輸入' },
  { number: 5, title: '分攤分配' },
  { number: 6, title: '結算計算' },
  { number: 7, title: '收據匯出' },
];

interface StepIndicatorProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onSelectStep,
}) => {
  return (
    <nav aria-label="分帳流程進度" className="w-full bg-white rounded-2xl p-3 border border-slate-200 shadow-xs">
      <ol className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto py-1 scrollbar-none">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;

          return (
            <React.Fragment key={step.number}>
              <li className="flex-1 min-w-max">
                <button
                  type="button"
                  onClick={() => onSelectStep(step.number)}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`${step.number}. ${step.title}`}
                  className={`w-full flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-xl transition-all text-xs font-semibold cursor-pointer ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                      isActive
                        ? 'bg-white text-emerald-700'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : step.number}
                  </span>
                  <span className="hidden sm:inline truncate">{step.title}</span>
                </button>
              </li>

              {idx < STEPS.length - 1 && (
                <li aria-hidden="true" className="hidden lg:block w-3 h-0.5 bg-slate-200 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
