"use client";

import {
  type FormEvent,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { getApiErrorMessage } from "@/lib/auth";

function getSafeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState(
    "admin@temiryolchi.uz",
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    const normalizedEmail = email.trim();

    if (!normalizedEmail || !password) {
      setError("Email va parolni kiriting.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data,
            "Email yoki parol noto‘g‘ri.",
          ),
        );
      }

      const nextPath = getSafeRedirectPath(
        searchParams.get("next"),
      );

      router.replace(nextPath);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Kutilmagan xatolik yuz berdi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="login-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <div className="form-field">
        <label htmlFor="email">Email manzil</label>

        <input
          id="email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="admin@temiryolchi.uz"
          autoComplete="email"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="form-field">
        <label htmlFor="password">Parol</label>

        <div className="password-field">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Parolingizni kiriting"
            autoComplete="current-password"
            required
            disabled={isSubmitting}
          />

          <button
            type="button"
            className="password-toggle"
            onClick={() =>
              setShowPassword((current) => !current)
            }
            aria-label={
              showPassword
                ? "Parolni yashirish"
                : "Parolni ko‘rsatish"
            }
          >
            {showPassword ? "Yashirish" : "Ko‘rsatish"}
          </button>
        </div>
      </div>

      {error ? (
        <div
          className="error-message"
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        className="primary-button login-submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <span className="button-spinner" />
            Kirilmoqda...
          </>
        ) : (
          "Admin panelga kirish"
        )}
      </button>
    </form>
  );
}