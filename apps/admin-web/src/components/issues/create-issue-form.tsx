"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { getApiErrorMessage } from "@/lib/auth";
import type {
  CreatedIssue,
  NewspaperOption,
} from "@/lib/issues";

const MAX_FILE_SIZE =
  100 * 1024 * 1024;

function getToday(): string {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function CreateIssueForm() {
  const router = useRouter();

  const [newspapers, setNewspapers] =
    useState<NewspaperOption[]>([]);

  const [
    newspaperId,
    setNewspaperId,
  ] = useState("");

  const [
    issueNumber,
    setIssueNumber,
  ] = useState("");

  const [year, setYear] = useState(
    String(new Date().getFullYear()),
  );

  const [
    publicationDate,
    setPublicationDate,
  ] = useState(getToday());

  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [pdfFile, setPdfFile] =
    useState<File | null>(null);

  const [
    isLoadingNewspapers,
    setIsLoadingNewspapers,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [stage, setStage] =
    useState("");

  const [error, setError] =
    useState("");

  useEffect(() => {
    let isCancelled = false;

    void fetch("/api/newspapers", {
      method: "GET",
      cache: "no-store",
    })
      .then(async (response) => {
        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            getApiErrorMessage(
              data,
              "Gazetalar ro‘yxatini olib bo‘lmadi.",
            ),
          );
        }

        return data as NewspaperOption[];
      })
      .then((data) => {
        if (isCancelled) {
          return;
        }

        setNewspapers(data);

        if (data.length > 0) {
          setNewspaperId(
            String(data[0].id),
          );
        }
      })
      .catch((loadError: unknown) => {
        if (isCancelled) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Gazetalarni yuklashda xatolik.",
        );
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingNewspapers(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setError("");

    const selectedFile =
      event.target.files?.[0] ?? null;

    if (!selectedFile) {
      setPdfFile(null);
      return;
    }

    if (
      !selectedFile.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {
      setError(
        "Faqat PDF formatidagi faylni tanlang.",
      );

      event.target.value = "";
      setPdfFile(null);
      return;
    }

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setError(
        "PDF hajmi 100 MB dan oshmasligi kerak.",
      );

      event.target.value = "";
      setPdfFile(null);
      return;
    }

    setPdfFile(selectedFile);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!newspaperId) {
      setError(
        "Gazeta turini tanlang.",
      );
      return;
    }

    if (
      !issueNumber ||
      Number(issueNumber) < 1
    ) {
      setError(
        "Gazeta sonini to‘g‘ri kiriting.",
      );
      return;
    }

    if (
      !year ||
      Number(year) < 1900
    ) {
      setError(
        "Nashr yilini to‘g‘ri kiriting.",
      );
      return;
    }

    if (!publicationDate) {
      setError(
        "Nashr sanasini tanlang.",
      );
      return;
    }

    if (!pdfFile) {
      setError(
        "Gazetaning PDF faylini tanlang.",
      );
      return;
    }

    setIsSubmitting(true);
    setStage(
      "Nashr ma’lumotlari saqlanmoqda...",
    );

    try {
      const createResponse =
        await fetch("/api/issues", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            newspaper_id:
              Number(newspaperId),
            issue_number:
              Number(issueNumber),
            year: Number(year),
            publication_date:
              publicationDate,
            title: title.trim(),
            description:
              description.trim(),
          }),
        });

      const createData =
        await createResponse
          .json()
          .catch(() => null);

      if (!createResponse.ok) {
        throw new Error(
          getApiErrorMessage(
            createData,
            "Nashrni yaratib bo‘lmadi.",
          ),
        );
      }

      const createdIssue =
        createData as CreatedIssue;

      setStage(
        "PDF serverga yuklanmoqda...",
      );

      const uploadFormData =
        new FormData();

      uploadFormData.append(
        "file",
        pdfFile,
      );

      const uploadResponse =
        await fetch(
          `/api/issues/${createdIssue.id}/upload`,
          {
            method: "POST",
            body: uploadFormData,
          },
        );

      const uploadData =
        await uploadResponse
          .json()
          .catch(() => null);

      if (!uploadResponse.ok) {
        throw new Error(
          `Nashr yaratildi, lekin PDF yuklanmadi. ${
            getApiErrorMessage(
              uploadData,
              "PDF yuklashda xatolik.",
            )
          }`,
        );
      }

      setStage(
        "Nashr muvaffaqiyatli yaratildi.",
      );

      router.push("/nashrlar");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Kutilmagan xatolik yuz berdi.",
      );
    } finally {
      setIsSubmitting(false);
      setStage("");
    }
  }

  if (isLoadingNewspapers) {
    return (
      <section className="content-panel">
        <div className="form-loading-state">
          <div className="loading-spinner" />
          <p>
            Gazeta ma’lumotlari yuklanmoqda...
          </p>
        </div>
      </section>
    );
  }

  return (
    <form
      className="issue-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <section className="content-panel form-section">
        <div className="panel-heading">
          <div>
            <h2>Nashr ma’lumotlari</h2>
            <p>
              Gazetaning soni va nashr sanasini kiriting.
            </p>
          </div>
        </div>

        <div className="issue-form-grid">
          <div className="form-field form-field-full">
            <label htmlFor="newspaper">
              Gazeta
            </label>

            <select
              id="newspaper"
              value={newspaperId}
              onChange={(event) =>
                setNewspaperId(
                  event.target.value,
                )
              }
              disabled={isSubmitting}
              required
            >
              <option value="">
                Gazetani tanlang
              </option>

              {newspapers.map(
                (newspaper) => (
                  <option
                    key={newspaper.id}
                    value={newspaper.id}
                  >
                    {newspaper.name}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="issue-number">
              Gazeta soni
            </label>

            <input
              id="issue-number"
              type="number"
              min="1"
              value={issueNumber}
              onChange={(event) =>
                setIssueNumber(
                  event.target.value,
                )
              }
              placeholder="Masalan: 32"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="year">
              Nashr yili
            </label>

            <input
              id="year"
              type="number"
              min="1900"
              max="2100"
              value={year}
              onChange={(event) =>
                setYear(
                  event.target.value,
                )
              }
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="publication-date">
              Nashr sanasi
            </label>

            <input
              id="publication-date"
              type="date"
              value={publicationDate}
              onChange={(event) =>
                setPublicationDate(
                  event.target.value,
                )
              }
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="title">
              Sarlavha
            </label>

            <input
              id="title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              placeholder="Bo‘sh qoldirilsa avtomatik yaratiladi"
              disabled={isSubmitting}
            />
          </div>

          <div className="form-field form-field-full">
            <label htmlFor="description">
              Qisqacha tavsif
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              placeholder="Ushbu gazeta soni haqida qisqacha ma’lumot"
              rows={5}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </section>

      <section className="content-panel form-section">
        <div className="panel-heading">
          <div>
            <h2>Gazeta PDF fayli</h2>
            <p>
              PDF keyingi bosqichda avtomatik ravishda betlarga ajratiladi.
            </p>
          </div>
        </div>

        <div className="file-upload-section">
          <label
            htmlFor="pdf-file"
            className="file-drop-zone"
          >
            <span className="file-drop-icon">
              PDF
            </span>

            <strong>
              Gazeta PDF faylini tanlang
            </strong>

            <span>
              Maksimal hajm: 100 MB
            </span>

            <input
              id="pdf-file"
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
          </label>

          {pdfFile ? (
            <div className="selected-file">
              <div>
                <strong>
                  {pdfFile.name}
                </strong>

                <span>
                  {(
                    pdfFile.size /
                    1024 /
                    1024
                  ).toFixed(2)}{" "}
                  MB
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPdfFile(null)
                }
                disabled={isSubmitting}
              >
                Olib tashlash
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {error ? (
        <div
          className="error-message"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      {stage ? (
        <div
          className="form-progress-message"
          role="status"
        >
          <span className="button-spinner" />
          {stage}
        </div>
      ) : null}

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() =>
            router.push("/nashrlar")
          }
          disabled={isSubmitting}
        >
          Bekor qilish
        </button>

        <button
          type="submit"
          className="primary-button"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Saqlanmoqda..."
            : "Nashrni yaratish"}
        </button>
      </div>
    </form>
  );
}