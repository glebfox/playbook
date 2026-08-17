# Guideline — choosing a runtime

Applies to every route, Server Action and middleware file. The runtime is a per-file property, it is decided at build time, and getting it wrong fails in a way that is hard to read, so decide it deliberately rather than by omission.

## The two runtimes

**Node** is a full Node runtime: Node built-ins, streams, `Buffer`, native dependencies, unbounded execution as far as the machine allows. Everything in this project that touches the database or the filesystem needs it.

**Edge** is a restricted V8 environment. No Node built-ins, no `Buffer`, no native modules, no filesystem, a hard bundle-size limit, and a much shorter execution allowance. It exists to run tiny code close to the user.

## What this project does

**Node is the default and almost always the answer.** Ledger deploys as a single machine in one region with the database beside it. Edge buys latency only when the work can be done without the database, and there is no such work here — every page this app renders needs rows.

Declare it explicitly in any file where the choice matters rather than relying on the framework default, which has changed between versions:

```ts
export const runtime = 'nodejs'
```

**Middleware is the exception, and it is not a choice.** Middleware runs on edge whatever you write. Keep it to reading the session cookie and redirecting: no database access, no domain imports, no libraries that were not written for edge. Anything that needs a row belongs in the page or the action, not in middleware.

## Streaming and uploads

**Parsing an uploaded file requires the Node runtime.** The CSV import reads the upload as a stream and parses it row by row, so that a large export is never held in memory whole and a malformed row can be reported with its line number. That requires Node streams, which edge does not have. A route or action that receives a file therefore declares Node explicitly, and the parser lives in a module that imports Node built-ins directly — which also means it can never be imported, even transitively, from middleware.

Reading the whole upload into memory to sidestep the constraint is not an acceptable workaround: the largest export seen so far is small, but the failure mode when one is not is an out-of-memory kill with no line number and no partial result.

## When it goes wrong

- **A Node built-in reached from an edge file** fails at build time with a module-resolution error naming the built-in, not the file that pulled it in. Read the import chain upwards from the named module; the culprit is usually a utility that was innocent until someone added a `crypto` call to it.
- **A native dependency in an edge bundle** fails at deploy time rather than build time, which is worse. The dependency list is small on purpose partly for this reason.
- **An action that works locally and fails deployed** is nearly always a runtime mismatch: the dev server is more forgiving about the boundary than the build is.
