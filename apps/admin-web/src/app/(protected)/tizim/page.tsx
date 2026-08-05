export default function SystemPage() {
    return (
      <>
        <header className="page-heading">
          <div>
            <p className="eyebrow">Platforma</p>
            <h1>Tizim sozlamalari</h1>
            <p>
              Gazeta, NFC, audio va qayta ishlash sozlamalari.
            </p>
          </div>
        </header>
  
        <section className="content-panel">
          <div className="empty-state large-empty-state">
            <div className="empty-state-icon">⚙</div>
            <h2>Asosiy sozlamalar</h2>
            <p>
              Sozlamalar moduli PDF qayta ishlash tizimidan
              keyin ulanadi.
            </p>
          </div>
        </section>
      </>
    );
  }