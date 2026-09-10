Absolutely. Use this as the **entire `CONTRIBUTING.md`** file in the repository root.


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
- [Commit Messages](#commit-messages)
- [Pull Requests](#pull-requests)
- [Issues](#issues)
- [Code Quality](#code-quality)
- [Documentation](#documentation)
- [Breaking Changes](#breaking-changes)
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
````

Move into the repository:

```bash
cd ShantanuJS
```

Install dependencies:

```bash
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

| Prefix      | Purpose                                   |
| ----------- | ----------------------------------------- |
| `feature/`  | New functionality                         |
| `fix/`      | Bug fixes                                 |
| `test/`     | Testing and test coverage                 |
| `docs/`     | Documentation                             |
| `refactor/` | Code restructuring                        |
| `perf/`     | Performance improvements                  |
| `chore/`    | Repository and development infrastructure |

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

Create your topic branch:

```bash
git switch -c fix/text-bounding-box
```

Work only on the changes related to that branch.

---

## Making Changes

Keep contributions focused, maintainable, and consistent with the existing ShantanuJS architecture.

When modifying the library:

* Prefer small and focused changes.
* Preserve existing behavior unless the change intentionally modifies it.
* Avoid unnecessary dependencies.
* Use clear and descriptive names.
* Use appropriate TypeScript types.
* Follow the existing project structure.
* Keep public APIs consistent with the library's design.
* Avoid unrelated refactoring.
* Add tests for behavior that changes.
* Update documentation when public APIs or behavior change.

When fixing a bug, try to identify the underlying cause rather than only masking the observed symptom.

---

## Testing

Testing is an important part of contributing to ShantanuJS.

Changes affecting library behavior should include appropriate tests whenever possible.

Pay particular attention to:

* Shapes.
* Geometry.
* Bounding boxes.
* Coordinate calculations.
* Transformations.
* Rotation.
* Scaling.
* Skewing.
* Translation.
* Animation.
* Events.
* Rendering.
* Media.
* TypeScript types.

### Regression Tests

When fixing a bug, add a regression test when practical.

A regression test should reproduce the previous incorrect behavior and verify that the corrected behavior remains stable.

For example:

```text
Bug
  ↓
Reproduce
  ↓
Fix
  ↓
Regression Test
  ↓
Verify
```

### Before Opening a Pull Request

Run the relevant project checks and verify:

* TypeScript compilation succeeds.
* Relevant tests pass.
* New tests pass.
* Existing tests continue to pass.
* The affected behavior has been manually verified when appropriate.

Do not mark a change as tested if it has not actually been tested.

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

* Describe the actual change.
* Avoid unnecessary detail.
* Use clear terminology.
* Avoid vague messages such as `changes`, `update`, or `fix stuff`.

---

## Pull Requests

All contributions should be submitted through a pull request targeting:

```text
main
```

Do not push changes directly to `main` for normal development work.

### Pull Request Requirements

A pull request should:

* Explain what was changed.
* Explain why the change was necessary.
* Reference the related issue when applicable.
* Include appropriate tests or verification.
* Mention breaking changes.
* Include documentation updates when required.
* Avoid unrelated modifications.
* Keep the scope focused.

Use the repository's pull request template when creating a pull request.

### Pull Request Flow

The standard contribution flow is:

```text
main
  │
  └── Create topic branch
          │
          ├── Make changes
          ├── Add tests
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

### After Merge

Once a pull request has been merged into `main`, the topic branch can be deleted.

Contributors may then create a new branch from the updated `main` for future work.

---

## Issues

Please use the appropriate issue template when opening an issue.

Available issue categories include:

* **Bug Report**
* **Implementation Request**
* **Testing Request**
* **Improvement Request**

### Bug Reports

Bug reports should contain enough information to reproduce and investigate the problem.

A minimal reproduction is strongly preferred.

Whenever applicable, include:

* ShantanuJS version.
* TypeScript or JavaScript.
* Browser and version.
* Operating system.
* Runtime or build tool.
* Minimal reproduction.
* Steps to reproduce.
* Expected behavior.
* Actual behavior.
* Error messages or console output.
* Regression information.

### Implementation Requests

Implementation requests should explain:

* What functionality is being proposed.
* Why it is useful.
* The problem it solves.
* Expected behavior.
* Proposed API or usage when applicable.
* Testing requirements.
* Compatibility considerations.

### Testing Requests

Testing requests should identify:

* What needs to be tested.
* Existing test coverage.
* Missing scenarios.
* Edge cases.
* Regression cases.
* Expected test behavior.
* Relevant test files when known.

### Improvement Requests

Improvement requests should explain:

* Current behavior.
* Proposed behavior.
* Motivation.
* Compatibility considerations.
* Testing requirements.

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

* Prefer explicit and meaningful types.
* Avoid unnecessary `any`.
* Preserve type safety.
* Keep public type definitions accurate.
* Avoid weakening existing type contracts to bypass compiler errors.

### Naming

Use descriptive names for:

* Variables.
* Functions.
* Classes.
* Methods.
* Types.
* Interfaces.
* Files.

Names should communicate intent without requiring unnecessary comments.

### Comments

Comments should explain **why** something is implemented a particular way when the reason is not obvious from the code.

Avoid comments that simply restate what the code already says.

### Architecture

When adding functionality:

* Follow existing architectural patterns.
* Reuse existing abstractions where appropriate.
* Avoid introducing duplicate mechanisms.
* Keep responsibilities separated.
* Consider how the change affects the public API.

---

## Documentation

Documentation is an important part of the project.

Documentation contributions are welcome independently of code changes.

When changing a public API or significant behavior, update the relevant documentation where appropriate.

Documentation should:

* Clearly describe the API.
* Explain parameters and return values.
* Include useful examples when appropriate.
* Match the actual implementation.
* Avoid documenting behavior that does not exist.

If you discover inaccurate documentation, feel free to submit a documentation issue or pull request.

---

## Breaking Changes

Breaking changes require additional consideration.

A breaking change may include:

* Removing a public API.
* Renaming a public API.
* Changing method parameters.
* Changing return types.
* Changing documented behavior.
* Changing default behavior in a way that affects existing applications.

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

* The current behavior.
* The performance problem.
* The proposed change.
* Benchmark results where applicable.
* Memory considerations.
* Trade-offs introduced by the change.

Avoid claiming performance improvements without measurement or reasonable evidence.

---

## Security

Please do not disclose security vulnerabilities through public GitHub issues.

If you discover a potential security vulnerability, use the repository's available private security reporting mechanism instead of publicly exposing sensitive details.

---

## Questions and Discussions

If you are unsure whether a proposed change belongs in ShantanuJS, discuss it before investing significant implementation effort.

Questions about:

* API design.
* Architecture.
* Proposed features.
* Large refactors.
* Breaking changes.
* Performance changes.

are better discussed before implementation when the change could significantly affect the project.

Clear discussion helps prevent duplicated or incompatible work.

---

## Recognition

Contributors who make useful improvements to ShantanuJS are appreciated and recognized as part of the project's open-source community.

Contributions of all sizes are valuable, including:

* Code.
* Tests.
* Documentation.
* Bug reports.
* Issue investigation.
* Examples.
* Reviews.
* Technical discussions.

Thank you for helping improve ShantanuJS.

---

## Summary

The recommended contribution workflow is:

```text
1. Find or create an issue
          ↓
2. Discuss significant changes when necessary
          ↓
3. Update local main
          ↓
4. Create a focused topic branch
          ↓
5. Implement the change
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

Thank you for contributing to **ShantanuJS**.

````

One correction from the earlier draft: I included a **Security** section here, but we have **not yet created `SECURITY.md`**. That's fine—the section simply tells contributors not to disclose vulnerabilities publicly. We can create the dedicated security policy later if you want.

For now, save this as `CONTRIBUTING.md`. Then run:

```powershell
git status
````

