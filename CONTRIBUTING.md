# Contributing to ShantanuJS

Thank you for your interest in contributing to **ShantanuJS**.

ShantanuJS is an open-source graphics library focused on programmable 2D graphics, shapes, transformations, animation, events, rendering, and related functionality.

Contributions are welcome across implementation, bug fixing, testing, documentation, performance, and developer experience.

Please read this guide before opening an issue or pull request.

---

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Before You Start](#before-you-start)
- [Development Setup](#development-setup)
- [Branching Strategy](#branching-strategy)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Bug Fix and Regression Workflow](#bug-fix-and-regression-workflow)
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Issues](#issues)
- [Labels](#labels)
- [Code Quality](#code-quality)
- [Documentation](#documentation)
- [Breaking Changes](#breaking-changes)
- [Performance Changes](#performance-changes)
- [Security](#security)
- [Questions and Discussions](#questions-and-discussions)
- [Recognition](#recognition)

---

## Ways to Contribute

There are many ways to contribute to ShantanuJS.

You can:

- Report reproducible bugs.
- Implement new functionality.
- Improve existing functionality.
- Add regression tests.
- Increase test coverage.
- Investigate reported issues.
- Improve documentation.
- Improve performance.
- Improve developer experience.
- Review pull requests.
- Share examples and use cases.
- Help other contributors and users.

You do not need to implement code to contribute.

---

## Before You Start

Before starting work, please:

1. Search existing issues and pull requests for related work.
2. Check whether the proposed functionality or bug fix has already been discussed.
3. For significant changes, open or comment on an issue before implementing the change.
4. Avoid duplicating work that another contributor is already doing.
5. Keep your changes focused on the relevant issue or objective.
6. Avoid including unrelated changes in the same pull request.

For small and obvious fixes, you may proceed directly with a pull request when appropriate.

---

## Development Setup

### Prerequisites

Make sure you have a supported version of:

- Node.js
- npm
- Git

### Clone the Repository

```bash
git clone https://github.com/ShanOrigin/ShantanuJS.git
cd ShantanuJS
npm install
```

You can then use the development and testing commands defined by the project.

Before submitting a pull request, make sure your changes compile and the relevant tests pass.

---

## Branching Strategy

Do not make feature, bug-fix, testing, or documentation changes directly on `main`.

Create a separate branch from the latest `main` branch.

### Branch Naming

Use the following prefixes:

| Prefix | Purpose |
| --- | --- |
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `test/` | Testing and test coverage |
| `docs/` | Documentation |
| `refactor/` | Code restructuring |
| `perf/` | Performance improvements |
| `chore/` | Repository and development infrastructure |

### Examples

```text
feature/add-circle-shape
feature/add-path-animation
fix/text-bounding-box
fix/event-dispatch-order
test/rotation-regression
test/get-bbox-coverage
docs/shape-api
refactor/renderer-lifecycle
perf/path-rendering
chore/contribution-infrastructure
```

### Creating a Branch

Start from an up-to-date `main` branch:

```bash
git switch main
git pull origin main
```

Create the appropriate topic branch:

```bash
git switch -c fix/text-bounding-box
```

Work only on the changes related to that branch.

---

## Making Changes

Keep contributions focused, maintainable, and consistent with the existing ShantanuJS architecture.

When modifying the library:

- Prefer small and focused changes.
- Preserve existing behavior unless the change intentionally modifies it.
- Avoid unnecessary dependencies.
- Use clear and descriptive names.
- Use appropriate TypeScript types.
- Follow the existing project structure.
- Keep public APIs consistent with the library's design.
- Avoid unrelated refactoring.
- Add tests for behavior that changes.
- Update documentation when public APIs or behavior change.

When fixing a bug, identify and correct the underlying cause rather than only masking the observed symptom.

---

## Testing

Testing is an important part of contributing to ShantanuJS.

Changes affecting library behavior should include appropriate tests whenever possible.

Pay particular attention to:

- Shapes.
- Geometry.
- Bounding boxes.
- Coordinate calculations.
- Transformations.
- Rotation.
- Scaling.
- Skewing.
- Translation.
- Animation.
- Events.
- Rendering.
- Media.
- TypeScript types.

### Regression Tests

When fixing a bug, add a regression test when practical.

A regression test should:

1. Reproduce the previous incorrect behavior.
2. Fail against the buggy implementation.
3. Verify the intended corrected behavior.
4. Pass after the implementation is fixed.
5. Remain in the final codebase to prevent the bug from returning.

A regression test should test observable behavior through the appropriate public API rather than depending unnecessarily on private implementation details.

---

## Bug Fix and Regression Workflow

Bug fixes in ShantanuJS use a two-stage workflow when a regression test is required.

This separates **proving the problem** from **implementing the solution**.

### Standard Bug-Fix Flow

```text
Issue
  ↓
Update local main
  ↓
Create test/* branch
  ↓
Reproduce the bug
  ↓
Add regression test
  ↓
Run test → must fail
  ↓
Commit regression test
  ↓
Bring test commit into fix/* branch
  ↓
Implement the fix
  ↓
Run regression test → must pass
  ↓
Run relevant project checks
  ↓
Push fix/* branch
  ↓
Pull Request → main
  ↓
Review
  ↓
Merge
```

### Step 1 — Create or identify the issue

Create a bug report using the repository's **Bug Report** issue form.

The issue should contain enough information to reproduce and investigate the problem.

Record the issue number because it should be referenced by the related branches, commits, and pull request where appropriate.

### Step 2 — Start from the latest `main`

```bash
git switch main
git pull origin main
```

### Step 3 — Create a testing branch

For a bug requiring regression coverage, create the testing branch directly from the latest `main`:

```bash
git switch -c test/text-bounding-box
```

The testing branch should contain **only the work required to reproduce and verify the bug**.

Do not implement the production fix on this branch.

### Step 4 — Reproduce the bug

Create a focused regression test that demonstrates the incorrect behavior.

The test should fail against the current implementation.

For example:

```text
Current implementation
        ↓
Regression test
        ↓
FAIL ❌
```

This confirms that the test actually detects the reported problem.

Do not change the implementation merely to make the test pass at this stage.

### Step 5 — Commit the regression test

Once the test reliably reproduces the issue, commit the test separately.

Example:

```text
[ Testing / Shape / Media / Text ] : Add restoreDimension regression test
```

The commit should contain the regression test and any test-only support required for it.

### Step 6 — Create or switch to the fix branch

Create the fix branch from the same updated `main`:

```bash
git switch main
git pull origin main
git switch -c fix/text-bounding-box
```

The fix branch is where the implementation change will be made.

### Step 7 — Bring the regression test into the fix branch

Apply the regression-test commit to the fix branch.

Use `git cherry-pick` with the test commit:

```bash
git cherry-pick <test-commit-hash>
```

The resulting fix branch should contain:

```text
fix/text-bounding-box
├── regression test
└── original implementation
```

At this point, the regression test should still fail:

```text
Regression test
      ↓
Original implementation
      ↓
FAIL ❌
```

### Step 8 — Implement the fix

Investigate the root cause and make the smallest correct implementation change.

Avoid changing unrelated code.

For example:

```text
Issue
  ↓
Regression test
  ↓
Root-cause investigation
  ↓
Implementation fix
```

### Step 9 — Verify the fix

Run the regression test again.

The expected result is now:

```text
Regression test
      ↓
Fixed implementation
      ↓
PASS ✅
```

Also run the relevant project checks.

At minimum, use the checks applicable to the change:

```bash
npx tsc --noEmit
npm run lint
npm test
```

Run the project's relevant browser, visual, or custom testing harness when the affected behavior requires it.

### Step 10 — Commit the implementation fix

Use a separate commit for the implementation change when the regression test was committed independently.

Example:

```text
[ Bug Fix / Shape / Media / Text ] : Fix restoreDimension anchor handling
```

This produces a clear history:

```text
Issue #15
    ↓
Test commit
    ↓
Fix commit
    ↓
Pull Request
    ↓
main
```

### Step 11 — Push and open the pull request

Push the fix branch:

```bash
git push -u origin fix/text-bounding-box
```

Open a pull request targeting:

```text
fix/text-bounding-box → main
```

Reference the issue:

```markdown
Closes #15
```

The pull request should contain both:

- The regression test that demonstrated the bug.
- The implementation change that fixes it.

### Why the test branch is separate

The testing branch exists to establish that the reported behavior is actually reproducible against the current implementation.

The fix branch then combines that proven regression test with the implementation fix.

This provides a clear development history:

```text
main
 │
 ├── test/text-bounding-box
 │       │
 │       └── Reproduce bug → FAIL
 │
 └── fix/text-bounding-box
         │
         ├── Regression test
         └── Implementation fix → PASS
                │
                ↓
              PR → main
```

The testing branch does **not** need to be merged independently into `main`.

Its relevant test commit is brought into the fix branch, and the final fix branch is submitted to `main`.

---

## Commit Messages

Use concise commit messages that clearly describe the change.

The project generally follows this format:

```text
[ Area / Feature ] : Description
```

### Examples

```text
[ Bug Fix / Text ] : Fix text bounding box calculation
```

```text
[ Testing / Transformations ] : Add rotation regression tests
```

```text
[ Implementation / Animation ] : Add animation lifecycle support
```

```text
[ Documentation / Shapes ] : Document polygon parameters
```

```text
[ Chore / GitHub ] : Add contribution infrastructure
```

Commit messages should:

- Describe the actual change.
- Avoid unnecessary detail.
- Use clear terminology.
- Avoid vague messages such as `changes`, `update`, or `fix stuff`.

When a change has separate test and implementation commits, keep their purposes clear.

---

## Pull Requests

All contributions should be submitted through a pull request targeting:

```text
main
```

Do not push changes directly to `main` for normal development work.

### Pull Request Requirements

A pull request should:

- Explain what was changed.
- Explain why the change was necessary.
- Reference the related issue when applicable.
- Include appropriate tests or verification.
- Mention breaking changes.
- Include documentation updates when required.
- Avoid unrelated modifications.
- Keep the scope focused.

Use the repository's pull request template when creating a pull request.

### Pull Request Flow

For normal contributions:

```text
main
  │
  └── Create topic branch
          │
          ├── Make changes
          ├── Add/update tests
          └── Commit changes
                  │
                  ▼
             Push branch
                  │
                  ▼
            Pull Request
                  │
                  ▼
              Review
                  │
                  ▼
             Improvements
                  │
                  ▼
             Merge → main
```

For bug fixes requiring regression coverage, follow the dedicated [Bug Fix and Regression Workflow](#bug-fix-and-regression-workflow).

### After Merge

Once a pull request has been merged into `main`, the topic branch can be deleted.

Contributors may then create a new branch from the updated `main` for future work.

---

## Issues

Please use the appropriate issue template when opening an issue.

Available issue categories include:

- **Bug Report**
- **Implementation Request**
- **Testing Request**
- **Improvement Request**

### Bug Reports

Bug reports should contain enough information to reproduce and investigate the problem.

A minimal reproduction is strongly preferred.

Whenever applicable, include:

- ShantanuJS version.
- TypeScript or JavaScript.
- Browser and version.
- Operating system.
- Runtime or build tool.
- Minimal reproduction.
- Steps to reproduce.
- Expected behavior.
- Actual behavior.
- Error messages or console output.
- Regression information.

### Implementation Requests

Implementation requests should explain:

- What functionality is being proposed.
- Why it is useful.
- The problem it solves.
- Expected behavior.
- Proposed API or usage when applicable.
- Testing requirements.
- Compatibility considerations.

### Testing Requests

Testing requests should identify:

- What needs to be tested.
- Existing test coverage.
- Missing scenarios.
- Edge cases.
- Regression cases.
- Expected test behavior.
- Relevant test files when known.

### Improvement Requests

Improvement requests should explain:

- Current behavior.
- Proposed behavior.
- Motivation.
- Compatibility considerations.
- Testing requirements.

Before opening an issue, search existing issues to avoid creating duplicates.

---

## Labels

Issues are categorized using labels to make project work easier to discover and organize.

### Type Labels

```text
type: bug
type: implementation
type: testing
type: improvement
type: documentation
```

### Area Labels

```text
area: shapes
area: geometry
area: transformations
area: animation
area: events
area: filters
area: renderer
area: media
area: scene
area: engine
area: types
```

### Contribution Labels

```text
good first issue
help wanted
needs investigation
```

Use labels accurately rather than applying every potentially relevant label.

---

## Code Quality

Contributions should follow the existing coding conventions and architecture of ShantanuJS.

### TypeScript

When working with TypeScript:

- Prefer explicit and meaningful types.
- Avoid unnecessary `any`.
- Preserve type safety.
- Keep public type definitions accurate.
- Avoid weakening existing type contracts to bypass compiler errors.

### Naming

Use descriptive names for:

- Variables.
- Functions.
- Classes.
- Methods.
- Types.
- Interfaces.
- Files.

Names should communicate intent without requiring unnecessary comments.

### Comments

Comments should explain **why** something is implemented a particular way when the reason is not obvious from the code.

Avoid comments that simply restate what the code already says.

### Architecture

When adding functionality:

- Follow existing architectural patterns.
- Reuse existing abstractions where appropriate.
- Avoid introducing duplicate mechanisms.
- Keep responsibilities separated.
- Consider how the change affects the public API.

---

## Documentation

Documentation is an important part of the project.

Documentation contributions are welcome independently of code changes.

When changing a public API or significant behavior, update the relevant documentation where appropriate.

Documentation should:

- Clearly describe the API.
- Explain parameters and return values.
- Include useful examples when appropriate.
- Match the actual implementation.
- Avoid documenting behavior that does not exist.

If you discover inaccurate documentation, feel free to submit a documentation issue or pull request.

---

## Breaking Changes

Breaking changes require additional consideration.

A breaking change may include:

- Removing a public API.
- Renaming a public API.
- Changing method parameters.
- Changing return types.
- Changing documented behavior.
- Changing default behavior in a way that affects existing applications.

Breaking changes should be clearly identified in the issue and pull request.

Explain:

1. What is changing.
2. Why the change is necessary.
3. What existing users need to change.
4. Whether migration guidance is required.
5. Whether backward compatibility can be maintained.

Do not introduce breaking changes unintentionally.

---

## Performance Changes

Performance-related contributions should provide evidence when possible.

When proposing a performance improvement, consider including:

- The current behavior.
- The performance problem.
- The proposed change.
- Benchmark results where applicable.
- Memory considerations.
- Trade-offs introduced by the change.

Avoid claiming performance improvements without measurement or reasonable evidence.

---

## Security

Please do not disclose security vulnerabilities through public GitHub issues.

If you discover a potential security vulnerability, use the repository's available private security reporting mechanism instead of publicly exposing sensitive details.

---

## Questions and Discussions

If you are unsure whether a proposed change belongs in ShantanuJS, discuss it before investing significant implementation effort.

Questions about:

- API design.
- Architecture.
- Proposed features.
- Large refactors.
- Breaking changes.
- Performance changes.

are better discussed before implementation when the change could significantly affect the project.

Clear discussion helps prevent duplicated or incompatible work.

---

## Recognition

Contributors who make useful improvements to ShantanuJS are appreciated and recognized as part of the project's open-source community.

Contributions of all sizes are valuable, including:

- Code.
- Tests.
- Documentation.
- Bug reports.
- Issue investigation.
- Examples.
- Reviews.
- Technical discussions.

Thank you for helping improve ShantanuJS.

---

## Summary

The recommended contribution workflow is:

### Normal contribution

```text
1. Find or create an issue
          ↓
2. Discuss significant changes when necessary
          ↓
3. Update local main
          ↓
4. Create a focused topic branch
          ↓
5. Make the changes
          ↓
6. Add/update tests
          ↓
7. Verify the changes
          ↓
8. Commit using the project convention
          ↓
9. Push the branch
          ↓
10. Open a Pull Request → main
          ↓
11. Address review feedback
          ↓
12. Merge
          ↓
13. Delete the topic branch
```

### Bug fix requiring regression coverage

```text
1. Find or create the issue
          ↓
2. Update local main
          ↓
3. Create test/* from main
          ↓
4. Reproduce the bug
          ↓
5. Add regression test
          ↓
6. Verify test fails
          ↓
7. Commit the regression test
          ↓
8. Create fix/* from main
          ↓
9. Cherry-pick the test commit
          ↓
10. Verify test still fails
          ↓
11. Implement the fix
          ↓
12. Verify regression test passes
          ↓
13. Run relevant project checks
          ↓
14. Commit the implementation fix
          ↓
15. Push fix/* branch
          ↓
16. Open Pull Request → main
          ↓
17. Address review feedback
          ↓
18. Merge
          ↓
19. Delete topic branches
```

Thank you for contributing to **ShantanuJS**.