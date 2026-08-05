const statistics = [
    {
      label: "Barcha nashrlar",
      value: "0",
      description: "Tizimga kiritilgan sonlar",
    },
    {
      label: "Nashr qilingan",
      value: "0",
      description: "Ommaga ochiq gazeta sonlari",
    },
    {
      label: "Tekshiruvda",
      value: "0",
      description: "Muharrir tasdig‘ini kutmoqda",
    },
    {
      label: "NFC ochilishlari",
      value: "0",
      description: "Umumiy NFC tashriflari",
    },
  ];
  
  export default function DashboardPage() {
    return (
      <>
        <header className="page-heading">
          <div>
            <p className="eyebrow">Umumiy ko‘rinish</p>
            <h1>Boshqaruv paneli</h1>
            <p>
              Gazeta nashrlari, qayta ishlash holati va NFC
              tashriflarini shu yerdan boshqarasiz.
            </p>
          </div>
        </header>
  
        <section
          className="statistics-grid"
          aria-label="Asosiy ko‘rsatkichlar"
        >
          {statistics.map((item) => (
            <article
              key={item.label}
              className="statistic-card"
            >
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </section>
  
        <section className="dashboard-grid">
          <article className="content-panel">
            <div className="panel-heading">
              <div>
                <h2>So‘nggi nashrlar</h2>
                <p>Yaqinda qo‘shilgan gazeta sonlari</p>
              </div>
            </div>
  
            <div className="empty-state">
              <div className="empty-state-icon">▤</div>
              <h3>Hozircha gazeta nashri yo‘q</h3>
              <p>
                Keyingi bosqichda yangi nashr yaratish va PDF
                yuklash funksiyasini qo‘shamiz.
              </p>
            </div>
          </article>
  
          <article className="content-panel">
            <div className="panel-heading">
              <div>
                <h2>Tizim holati</h2>
                <p>Asosiy servislarning holati</p>
              </div>
            </div>
  
            <div className="system-status-list">
              <div>
                <span className="status-dot status-online" />
                <span>Admin panel</span>
                <strong>Faol</strong>
              </div>
  
              <div>
                <span className="status-dot status-online" />
                <span>Backend API</span>
                <strong>Ulangan</strong>
              </div>
  
              <div>
                <span className="status-dot status-waiting" />
                <span>PDF worker</span>
                <strong>Keyingi bosqich</strong>
              </div>
            </div>
          </article>
        </section>
      </>
    );
  }