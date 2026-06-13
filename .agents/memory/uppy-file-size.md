---
name: Uppy file size nullability
description: UppyFile.size is number | null — always guard before passing to strict APIs.
---

## Rule
`UppyFile.size` is typed as `number | null` in Uppy v5. Always use `file.size ?? 0` before passing to any API that expects a plain `number`.

## Why
The OpenAPI-generated Zod schema for `UploadUrlRequest` requires `size: integer minimum: 1`. TypeScript rejects `null` without a fallback.

## How to apply
```typescript
const fileSize = file.size ?? 0;
const res = await requestUploadUrl({ name: file.name, size: fileSize, contentType: file.type });
```
