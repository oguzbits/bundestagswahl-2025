function App() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'screen',
      backgroundColor: '#f8fafc',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <img src="/favicon.svg" alt="German Flag" style={{ width: '96px', height: 'auto', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', marginBottom: '16px' }} />
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>Bundestagswahl 2025 Results Explorer</h1>
    </div>
  );
}

export default App;
