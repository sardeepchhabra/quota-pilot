function App() {
  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>QuotaPilot</h1>
          <p>Know your AI headroom.</p>
        </div>

        <button className="refresh-button">Refresh</button>
      </header>

      <section className="summary">
        <div>
          <span className="label">Connected accounts</span>
          <strong>0</strong>
        </div>

        <div>
          <span className="label">Available capacity</span>
          <strong>—</strong>
        </div>

        <div>
          <span className="label">Last updated</span>
          <strong>Never</strong>
        </div>
      </section>

      <section className="providers">
        <div className="section-header">
          <h2>AI Providers</h2>
          <span>Mock data</span>
        </div>

        <div className="empty-state">
          <h3>No providers connected</h3>
          <p>
            Connect your AI accounts to see usage, remaining quota and reset
            times in one place.
          </p>

          <button className="primary-button">Add Provider</button>
        </div>
      </section>
    </main>
  );
}

export default App;