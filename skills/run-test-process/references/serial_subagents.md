# Serial Subagents for `$run-test-process`

Use this reference when `$run-test-process` can use child threads, subagents, or background Codex threads. The goal is a single user-visible request with phase workers that are isolated from each other and run strictly in sequence.

## Execution Modes

Prefer this order:

1. Codex background thread in the same local project workspace, when available. This is best for artifact-producing phases because generated files are written to the same repository.
2. `multi_agent_v1` worker subagent, when its file changes are visible to the parent or can be integrated by the parent.
3. Same-thread fallback with checkpoint files, only when no child execution tool is available.

Never assume a child produced files in the parent workspace. The parent must verify expected local files before starting the next phase.

## Serial Control Rules

- Start exactly one phase worker at a time.
- Do not start the next phase until the previous worker is complete, its outputs are verified, and the worker has been closed or archived when the tool supports it.
- Do not run phases in parallel. Later phases depend on earlier artifacts and review gates.
- Give each worker only the current phase, required input paths, expected output paths, constraints, and checkpoint files. Do not pass the full prior conversation.
- Each worker must update `テスト成果物/run-test-process_進行状況.md` and `テスト成果物/run-test-process_引き継ぎ.md` before it reports completion.
- The parent owns final gating. A worker's final message is not enough; check files and gate conditions locally.

## Phase Workers

| Phase | Worker Scope | Skills | Must Finish Before Next Phase |
|---|---|---|---|
| 1 | Plan | `$create-test-plan`, `$review-test-plan` | Plan and plan review exist; no fix-worthy `P0`/`P1`/`P2` remains. |
| 2 | Analysis | `$create-test-analysis`, `$review-test-analysis` | Analysis, analysis questionnaire, and analysis review exist; unresolved items are recorded. |
| 3 | Design | `$create-test-design`, `$review-test-design` | Design, design questionnaire, and design review exist; traceability is preserved. |
| 4 | Cases and gate | `$create-test-cases`, `$review-test-cases`, `$review-test-artifacts`, Implementation Entry Gate | Test case files, case review, cross-artifact review, and gate decision exist. Implementation may start only when the gate passes. |
| 5 | Codebase automation | `$create-test-code`, `$review-test-code`, `$execute-codebase-tests` | Codebase tests, implementation result, review result, unimplemented list, execution folder, and issue list are recorded. |
| 6 | Playwright E2E automation | `$create-playwright-e2e-tests`, `$review-playwright-e2e-tests`, `$execute-playwright-e2e-tests` | E2E tests, implementation result, review result, unimplemented list, execution folder, and issue list are recorded. |
| 7 | Final report | `$create-test-report`, `$review-test-report` | Final report folder, `index.html`, and report review result exist. |

## Worker Prompt Template

Use a prompt like this for each worker. Fill in only the phase-specific values.

```text
You are a serial phase worker for `$run-test-process`.

Repository:
- <repo root or project context>

Phase:
- <phase number and name>

Run only these skills, in this order:
- <skill list>

Inputs to read:
- <input artifact paths>
- `テスト成果物/run-test-process_進行状況.md` if it exists
- `テスト成果物/run-test-process_引き継ぎ.md` if it exists

Constraints:
- Do not run other phases.
- Do not edit specifications, README files, or product code unless explicitly required by the child skill and user request.
- Do not install dependencies or browsers without user approval.
- Preserve traceability IDs: `TAxxx`, `TVxxx`, `TDxxx`, `TC-*`, `BUG-*`, and `E2E-BUG-*`.
- Keep question-wait, unimplemented, unexecuted, and `N/A` items visible instead of guessing.
- Repeat review/fix/re-review until no fix-worthy `P0`, `P1`, or `P2` findings remain, following each child review skill.

Before finishing:
- Verify expected output files exist.
- Update `テスト成果物/run-test-process_進行状況.md`.
- Update `テスト成果物/run-test-process_引き継ぎ.md`.
- Confirm no test command, dev server, browser, or generation process started by this phase is still running.

Final response format:
- Status: COMPLETE or BLOCKED
- Phase completed:
- Generated or updated files:
- Review/gate result:
- Question-wait/unimplemented/unexecuted/N/A/blockers:
- Next phase input files:
- Commands run:
```

## Parent Verification Checklist

After each worker completes:

- Read the worker final response.
- Verify expected files exist in the parent/local repository.
- Inspect the phase's review result and confirm no fix-worthy `P0`, `P1`, or `P2` remains, unless the workflow is explicitly recording a blocker and continuing.
- For phase 4, verify the Implementation Entry Gate explicitly allows implementation before phase 5.
- Verify checkpoint files name the next phase input artifacts.
- Close or archive the worker when supported.
- Only then start the next worker.

If verification fails, send the same worker a correction prompt when possible. If the worker cannot continue, record the blocker in the checkpoint files and continue only when the main `$run-test-process` continuation rules allow it.
