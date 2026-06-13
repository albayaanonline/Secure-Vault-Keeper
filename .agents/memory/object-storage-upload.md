---
name: Object storage upload flow
description: How ObjectUploader from @workspace/object-storage-web works — API surface and callback shapes.
---

## Rule
`ObjectUploader` takes `children` (ReactNode) and optional `buttonClassName` string. It does NOT have a `renderButton` prop. The button is rendered internally; customize via `buttonClassName` or wrap the component.

`onComplete` receives a single `UploadResult<Record<string, unknown>, Record<string, unknown>>` argument — NOT `(result, file)`. Iterate `result.successful` to get the uploaded files.

`onGetUploadParameters` receives a single `UppyFile` argument and must return `{ method: "PUT", url: string, headers?: Record<string, string> }`. It does NOT include `objectPath` in the return — store `objectPath` separately (e.g. in a `useRef` map keyed by `file.id`) so `onComplete` can access it.

## Why
These are the actual TypeScript types in `lib/object-storage-web/src/ObjectUploader.tsx`. The skill's usage examples show the general pattern but the subagent hallucinated a `renderButton` prop and a two-argument `onComplete`.

## How to apply
When delegating file upload UI to a design subagent, include this verbatim in the task:
- `onComplete` takes ONE argument: `UploadResult` 
- Store objectPath in a `useRef<Map<fileId, meta>>` during `onGetUploadParameters`, read it in `onComplete`
- No `renderButton` prop — use `children` + `buttonClassName`
