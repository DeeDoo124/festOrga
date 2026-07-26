import { apiFetch } from './api';

const QUEUE_KEY = 'festorga_offline_expense_queue';

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Ajoute une dépense à la file d'attente locale, à envoyer dès que le réseau revient
export function enqueueExpense(eventId, payload) {
  const queue = getQueue();
  const item = {
    localId: `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    eventId,
    payload,
    createdAt: Date.now(),
  };
  queue.push(item);
  saveQueue(queue);
  return item;
}

// Dépenses en attente pour un événement donné, pour affichage optimiste
export function getQueuedExpenses(eventId) {
  return getQueue().filter((item) => item.eventId === eventId);
}

// Tente d'envoyer toutes les dépenses en attente ; garde celles qui échouent encore
export async function flushQueue() {
  const queue = getQueue();
  if (queue.length === 0) return;

  const remaining = [];
  for (const item of queue) {
    try {
      await apiFetch(`/api/events/${item.eventId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(item.payload),
      });
    } catch {
      remaining.push(item);
    }
  }
  saveQueue(remaining);
}
