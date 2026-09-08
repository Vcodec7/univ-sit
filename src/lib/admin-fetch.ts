import toast from 'react-hot-toast';

const TOAST_MS = 5000;

function looksRawCode(msg: string) {
  return /^(INVALID|UNAUTHORIZED|FORBIDDEN|INTERNAL|ERROR|OVERBOOK|401|403|404|500|502|503|504)\b/i.test(msg.trim());
}

function looksStack(msg: string) {
  return /at\s+\S+\s+\(/.test(msg) || msg.includes('\n    at ');
}

export function adminErrorMessage(status: number, body?: unknown): string {
  const raw =
    body && typeof body === 'object' && body !== null && 'message' in body
      ? String((body as { message?: unknown }).message || '')
      : '';
  if (status === 401) return 'Нужно войти в аккаунт';
  if (status === 403) return 'Недостаточно прав для этого действия';
  if (status === 404) return 'Запись не найдена';
  if (status === 409) return 'Конфликт данных. Обновите страницу';
  if (status === 429) return 'Слишком много запросов. Подождите немного';
  if (status >= 500) return 'Сервер временно недоступен. Попробуйте позже';
  if (!raw || looksRawCode(raw) || looksStack(raw)) return 'Не удалось выполнить действие';
  return raw.slice(0, 240);
}

export function toastAdminError(status: number, body?: unknown) {
  toast.error(adminErrorMessage(status, body), { duration: TOAST_MS, id: `admin-err-${status}` });
}

export async function parseAdminJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    const res = await fetch(input, { credentials: 'same-origin', ...init });
    if (!res.ok) {
      const body = await parseAdminJson(res.clone());
      toastAdminError(res.status, body);
    }
    return res;
  } catch {
    toast.error('Нет соединения с сервером', { duration: TOAST_MS, id: 'admin-err-net' });
    throw new Error('network');
  }
}
