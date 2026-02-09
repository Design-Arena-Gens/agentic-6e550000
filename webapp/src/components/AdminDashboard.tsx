'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Student } from "@/lib/types";
import styles from "./AdminDashboard.module.css";

type Props = {
  initialStudents: Student[];
};

type StudentDraft = Omit<Student, "id">;

const EMPTY_FIELD = "";

function createEmptyDraft(): StudentDraft {
  return {
    firstName: "",
    lastName: "",
    gender: "",
    birthDate: "",
    school: "",
    desiredCourse: "",
    courses: [EMPTY_FIELD, EMPTY_FIELD, EMPTY_FIELD, EMPTY_FIELD, EMPTY_FIELD, EMPTY_FIELD],
    attendance: [EMPTY_FIELD, EMPTY_FIELD, EMPTY_FIELD, EMPTY_FIELD, EMPTY_FIELD, EMPTY_FIELD],
    av: "",
    sv: "",
  };
}

function computeCourses(students: Student[]): string[] {
  const set = new Set<string>();
  students.forEach((student) => {
    student.courses.forEach((course) => {
      if (course.trim()) {
        set.add(course.trim());
      }
    });
    if (student.desiredCourse.trim()) {
      set.add(student.desiredCourse.trim());
    }
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "de"));
}

type RowMessage = { type: "error"; text: string } | null;

type StudentRowProps = {
  student: Student;
  onSave: (student: Student) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
};

function StudentRow({ student, onSave, onDelete }: StudentRowProps) {
  const [draft, setDraft] = useState<Student>(student);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<RowMessage>(null);

  useEffect(() => {
    setDraft(student);
  }, [student]);

  const changed = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(student);
  }, [draft, student]);

  function updateField(field: keyof Student, value: unknown) {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function updateArrayField(
    field: "courses" | "attendance",
    index: number,
    value: string,
  ) {
    setDraft((prev) => {
      const clone = [...prev[field]] as Student["courses"];
      clone[index] = value;
      return {
        ...prev,
        [field]: clone as Student["courses"],
      };
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const ok = await onSave(draft);
    if (!ok) {
      setMessage({ type: "error", text: "Speichern fehlgeschlagen." });
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!window.confirm("Soll dieser Eintrag wirklich gelöscht werden?")) {
      return;
    }
    setSaving(true);
    await onDelete(student.id);
    setSaving(false);
  }

  function handleReset() {
    setDraft(student);
    setMessage(null);
  }

  return (
    <tr>
      <td>
        <input
          className={styles.rowInput}
          value={draft.firstName}
          onChange={(event) => updateField("firstName", event.target.value)}
        />
      </td>
      <td>
        <input
          className={styles.rowInput}
          value={draft.lastName}
          onChange={(event) => updateField("lastName", event.target.value)}
        />
      </td>
      <td>
        <input
          className={styles.rowInput}
          value={draft.gender}
          onChange={(event) => updateField("gender", event.target.value)}
        />
      </td>
      <td>
        <input
          className={styles.rowInput}
          type="date"
          value={draft.birthDate}
          onChange={(event) => updateField("birthDate", event.target.value)}
        />
      </td>
      <td>
        <input
          className={styles.rowInput}
          value={draft.school}
          onChange={(event) => updateField("school", event.target.value)}
        />
      </td>
      <td>
        <input
          className={styles.rowInput}
          value={draft.desiredCourse}
          onChange={(event) => updateField("desiredCourse", event.target.value)}
        />
      </td>
      {draft.courses.map((course, index) => (
        <td key={`course-${student.id}-${index}`}>
          <input
            className={styles.rowInput}
            value={course}
            onChange={(event) =>
              updateArrayField("courses", index, event.target.value)
            }
          />
        </td>
      ))}
      {draft.attendance.map((status, index) => (
        <td key={`attendance-${student.id}-${index}`}>
          <input
            className={styles.rowInput}
            value={status}
            onChange={(event) =>
              updateArrayField("attendance", index, event.target.value)
            }
          />
        </td>
      ))}
      <td>
        <input
          className={styles.rowInput}
          value={draft.av}
          onChange={(event) => updateField("av", event.target.value)}
        />
      </td>
      <td>
        <input
          className={styles.rowInput}
          value={draft.sv}
          onChange={(event) => updateField("sv", event.target.value)}
        />
      </td>
      <td>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleSave}
            disabled={!changed || saving}
            className={styles.saveButton}
          >
            Speichern
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!changed || saving}
            className={styles.resetButton}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className={styles.deleteButton}
          >
            Löschen
          </button>
        </div>
        {message && (
          <div className={styles.errorBanner} style={{ marginTop: "0.5rem" }}>
            {message.text}
          </div>
        )}
      </td>
    </tr>
  );
}

