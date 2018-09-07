# Probot-empty
A GitHub App built with [Probot](https://probot.github.io) that pushes an empty commit if any user comments something specific.

## How it works
If a user comments in a Pull Request something specific, bot will push an empty commit. It is useful if you need to trigger any event in your Continuous Integration service (CircleCI, Travis, Buildkite), like deploying a staging deploy.

You can especify the required files where the bot needs to check before pushing the commit. Also, you can edit all interaction messages.

## Installation
After installing the app, create `.github/probot-empty.yml` in the default branch to enable it:

```yml
# user comment to push the comment
magicWords: deploy staging
# files needed
requiredFiles: [.circleci/config.yml, config/scripts/deploy-staging]
messages: 
  # Message if bot can push a commit
  appEnabled: Hello there, I'll make an empty commit whenever you comment `<%= magicWords %>` in this PR.
  # Message if bot can't push a commit
  appDisabled: Hello there, I will not be able to help you until these file(s) are present -> `<%= files %>`
  # Message if required file(s) is/are not present
  fileNotPresent: I need the following files in order to make an empty commit. `<%= files %>`
  # Message if the comment contains the message but also other characters
  exact: If you want me to make an empty commit just type `<%= magicWords %>`, and nothing else.
  # Bot comment after pushing the empty commit
  trigger: Pushing the empty commit...
  # Commit message
  commit: Empty commit
```
