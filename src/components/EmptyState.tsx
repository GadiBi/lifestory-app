interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {icon && (
        <div className="w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
          {icon}
        </div>
      )}
      <h2 className="text-xl font-semibold text-slate-900 mb-2 tracking-tight">{title}</h2>
      {description && (
        <p className="text-slate-500 max-w-sm mb-8 text-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="flex flex-col items-center gap-3">{action}</div>}
    </div>
  );
}
