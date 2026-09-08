'use client';

import { useEffect, useState } from 'react';
import { adminFetch } from '@/lib/admin-fetch';

type Hall = {
  spaceId: string;
  title: string;
  category: string;
  capacity: number;
  loadPct: number;
  slots: Array<{
    start: string;
    end: string;
    startMin: number;
    status: string;
    label: string | null;
  }>;
};

function todayYmd() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default function AdminOccupancyClient() {
  const [day, setDay] = useState(todayYmd());
  const [halls, setHalls] = useState<Hall[]>([]);
  const [note, setNote] = useState('Уборка');
  const [blocking, setBlocking] = useState<string | null>(null);

  function refresh() {
    return adminFetch(`/api/admin/occupancy?day=${encodeURIComponent(day)}`).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) return;
      setHalls(data.halls || []);
    });
  }

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [day]);

  async function blockSlot(spaceId: string, start: string, end: string) {
    setBlocking(spaceId + start);
    try {
      const r = await adminFetch('/api/admin/occupancy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId, startTime: start, endTime: end, kind: 'SERVICE', note }),
      });
      if (r.ok) await refresh();
    } finally {
      setBlocking(null);
    }
  }

  async function unblockSlot(spaceId: string, start: string, end: string) {
    setBlocking(spaceId + start);
    try {
      const r = await adminFetch('/api/admin/occupancy', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId, startTime: start, endTime: end }),
      });
      if (r.ok) await refresh();
    } finally {
      setBlocking(null);
    }
  }

  return (
    <div className="admin-occ">
      <div className="admin-occ-toolbar">
        <label>
          День
          <input type="date" value={day} onChange={(e) => setDay(e.target.value)} />
        </label>
        <label>
          Подпись блокировки
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
      </div>
      <div className="admin-table-wrap admin-table-wrap--sticky">
        <table>
          <thead>
            <tr>
              <th>Зал</th>
              <th>Категория</th>
              <th>Загрузка</th>
              <th>Слоты</th>
            </tr>
          </thead>
          <tbody>
            {halls.map((hall) => (
              <tr key={hall.spaceId}>
                <td data-label="Зал">{hall.title}</td>
                <td data-label="Категория">{hall.category}</td>
                <td data-label="Загрузка">{hall.loadPct}%</td>
                <td data-label="Слоты">
                  <div className="admin-occ-slots">
                    {hall.slots.map((slot) => (
                      <div key={slot.start} className={`admin-occ-slot is-${slot.status}`}>
                        <span>
                          {String(Math.floor(slot.startMin / 60)).padStart(2, '0')}:
                          {String(slot.startMin % 60).padStart(2, '0')} · {slot.label || slot.status}
                        </span>
                        {slot.status === 'free' ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={blocking === hall.spaceId + slot.start}
                            onClick={() => blockSlot(hall.spaceId, slot.start, slot.end)}
                          >
                            Блок
                          </button>
                        ) : null}
                        {slot.status === 'service' || slot.status === 'closed' ? (
                          <button
                            type="button"
                            className="btn btn-secondary"
                            disabled={blocking === hall.spaceId + slot.start}
                            onClick={() => unblockSlot(hall.spaceId, slot.start, slot.end)}
                          >
                            Снять
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