export default function AdminDashboard({ initialStudents }: Props) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [draft, setDraft] = useState<StudentDraft>(createEmptyDraft());
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<null | {
    type: "error" | "success";
    text: string;
  }>(null);

  const courses = useMemo(() => computeCourses(students), [students]);

  const studentCount = students.length;

  function updateDraft<K extends keyof StudentDraft>(key: K, value: StudentDraft[K]) {
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function updateDraftArray(
    field: "courses" | "attendance",
    index: number,
    value: string,
  ) {
    setDraft((prev) => {
      const clone = [...prev[field]] as Student["courses"];
      clone[index] = value;
      return {
        ...prev,
        [field]: clone as Student["courses"],
      };
    });
  }

  const resetDraft = useCallback(() => {
    setDraft(createEmptyDraft());
  }, []);

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    const response = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setFeedback({
        type: "error",
        text:
          data.error ??
          "Der neue Eintrag konnte nicht gespeichert werden. Bitte prüfen Sie die Angaben.",
      });
      setSubmitting(false);
      return;
    }

    const data = await response.json();
    setStudents((prev) => [...prev, data.student as Student]);
    setFeedback({
      type: "success",
      text: "Schüler:in wurde erfolgreich angelegt.",
    });
    resetDraft();
    setSubmitting(false);
  }

  const handleSave = useCallback(
    async (student: Student) => {
      const response = await fetch(`/api/students/${student.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...student,
        }),
      });
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      setStudents((prev) =>
        prev.map((entry) => (entry.id === student.id ? data.student : entry)),
      );
      return true;
    },
    [setStudents],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/students/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setStudents((prev) => prev.filter((student) => student.id !== id));
      }
    },
    [setStudents],
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.shell}>
        <div className={styles.topBar}>
          <div className={styles.titleGroup}>
            <h1 className={styles.headline}>Stammdaten (Blatt 1)</h1>
            <p className={styles.subtitle}>
              Nur Administrator:innen können hier Änderungen vornehmen. Alle
              Anpassungen synchronisieren sich automatisch mit den Kursblättern.
            </p>
          </div>
          <button type="button" className={styles.logoutButton} onClick={handleLogout}>
            Abmelden
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.cards}>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Statistik</h2>
              <div className={styles.courseList}>
                <div className={styles.courseItem}>
                  <span>Schüler:innen insgesamt</span>
                  <span className={styles.badge}>{studentCount}</span>
                </div>
                <div className={styles.courseItem}>
                  <span>Aktive Kurse</span>
                  <span className={styles.badge}>{courses.length}</span>
                </div>
              </div>
            </div>

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Kursblätter</h2>
              <div className={styles.courseList}>
                {courses.length === 0 && (
                  <div className={styles.emptyState}>
                    Noch keine Kurse eingetragen. Sobald Kurse zugeordnet sind,
                    entstehen hier Verlinkungen zu den Kursblättern.
                  </div>
                )}
                {courses.map((course) => (
                  <div key={course} className={styles.courseItem}>
                    <span>{course}</span>
                    <a
                      className={styles.courseLink}
                      href={`/courses/${encodeURIComponent(course)}`}
                    >
                      öffnen
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <h2 className={styles.cardTitle}>
              Neuer Eintrag (nur durch Admin)
            </h2>
            <form className={styles.formGrid} onSubmit={handleCreate}>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="firstName">
                  Vorname
                </label>
                <input
                  id="firstName"
                  className={styles.input}
                  value={draft.firstName}
                  onChange={(event) =>
                    updateDraft("firstName", event.target.value)
                  }
                  required
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="lastName">
                  Nachname
                </label>
                <input
                  id="lastName"
                  className={styles.input}
                  value={draft.lastName}
                  onChange={(event) => updateDraft("lastName", event.target.value)}
                  required
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="gender">
                  Geschlecht
                </label>
                <input
                  id="gender"
                  className={styles.input}
                  value={draft.gender}
                  onChange={(event) => updateDraft("gender", event.target.value)}
                  required
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="birthDate">
                  Geburtsdatum
                </label>
                <input
                  id="birthDate"
                  type="date"
                  className={styles.input}
                  value={draft.birthDate}
                  onChange={(event) =>
                    updateDraft("birthDate", event.target.value)
                  }
                  required
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="school">
                  Schule
                </label>
                <input
                  id="school"
                  className={styles.input}
                  value={draft.school}
                  onChange={(event) => updateDraft("school", event.target.value)}
                  required
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="desiredCourse">
                  Wunschkurs
                </label>
                <input
                  id="desiredCourse"
                  className={styles.input}
                  value={draft.desiredCourse}
                  onChange={(event) =>
                    updateDraft("desiredCourse", event.target.value)
                  }
                />
              </div>
              {draft.courses.map((course, index) => (
                <div key={`draft-course-${index}`} className={styles.formField}>
                  <label className={styles.formLabel} htmlFor={`course-${index}`}>
                    Kurs {index + 1}
                  </label>
                  <input
                    id={`course-${index}`}
                    className={styles.input}
                    value={course}
                    onChange={(event) =>
                      updateDraftArray("courses", index, event.target.value)
                    }
                  />
                </div>
              ))}
              {draft.attendance.map((value, index) => (
                <div
                  key={`draft-attendance-${index}`}
                  className={styles.formField}
                >
                  <label
                    className={styles.formLabel}
                    htmlFor={`attendance-${index}`}
                  >
                    Anwesenheit {index + 1}
                  </label>
                  <input
                    id={`attendance-${index}`}
                    className={styles.input}
                    value={value}
                    onChange={(event) =>
                      updateDraftArray("attendance", index, event.target.value)
                    }
                  />
                </div>
              ))}
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="av">
                  AV
                </label>
                <input
                  id="av"
                  className={styles.input}
                  value={draft.av}
                  onChange={(event) => updateDraft("av", event.target.value)}
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel} htmlFor="sv">
                  SV
                </label>
                <input
                  id="sv"
                  className={styles.input}
                  value={draft.sv}
                  onChange={(event) => updateDraft("sv", event.target.value)}
                />
              </div>
              <div className={styles.formField} style={{ alignSelf: "flex-end" }}>
                <button
                  type="submit"
                  className={styles.primaryButton}
                  disabled={submitting}
                >
                  {submitting ? "Speichern..." : "Schüler:in anlegen"}
                </button>
              </div>
            </form>
            {feedback && (
              <div
                className={
                  feedback.type === "error"
                    ? styles.errorBanner
                    : styles.successBanner
                }
              >
                {feedback.text}
              </div>
            )}
          </div>

          <div className={styles.tableWrapper}>
            <div className={styles.tableScroll}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    <th>Vorname</th>
                    <th>Nachname</th>
                    <th>Geschlecht</th>
                    <th>Geburtsdatum</th>
                    <th>Schule</th>
                    <th>Wunschkurs</th>
                    <th>Kurs 1</th>
                    <th>Kurs 2</th>
                    <th>Kurs 3</th>
                    <th>Kurs 4</th>
                    <th>Kurs 5</th>
                    <th>Kurs 6</th>
                    <th>Anwesenheit 1</th>
                    <th>Anwesenheit 2</th>
                    <th>Anwesenheit 3</th>
                    <th>Anwesenheit 4</th>
                    <th>Anwesenheit 5</th>
                    <th>Anwesenheit 6</th>
                    <th>AV</th>
                    <th>SV</th>
                    <th>Aktionen</th>
                  </tr>
                </thead>
                <tbody className={styles.tbody}>
                  {students.length === 0 && (
                    <tr>
                      <td colSpan={21}>
                        Es sind noch keine Einträge vorhanden. Legen Sie oben
                        neue Schüler:innen an.
                      </td>
                    </tr>
                  )}
                  {students.map((student) => (
                    <StudentRow
                      key={student.id}
                      student={student}
                      onSave={handleSave}
                      onDelete={handleDelete}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.statusBar}>
              <span>
                Maximale Kursanzahl: 12. Aktuell verwendete Kurse:{" "}
                {courses.length}
              </span>
              <span>Änderungen werden sofort gespeichert.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
