# Playbook

A growing collection of practices for building software with AI coding agents — the operating models, workflows, and conventions I actually use, written down so they're reusable across projects and across sessions (human or agent).

Most of what makes agent-assisted development work isn't a tool you install — it's a discipline: where knowledge lives, how work is structured, how a fresh session picks up exactly where the last one left off without re-deriving every decision. This repo captures those disciplines as standalone, self-contained documents you can read on their own and adapt to your project.

## Contents

### Harness — how work is structured and carried across sessions

- **[Operating Model: Repository as System of Record](harness/operating-model.md)** — a lightweight development harness. Keep durable knowledge in the repository, not in chat, in a deduplicated and progressively-disclosed structure (a thin map of pointers over deeper docs), so any session can resume work without re-reading everything. Covers the document layout, the spec-vs-guideline split, the per-epic workflow, and how to bootstrap it in a fresh repo.

_More practices will land over time — prompting, code review, testing with agents, and so on._

## How to use this

Each document stands on its own. Pick the one that fits your problem and copy the parts that fit your project. Nothing here is a framework with an install step — it's a set of conventions to adopt and bend.

## Status

Early and evolving. Each document is a living note that changes as the practice does — not a finished standard.
