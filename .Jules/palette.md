## 2025-04-15 - Add form label associations
**Learning:** Found that custom-styled form controls in ClaimInputPanel were missing implicit or explicit `id` and `htmlFor` pairings, reducing screen reader context and programmatic label click focus (especially important for checkboxes and date inputs). Although wrapping an input inside a label creates an implicit association, explicitly using `htmlFor` and `id` provides more robust screen reader support.
**Action:** Always link `<label>` directly to `<input>`/`<select>`/`<textarea>` via explicit `htmlFor` and `id` attributes.
