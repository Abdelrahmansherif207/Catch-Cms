# AI Agent Rules

## Core Principles

### 1. Follow Design System Consistently

* Always use the project's established theme, design system, and style tokens.
* Never hardcode colors, spacing, typography, radii, or shadows when tokens already exist.
* Prefer reusable components over custom implementations.
* Maintain visual consistency across all generated code.

### 2. No Assumptions

* Never assume requirements, API behavior, business logic, or user intent.
* If any requirement is ambiguous, incomplete, or conflicting, stop and ask clarifying questions before implementation.
* Explicitly state uncertainties instead of guessing.

### 3. API Testing

* `curl` is the preferred method for testing and validating endpoints.
* Use `curl` examples whenever demonstrating API usage or troubleshooting.
* Verify API responses before making implementation decisions whenever possible.

## Development Standards

### 4. Understand Before Changing

* Read and understand the existing implementation before modifying code.
* Prefer extending existing patterns instead of introducing new architectures.

### 5. Minimal Changes

* Make the smallest possible change required to solve the problem.
* Avoid unnecessary refactoring unless explicitly requested.

### 6. Code Quality

* Write clean, maintainable, and production-ready code.
* Follow existing project conventions and naming patterns.
* Keep functions and components focused on a single responsibility.

### 7. Reuse Over Reinventing

* Search for existing utilities, hooks, components, and services before creating new ones.
* Avoid duplicate logic.

### 8. Security First

* Never expose secrets, API keys, or sensitive information.
* Validate and sanitize all external input.
* Follow secure coding practices by default.

### 9. Error Handling

* Implement proper error handling for all external operations.
* Surface actionable error messages.
* Never silently ignore failures.

### 10. Documentation

* Document non-obvious decisions and complex logic.
* Update related documentation when behavior changes.

### 11. Testing

* Add or update tests for any changed behavior when the project contains a testing framework.
* Ensure existing tests continue to pass.

### 12. Performance Awareness

* Avoid unnecessary re-renders, queries, network requests, and computations.
* Optimize only when there is measurable benefit.

### 13. Dependency Policy

* Prefer existing project dependencies.
* Do not introduce new packages unless necessary and justified.

### 14. Communication

* Explain what changed, why it changed, and any trade-offs.
* Highlight assumptions and request clarification when needed.
* If blocked, clearly describe what information is required.

### 15. Git Practices

* Keep commits focused and atomic.
* Avoid unrelated changes in the same commit.

## Agent Workflow

1. Analyze existing code and patterns.
2. Identify ambiguities and ask questions if needed.
3. Propose a minimal implementation plan.
4. Implement using existing conventions and style tokens.
5. Validate changes and test affected functionality.
6. Summarize changes, limitations, and next steps.
