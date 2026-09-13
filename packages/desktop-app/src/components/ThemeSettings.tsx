import { useEffect, useState } from "react";
import {
  applyTheme,
  deleteCustomTheme,
  getActiveTheme,
  getActiveThemeName,
  getAllThemes,
  isPresetTheme,
  saveCustomTheme,
  setActiveThemeName,
  type ThemeDefinition,
} from "../lib/theme";

const BLANK_DRAFT = {
  name: "",
  lightBg: "#f7f8fa",
  lightText: "#1c1f26",
  lightAccent: "#3b82f6",
  darkBg: "#14161a",
  darkText: "#e5e7eb",
  darkAccent: "#60a5fa",
};

function draftToTheme(draft: typeof BLANK_DRAFT): ThemeDefinition {
  return {
    name: draft.name || "Preview",
    light: { bg: draft.lightBg, text: draft.lightText, accent: draft.lightAccent },
    dark: { bg: draft.darkBg, text: draft.darkText, accent: draft.darkAccent },
  };
}

function themeToDraft(theme: ThemeDefinition): typeof BLANK_DRAFT {
  return {
    name: theme.name,
    lightBg: theme.light.bg,
    lightText: theme.light.text,
    lightAccent: theme.light.accent,
    darkBg: theme.dark.bg,
    darkText: theme.dark.text,
    darkAccent: theme.dark.accent,
  };
}

export function ThemeSettings() {
  const [themes, setThemes] = useState<ThemeDefinition[]>(getAllThemes());
  const [activeName, setActiveName] = useState(getActiveThemeName());
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(BLANK_DRAFT);
  const [editingOriginalName, setEditingOriginalName] = useState<string | null>(null);
  const [themeBeforeEditing, setThemeBeforeEditing] = useState<ThemeDefinition | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Live preview: while the form is open, every color change applies
  // immediately so the effect is visible before committing.
  useEffect(() => {
    if (!showForm) return;
    applyTheme(draftToTheme(draft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, showForm]);

  function selectTheme(theme: ThemeDefinition) {
    applyTheme(theme);
    setActiveThemeName(theme.name);
    setActiveName(theme.name);
  }

  function handleDelete(name: string) {
    deleteCustomTheme(name);
    const remaining = getAllThemes();
    setThemes(remaining);
    if (activeName === name) {
      selectTheme(remaining[0]);
    }
  }

  function openCreateForm() {
    setThemeBeforeEditing(getActiveTheme());
    setEditingOriginalName(null);
    setDraft(BLANK_DRAFT);
    setError(null);
    setShowForm(true);
  }

  function openEditForm(theme: ThemeDefinition) {
    setThemeBeforeEditing(getActiveTheme());
    setEditingOriginalName(theme.name);
    setDraft(themeToDraft(theme));
    setError(null);
    setShowForm(true);
  }

  function handleCancel() {
    if (themeBeforeEditing) {
      applyTheme(themeBeforeEditing);
    }
    setShowForm(false);
    setEditingOriginalName(null);
    setThemeBeforeEditing(null);
    setError(null);
  }

  function handleSaveDraft(e: React.FormEvent) {
    e.preventDefault();
    const name = draft.name.trim();
    if (!name) {
      setError("Give the theme a name.");
      return;
    }
    if (isPresetTheme(name) && name !== editingOriginalName) {
      setError("That name is already used by a built-in theme.");
      return;
    }

    if (editingOriginalName && editingOriginalName !== name) {
      deleteCustomTheme(editingOriginalName);
    }

    const theme = draftToTheme(draft);
    theme.name = name;
    saveCustomTheme(theme);
    setThemes(getAllThemes());
    selectTheme(theme);
    setDraft(BLANK_DRAFT);
    setEditingOriginalName(null);
    setThemeBeforeEditing(null);
    setShowForm(false);
    setError(null);
  }

  return (
    <section>
      <h3>Theme</h3>
      <div className="theme-list">
        {themes.map((theme) => (
          <div key={theme.name} className="theme-list__item">
            <button
              type="button"
              className={`theme-swatch${theme.name === activeName ? " theme-swatch--active" : ""}`}
              onClick={() => selectTheme(theme)}
              style={{ background: theme.dark.bg, color: theme.dark.text }}
            >
              {theme.name}
            </button>
            {!isPresetTheme(theme.name) && (
              <>
                <button
                  type="button"
                  className="theme-list__edit"
                  onClick={() => openEditForm(theme)}
                  aria-label={`Edit ${theme.name}`}
                >
                  &#9998;
                </button>
                <button
                  type="button"
                  className="theme-list__delete"
                  onClick={() => handleDelete(theme.name)}
                  aria-label={`Delete ${theme.name}`}
                >
                  &times;
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={handleSaveDraft} className="theme-form">
          <label>
            Name
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              autoFocus
            />
          </label>

          <p className="hint">
            The app background only live-previews whichever mode matches your current
            Windows theme &mdash; the swatches below preview both regardless.
          </p>

          <div className="theme-form__mode">
            <span>Light</span>
            <label>
              Background
              <input
                type="color"
                value={draft.lightBg}
                onChange={(e) => setDraft({ ...draft, lightBg: e.target.value })}
              />
            </label>
            <label>
              Text
              <input
                type="color"
                value={draft.lightText}
                onChange={(e) => setDraft({ ...draft, lightText: e.target.value })}
              />
            </label>
            <label>
              Accent
              <input
                type="color"
                value={draft.lightAccent}
                onChange={(e) => setDraft({ ...draft, lightAccent: e.target.value })}
              />
            </label>
            <div
              className="theme-form__swatch"
              style={{ background: draft.lightBg, color: draft.lightText }}
            >
              Aa <span style={{ color: draft.lightAccent }}>&#9679;</span>
            </div>
          </div>

          <div className="theme-form__mode">
            <span>Dark</span>
            <label>
              Background
              <input
                type="color"
                value={draft.darkBg}
                onChange={(e) => setDraft({ ...draft, darkBg: e.target.value })}
              />
            </label>
            <label>
              Text
              <input
                type="color"
                value={draft.darkText}
                onChange={(e) => setDraft({ ...draft, darkText: e.target.value })}
              />
            </label>
            <label>
              Accent
              <input
                type="color"
                value={draft.darkAccent}
                onChange={(e) => setDraft({ ...draft, darkAccent: e.target.value })}
              />
            </label>
            <div
              className="theme-form__swatch"
              style={{ background: draft.darkBg, color: draft.darkText }}
            >
              Aa <span style={{ color: draft.darkAccent }}>&#9679;</span>
            </div>
          </div>

          {error && <p className="settings-error">{error}</p>}

          <div className="button-row">
            <button type="submit">Save Theme</button>
            <button type="button" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={openCreateForm}>
          + Create Custom Theme
        </button>
      )}
    </section>
  );
}
