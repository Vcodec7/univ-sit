'use client';

export default function AdminDraftBanner({ onDiscard }: { onDiscard: () => void }) {
  return (
    <div className="admin-draft-banner" role="status">
      <span>Восстановлено из черновика</span>
      <button type="button" className="btn btn-secondary" onClick={onDiscard}>
        Отменить
      </button>
    </div>
  );
}
