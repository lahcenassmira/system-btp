import { toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function showToast(message: string, type: ToastType = 'info', options?: ToastOptions) {
  const defaultDuration = 4000;
  const duration = options?.duration || defaultDuration;

  const toastOptions = {
    duration,
    action: options?.action,
  };

  switch (type) {
    case 'success':
      return toast.success(message, {
        ...toastOptions,
        icon: '✅',
      });
    
    case 'error':
      return toast.error(message, {
        ...toastOptions,
        icon: '❌',
      });
    
    case 'warning':
      return toast.warning(message, {
        ...toastOptions,
        icon: '⚠️',
      });
    
    case 'info':
    default:
      return toast.info(message, {
        ...toastOptions,
        icon: 'ℹ️',
      });
  }
}

// Convenience functions for common use cases
export const showSuccess = (message: string, options?: ToastOptions) => 
  showToast(message, 'success', options);

export const showError = (message: string, options?: ToastOptions) => 
  showToast(message, 'error', options);

export const showWarning = (message: string, options?: ToastOptions) => 
  showToast(message, 'warning', options);

export const showInfo = (message: string, options?: ToastOptions) => 
  showToast(message, 'info', options);

// Custom toast for loading states
export const showLoading = (message: string) => {
  return toast.loading(message, {
    icon: '⏳',
  });
};

// Promise-based toast for async operations
export const showPromise = <T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  }
) => {
  return toast.promise(promise, messages);
};