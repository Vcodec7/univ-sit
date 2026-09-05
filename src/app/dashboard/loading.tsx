export default function DashboardLoading() {
  return (
    <main className="container dashboard-page" aria-busy="true" aria-label="Открываем профиль">
      <div className="svc-skel" style={{ padding: '1rem 0' }}>
        <div className="svc-skel__pill" />
        <div className="svc-skel__row" />
        <div className="svc-skel__row" />
        <div className="svc-skel__row" />
      </div>
    </main>
  );
}
