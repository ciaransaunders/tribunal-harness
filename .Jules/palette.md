## 2026-04-17 - Form Field Label Accessibility
**Learning:** React form `<label>`s should always use `htmlFor` explicitly linked to the `<input>`'s `id` for reliable screen reader context and click-to-focus behavior. Found instances of unassociated `<label>` elements in `request-access/page.tsx`.
**Action:** When building or auditing forms, always ensure every `<label>` has an `htmlFor` attribute that matches a unique `id` on the corresponding input element.
