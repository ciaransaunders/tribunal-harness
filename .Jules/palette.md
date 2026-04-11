## 2026-04-11 - [Added Explicit IDs and htmlFor to ClaimInputPanel]
**Learning:** Found that form inputs in Next.js form components were missing explicit ID associations with their labels, which breaks click-to-focus and standard screen reader functionality for users.
**Action:** Always ensure that every <label> contains an explicit htmlFor attribute that matches a unique id attribute on the corresponding <input>, <select>, or <textarea> element.
