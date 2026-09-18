type ToastType = 'success' | 'error' | 'info';

interface ToastMessages {
  success?: string;
  error?: string;
}

/**
 * Обёртка для асинхронных операций с автоматическим показом тостов.
 * 
 * @param promise - Промис, который нужно выполнить (например, dispatch(...).unwrap())
 * @param messages - Сообщения для успеха и ошибки
 * @param showToast - Функция показа тоста (из useToast)
 * @returns Результат промиса или null при ошибке
 */
export const withToast = async <T,>(
  promise: Promise<T>,
  messages: ToastMessages,
  showToast: (message: string, type?: ToastType) => void,
  onSuccess?: (result: T) => void  // ← Колбэк после успеха
): Promise<T | null> => {
  try {
    const result = await promise;
    if (messages.success) {
      showToast(messages.success, 'success');
    }
    onSuccess?.(result);  // Вызываем, если передан
    return result;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : messages.error || 'Произошла ошибка';
    showToast(message, 'error');
    return null;
  }
};

