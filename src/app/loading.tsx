export default function Loading() {
  return (
    <div className="container" style={{ padding: '2rem', minHeight: '60vh' }}>
      <div style={{
        width: '40%',
        height: '2.5rem',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '2rem',
        animation: 'pulse 1.5s infinite ease-in-out'
      }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.5rem' }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} style={{
            height: '250px',
            backgroundColor: 'rgba(0,0,0,0.05)',
            borderRadius: 'var(--radius-lg)',
            animation: 'pulse 1.5s infinite ease-in-out',
            animationDelay: `${i * 0.1}s`
          }} />
        ))}
      </div>
      <style>{`
        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
