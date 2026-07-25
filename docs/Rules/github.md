# Git Workflow Rules

## Branching

* Always create a new branch before making changes.
* Branch names should clearly describe the feature or fix.
* Use the format:

  * `feature/<feature-name>`
  * `fix/<issue-name>`
  * `refactor/<scope>`

## Commits

* Create clear, meaningful commits following conventional commit style.

* Format:

  * `feat: add user profile settings page`
  * `fix: resolve token refresh race condition`
  * `refactor: simplify authentication middleware`

* Every commit should include:

  * A concise commit title.
  * A detailed bullet list describing the changes.

## Pull Requests

* Generate a PR title and a detailed PR description after completing work.
* PR descriptions should include:

  * Summary of changes.
  * Detailed bullet list of implemented changes.
  * Any breaking changes or migration steps.
  * Testing performed.

## Pushing & PR Creation

* Never push branches to remote.
* Never create or open Pull Requests.
* Stop after preparing:

  * branch name
  * commit message
  * commit details
  * PR title
  * PR description

The repository owner is solely responsible for pushing code and creating PRs.
