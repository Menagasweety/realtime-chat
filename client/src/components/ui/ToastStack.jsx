export default function ToastStack({ toasts }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast glass-card">
          {toast.message}
        </div>
      ))}
    </div>
  );
}
