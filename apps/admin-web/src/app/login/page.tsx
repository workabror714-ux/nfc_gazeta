import { Suspense } from "react";

import { LoginForm } from "@/components/auth/login-form";

function LoginFormLoading() {
  return (
    <div className="login-form-loading">
      <div className="loading-spinner" />
      <p>Login formasi yuklanmoqda...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-visual" aria-hidden="true">
        <div className="railway-lines">
          <span />
          <span />
          <span />
        </div>

        <div className="login-visual-content">
          <div className="large-brand-mark">T</div>

          <p className="eyebrow">Temiryo‘lchi Digital</p>

          <h1>
            Gazetalarni raqamli shaklda boshqarish platformasi
          </h1>

          <p>
            Nashrlarni yuklash, tekshirish va NFC orqali
            o‘quvchilarga yetkazish.
          </p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand">
            <div className="brand-mark">T</div>

            <div>
              <strong>Temiryo‘lchi</strong>
              <span>Admin panel</span>
            </div>
          </div>

          <div className="login-heading">
            <p className="eyebrow">Xush kelibsiz</p>
            <h2>Tizimga kirish</h2>
            <p>
              Davom etish uchun administrator hisobingizni
              kiriting.
            </p>
          </div>

          <Suspense fallback={<LoginFormLoading />}>
            <LoginForm />
          </Suspense>

          <p className="login-help">
            Kirishda muammo bo‘lsa, tizim administratoriga
            murojaat qiling.
          </p>
        </div>
      </section>
    </main>
  );
}