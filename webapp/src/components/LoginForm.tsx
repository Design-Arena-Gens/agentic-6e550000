'use client';

import { useMemo, useState } from "react";
import styles from "./LoginForm.module.css";

type Props = {
  initialCourses: string[];
};

const roleOptions = [
  { value: "admin", label: "Administrator/in" },
  { value: "course", label: "Kursleitung" },
];

function LoginForm({ initialCourses }: Props) {
  const [role, setRole] = useState<"admin" | "course">("admin");
  const [password, setPassword] = useState("");
  const [course, setCourse] = useState(initialCourses[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleRoleChange(nextRole: "admin" | "course") {
    setRole(nextRole);
    setPassword("");
    setError(null);
    if (nextRole === "course" && !course && initialCourses.length > 0) {
      setCourse(initialCourses[0]);
    }
    if (nextRole === "admin") {
      setCourse(initialCourses[0] ?? "");
    }
  }

  const courseOptions = useMemo(() => {
    if (!initialCourses.includes(course) && course.trim().length > 0) {
      return [course, ...initialCourses];
    }
    return initialCourses;
  }, [initialCourses, course]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const payload: Record<string, string> = {
      role,
    };

    if (password) {
      payload.password = password;
    }

    if (role === "course") {
      payload.course = course;
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Login fehlgeschlagen.");
      setLoading(false);
      return;
    }

    const data = await response.json();
    window.location.href = data.redirect ?? "/";
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.heading}>Kursverwaltung Login</h1>
        <p className={styles.description}>
          Administrator:innen pflegen Stammdaten, Kursleitungen erfassen
          Anwesenheit sowie AV/SV.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            Rolle
            <div className={styles.roleGrid}>
              {roleOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleRoleChange(value as "admin" | "course")}
                  className={`${styles.roleButton} ${
                    role === value ? styles.roleButtonActive : ""
                  }`}
                  disabled={loading}
                >
                  {label}
                </button>
              ))}
            </div>
          </label>

          {role === "course" && (
            <label className={styles.label} htmlFor="course">
                Kurs auswählen
                {courseOptions.length > 0 ? (
                <select
                  id="course"
                  className={styles.select}
                  value={course}
                  onChange={(event) => setCourse(event.target.value)}
                  disabled={loading}
                >
                  {courseOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={styles.emptyState}>
                  Noch keine Kurse verfügbar. Administrator:innen tragen zuerst
                  Daten ein.
                </p>
              )}
            </label>
          )}

          <label className={styles.label} htmlFor="password">
              Passwort
            <span className={styles.helper}>
                (entsprechend der Rolle)
            </span>
            <input
              id="password"
              type="password"
              className={styles.input}
              placeholder="Passwort eingeben"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={loading}
            />
          </label>

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading || (role === "course" && !course)}
            className={styles.submit}
          >
            {loading ? "Anmeldung..." : "Anmelden"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
