'use client';

import { useMemo, useState } from "react";
import type { Student } from "@/lib/types";
import styles from "./CourseDashboard.module.css";

type Props = {
  courseName: string;
  students: Student[];
  canEdit: boolean;
};

type RowState = {
  student: Student;
  attendance: string[];
  av: string;
  sv: string;
  saving: boolean;
  message: null | { type: "error" | "success"; text: string };
};

function cloneAttendance(values: string[]): string[] {
  return [...values];
}

export default function CourseDashboard({
  courseName,
  students,
  canEdit,
}: Props) {
  const [rows, setRows] = useState<RowState[]>(
    students.map((student) => ({
      student,
      attendance: cloneAttendance(student.attendance),
      av: student.av,
      sv: student.sv,
      saving: false,
      message: null,
    })),
  );

  const totalStudents = rows.length;

  function updateRowField(
    id: string,
    field: "attendance" | "av" | "sv",
    value: string | { index: number; value: string },
  ) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.student.id !== id) {
          return row;
        }
        if (field === "attendance") {
          const { index, value: attendanceValue } = value as {
            index: number;
            value: string;
          };
          const attendance = cloneAttendance(row.attendance);
          attendance[index] = attendanceValue;
          return {
            ...row,
            attendance,
          };
        }
        return {
          ...row,
          [field]: value as string,
        };
      }),
    );
  }

  async function handleSave(id: string) {
    setRows((prev) =>
      prev.map((row) =>
        row.student.id === id ? { ...row, saving: true, message: null } : row,
      ),
    );

    const payload = rows.find((row) => row.student.id === id);
    if (!payload) return;

    const response = await fetch(`/api/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attendance: payload.attendance,
        av: payload.av,
        sv: payload.sv,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setRows((prev) =>
        prev.map((row) =>
          row.student.id === id
            ? {
                ...row,
                saving: false,
                message: {
                  type: "error",
                  text:
                    data.error ??
                    "Es ist ein Fehler beim Speichern aufgetreten.",
                },
              }
            : row,
        ),
      );
      return;
    }

    const data = await response.json();
    setRows((prev) =>
      prev.map((row) =>
        row.student.id === id
          ? {
              ...row,
              student: data.student,
              attendance: cloneAttendance(data.student.attendance),
              av: data.student.av,
              sv: data.student.sv,
              saving: false,
              message: {
                type: "success",
                text: "Änderungen gespeichert.",
              },
            }
          : row,
      ),
    );
  }

  const rowMetadata = useMemo(
    () =>
      rows.map((row) => ({
        id: row.student.id,
        dirty:
          JSON.stringify(row.attendance) !==
            JSON.stringify(row.student.attendance) ||
          row.av !== row.student.av ||
          row.sv !== row.student.sv,
      })),
    [rows],
  );

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Kursblatt: {courseName}</h1>
          <p className={styles.subtitle}>
            Anwesenheit sowie AV/SV werden hier gepflegt. Stammdaten sind nur
            auf Blatt 1 bearbeitbar.
          </p>
        </div>
        <button type="button" className={styles.logoutButton} onClick={handleLogout}>
          Abmelden
        </button>
      </div>

      <div className={styles.tableWrapper}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th>Vorname</th>
                <th>Nachname</th>
                <th>Geschlecht</th>
                <th>Schule</th>
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
              {rows.length === 0 && (
                <tr>
                  <td colSpan={13}>
                    Derzeit sind keine Teilnehmer:innen diesem Kurs zugeordnet.
                    Die Zuordnung erfolgt durch die Administration auf Blatt 1.
                  </td>
                </tr>
              )}
              {rows.map((row, index) => {
                const meta = rowMetadata[index];
                return (
                  <tr key={row.student.id}>
                    <td className={styles.readonly}>{row.student.firstName}</td>
                    <td className={styles.readonly}>{row.student.lastName}</td>
                    <td className={styles.readonly}>{row.student.gender}</td>
                    <td className={styles.readonly}>{row.student.school}</td>
                    {row.attendance.map((value, idx) => (
                      <td key={`${row.student.id}-attendance-${idx}`}>
                        <input
                          className={styles.rowInput}
                          value={value}
                          onChange={(event) =>
                            updateRowField(row.student.id, "attendance", {
                              index: idx,
                              value: event.target.value,
                            })
                          }
                          disabled={!canEdit || row.saving}
                        />
                      </td>
                    ))}
                    <td>
                      <input
                        className={styles.rowInput}
                        value={row.av}
                        onChange={(event) =>
                          updateRowField(row.student.id, "av", event.target.value)
                        }
                        disabled={!canEdit || row.saving}
                      />
                    </td>
                    <td>
                      <input
                        className={styles.rowInput}
                        value={row.sv}
                        onChange={(event) =>
                          updateRowField(row.student.id, "sv", event.target.value)
                        }
                        disabled={!canEdit || row.saving}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className={styles.saveButton}
                        onClick={() => handleSave(row.student.id)}
                        disabled={!canEdit || !meta.dirty || row.saving}
                      >
                        {row.saving ? "Speichern..." : "Speichern"}
                      </button>
                      {row.message && (
                        <div
                          className={
                            row.message.type === "error"
                              ? styles.bannerError
                              : styles.bannerSuccess
                          }
                        >
                          {row.message.text}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.statusLine}>
          <span>Teilnehmer:innen: {totalStudents}</span>
          <span>
            Änderungen betreffen automatisch das Stammdaten-Blatt (Zeilen werden
            verknüpft).
          </span>
        </div>
      </div>
    </div>
  );
}
