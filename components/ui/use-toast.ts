import { useState } from 'react';

interface Toast {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

interface ToastState extends Toast {
  id: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const toast = ({ title, description, variant = 'default' }: Toast) => {
    const id = Math.random().toString(36).substring(7);
    const newToast = { id, title, description, variant };
    
    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  return { toast, toasts };
} 