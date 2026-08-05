export default function AnalyticsPage() {
    return (
      <>
        <header className="page-heading">
          <div>
            <p className="eyebrow">Statistika</p>
            <h1>Analitika</h1>
            <p>
              NFC ochilishlari va gazeta ko‘rishlari shu
              sahifada ko‘rsatiladi.
            </p>
          </div>
        </header>
  
        <section className="content-panel">
          <div className="empty-state large-empty-state">
            <div className="empty-state-icon">↗</div>
            <h2>Statistik ma’lumotlar hali yo‘q</h2>
            <p>
              Gazetalar nashr qilingandan keyin NFC va o‘qish
              statistikasi shu yerda chiqadi.
            </p>
          </div>
        </section>
      </>
    );
  }