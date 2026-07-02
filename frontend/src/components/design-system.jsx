import React from 'react';
import { Heart, X } from 'lucide-react';

export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const featureTone = {
  primary: {
    icon: 'from-emerald-600 to-teal-600',
    soft: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    line: 'border-emerald-100',
  },
  appointment: {
    icon: 'from-teal-500 to-sky-500',
    soft: 'bg-sky-50 text-sky-700 border-sky-100',
    line: 'border-sky-100',
  },
  record: {
    icon: 'from-blue-600 to-indigo-600',
    soft: 'bg-blue-50 text-blue-700 border-blue-100',
    line: 'border-blue-100',
  },
  ai: {
    icon: 'from-violet-600 to-indigo-600',
    soft: 'bg-violet-50 text-violet-700 border-violet-100',
    line: 'border-violet-100',
  },
  emergency: {
    icon: 'from-rose-600 to-red-600',
    soft: 'bg-rose-50 text-rose-700 border-rose-100',
    line: 'border-rose-100',
  },
  warning: {
    icon: 'from-amber-500 to-orange-500',
    soft: 'bg-amber-50 text-amber-800 border-amber-100',
    line: 'border-amber-100',
  },
};

export function BrandMark({ label = 'Helio', subtitle = 'Connected care, calmly managed', tone = 'primary' }) {
  let resolvedTone = tone;
  if (!featureTone[tone]) {
    console.error(
      `[BrandMark] Invalid tone value "${tone}" supplied. Falling back to "primary". Valid tones are: ${Object.keys(
        featureTone
      ).join(', ')}`
    );
    resolvedTone = 'primary';
  }
  return (
    <div className="flex items-center gap-3">
      <div className={cn('grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-[var(--shadow-glow)]', featureTone[resolvedTone].icon)}>
        <Heart className="h-6 w-6" aria-hidden="true" />
      </div>
      <div>
        <div className="text-xl font-semibold tracking-normal text-slate-950">{label}</div>
        <div className="text-xs font-medium text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}

export function Button({ variant = 'primary', size = 'md', className, children, ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    icon: 'btn-icon',
  };
  const sizes = {
    sm: 'min-h-10 px-3 text-sm',
    md: 'min-h-11 px-4 text-sm',
    lg: 'min-h-12 px-5 text-base',
  };
  return (
    <button className={cn(variants[variant], variant !== 'icon' && sizes[size], className)} {...props}>
      {children}
    </button>
  );
}

export function IconButton({ label, children, className, ...props }) {
  return (
    <button aria-label={label} title={label} className={cn('btn-icon', className)} {...props}>
      {children}
    </button>
  );
}

export function Card({ className, children, interactive = false, ...props }) {
  return (
    <section className={cn('helio-card', interactive && 'helio-card-interactive', className)} {...props}>
      {children}
    </section>
  );
}

export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="section-kicker mb-3">{eyebrow}</p>}
        <h2 className="text-balance text-2xl font-semibold text-slate-950 sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, detail, tone = 'primary' }) {
  return (
    <Card interactive className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          {detail && <p className="mt-2 text-sm text-slate-600">{detail}</p>}
        </div>
        <div className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl border', featureTone[tone].soft)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-12 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-slate-400 shadow-sm">
        <Icon className="h-8 w-8" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ModalShell({ children, onClose, title, subtitle, icon: Icon, tone = 'primary', size = 'max-w-2xl' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={cn('surface-card-strong max-h-[90vh] w-full overflow-hidden', size)}>
        <div className="flex items-center justify-between gap-4 border-b border-slate-200/80 p-5 sm:p-6">
          <div className="flex min-w-0 items-center gap-4">
            {Icon && (
              <div className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-[var(--shadow-soft)]', featureTone[tone].icon)}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <h2 id="modal-title" className="truncate text-xl font-semibold text-slate-950 sm:text-2xl">{title}</h2>
              {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
            </div>
          </div>
          <IconButton label="Close dialog" onClick={onClose}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, helper }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {helper && <span className="mt-1 block text-xs leading-5 text-slate-500">{helper}</span>}
    </label>
  );
}
