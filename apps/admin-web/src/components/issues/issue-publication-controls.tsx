"use client";

import { useState } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import { getApiErrorMessage } from "@/lib/auth";
import type {
  IssueDetail,
} from "@/lib/issues";


interface IssuePublicationControlsProps {
  issue: IssueDetail;
  onIssueUpdated: (
    issue: IssueDetail,
  ) => void;
}


interface IssueActionResponse {
  detail: string;
  issue: IssueDetail;
}


export function IssuePublicationControls({
  issue,
  onIssueUpdated,
}: IssuePublicationControlsProps) {
  const { user } = useAuth();

  const [isWorking, setIsWorking] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const canPublish =
    user.role === "SUPER_ADMIN" ||
    user.role === "REVIEWER";

  if (!canPublish) {
    return null;
  }

  async function togglePublication() {
    setIsWorking(true);
    setError("");
    setSuccess("");

    const action = issue.is_public
      ? "unpublish"
      : "publish";

    try {
      const response = await fetch(
        `/api/issues/${issue.id}/${action}`,
        {
          method: "POST",
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          getApiErrorMessage(
            data,
            issue.is_public
              ? (
                  "Nashrni ommaviy saytdan "
                  + "olib bo‘lmadi."
                )
              : (
                  "Nashrni ommaga chiqarib "
                  + "bo‘lmadi."
                ),
          ),
        );
      }

      const result =
        data as IssueActionResponse;

      onIssueUpdated(result.issue);
      setSuccess(result.detail);
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Kutilmagan xatolik.",
      );
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className="issue-publication-controls">
      <button
        type="button"
        className={
          issue.is_public
            ? "unpublish-article-button"
            : "publish-article-button"
        }
        onClick={() => {
          void togglePublication();
        }}
        disabled={isWorking}
      >
        {isWorking
          ? "Yangilanmoqda..."
          : issue.is_public
            ? "Nashrni saytdan olish"
            : "Nashrni ommaga chiqarish"}
      </button>

      {success ? (
        <p className="inline-success">
          {success}
        </p>
      ) : null}

      {error ? (
        <p className="inline-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}