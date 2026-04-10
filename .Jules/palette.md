## 2024-05-24 - Explicit Form Label Linking
**Learning:** Found that custom form components often nest inputs within or near labels without explicit `htmlFor` and `id` linking. While visually functional, this breaks screen reader context and prevents click-to-focus behavior on the labels.
**Action:** Always ensure that every React form `<label>` explicitly uses `htmlFor` matching the associated `<input>` or `<select>` `id`.
