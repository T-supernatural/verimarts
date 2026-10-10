import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { FarmProfile } from "../data/farm";
import { farmWebsite } from "../data/farm";
import { contentRepository } from "../data/contentRepository";
import { FarmProfileView } from "../marketplace/Farm";
import { PreviewDialog } from "./Editors";
export function FarmEditor({ onManage }: { onManage: () => void }) {
  const [profile, setProfile] = useState<FarmProfile | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void contentRepository
      .farmProfile(true)
      .then((value) => {
        if (active) {
          setProfile(value);
          if (value) setError("");
          if (!value)
            setError(
              "Apply the farm and paint migration to initialize this page.",
            );
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Farm settings could not be loaded. Apply the farm and paint migration, then retry.",
          );
      });
    return () => {
      active = false;
    };
  }, [attempt]);
  async function save(event: FormEvent, status: FarmProfile["status"]) {
    event.preventDefault();
    if (!profile) return;
    const form =
      event.currentTarget instanceof HTMLFormElement
        ? event.currentTarget
        : event.currentTarget.closest("form");
    if (form && !form.reportValidity()) return;
    if (profile.website && !farmWebsite(profile.website)) {
      setError("Enter a valid http/https website or domain.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const next = {
        ...profile,
        status,
        products: [
          ...new Set(
            profile.products.map((name) => name.trim()).filter(Boolean),
          ),
        ],
        aquaculture: [
          ...new Set(
            profile.aquaculture.map((name) => name.trim()).filter(Boolean),
          ),
        ],
      };
      await contentRepository.saveFarmProfile(next);
      setProfile(next);
      setNotice(
        status === "published"
          ? "Farm page published."
          : "Farm page saved as a private draft.",
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save the farm page.",
      );
    } finally {
      setBusy(false);
    }
  }
  const controls = [
    ["heading", "Heading"],
    ["intro", "Introduction"],
    ["main_address", "Main address"],
    ["branch_address", "Branch address"],
    ["whatsapp", "WhatsApp (display format)"],
    ["phone", "Phone (display format)"],
    ["email", "Email"],
    ["website", "Website"],
  ] as const;
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow red-text">OWNER'S FARM BUSINESS</span>
        <h1>Livelong Farm</h1>
        <p>
          Edit the public page and contact details. Manage product and
          aquaculture listings separately.
        </p>
        <button className="button secondary" onClick={onManage}>
          Manage farm listings
        </button>
      </div>
      {profile && (
        <form
          className="owner-form"
          onSubmit={(event) => void save(event, profile.status)}
        >
          <p>
            Page status: <strong>{profile.status}</strong>
          </p>
          <div className="form-grid">
            {controls.map(([key, label]) => (
              <label key={key}>
                {label}
                {key === "intro" ? (
                  <textarea
                    value={profile[key]}
                    onChange={(e) =>
                      setProfile({ ...profile, [key]: e.target.value })
                    }
                    maxLength={10000}
                  />
                ) : (
                  <input
                    required={key === "heading"}
                    type={key === "email" ? "email" : "text"}
                    value={profile[key]}
                    maxLength={
                      key === "heading"
                        ? 180
                        : key === "email"
                          ? 254
                          : key === "whatsapp" || key === "phone"
                            ? 30
                            : 500
                    }
                    onChange={(e) =>
                      setProfile({ ...profile, [key]: e.target.value })
                    }
                  />
                )}
              </label>
            ))}
          </div>
          {(
            [
              ["products", "Farm products"],
              ["aquaculture", "Aquaculture"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label} (one offering per line)
              <textarea
                value={profile[key].join("\n")}
                onChange={(e) =>
                  setProfile({ ...profile, [key]: e.target.value.split("\n") })
                }
              />
            </label>
          ))}
          <p className="small muted">
            Add only confirmed information. The heading is not evidence of
            third-party organic certification. Prices and quantities belong in
            individual listings.
          </p>
          <div className="actions">
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={() => setPreview(true)}
            >
              Preview farm page
            </button>
            <button className="button primary" disabled={busy}>
              Save farm page
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={busy}
              onClick={(event) =>
                void save(
                  event,
                  profile.status === "published" ? "draft" : "published",
                )
              }
            >
              {profile.status === "published"
                ? "Unpublish farm page"
                : "Publish farm page"}
            </button>
          </div>
        </form>
      )}
      {error && (
        <div role="alert" className="form-error">
          <p>{error}</p>
          <button
            className="button secondary"
            onClick={() => setAttempt((n) => n + 1)}
          >
            Retry farm settings
          </button>
        </div>
      )}
      {notice && <p role="status">{notice}</p>}
      {preview && profile && (
        <PreviewDialog onClose={() => setPreview(false)}>
          <FarmProfileView profile={profile} />
        </PreviewDialog>
      )}
    </>
  );
}
