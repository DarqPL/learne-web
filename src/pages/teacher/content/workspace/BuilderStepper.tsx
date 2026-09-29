import { Check, ClipboardCheck, FileText, HelpCircle, Layers, type LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/shadcn/ui/card'
import { cardSoftClassName, stepDefinitions, type BuilderStep } from './builderModel'

const stepIcons: Record<BuilderStep, LucideIcon> = {
  'thong-tin': FileText,
  'noi-dung': Layers,
  'cau-hoi': HelpCircle,
  'kiem-tra': ClipboardCheck,
}

interface BuilderStepperProps {
  step: BuilderStep
  done: Record<BuilderStep, boolean>
  onStepChange: (step: BuilderStep) => void
}

export function BuilderStepper({ step, done, onStepChange }: BuilderStepperProps) {
  return (
    <Card className={cardSoftClassName}>
      <CardContent>
        <ol className="flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
          {stepDefinitions.map((item, index) => {
            const Icon = stepIcons[item.id]
            const isCurrent = step === item.id
            const isDone = done[item.id]
            return (
              <li key={item.id} className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onStepChange(item.id)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    isCurrent ? 'border-indigo-300 bg-indigo-50/80' : 'border-indigo-100 bg-white/70 hover:border-indigo-200 hover:bg-indigo-50/50'
                  }`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      isDone ? 'bg-emerald-100 text-emerald-700' : isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isDone ? <Check aria-hidden="true" className="size-4" /> : <span aria-hidden="true">{index + 1}</span>}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Icon aria-hidden="true" className={`size-4 shrink-0 ${isCurrent ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span className={`truncate text-sm font-medium ${isCurrent ? 'text-indigo-900' : 'text-slate-600'}`}>{item.label}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
