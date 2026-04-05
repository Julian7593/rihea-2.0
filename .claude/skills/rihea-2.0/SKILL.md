```markdown
# rihea-2.0 Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `rihea-2.0` JavaScript project, built with the Vite framework. It covers file organization, code style, commit practices, and testing patterns, providing clear examples and step-by-step workflows for contributors.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names.
  - Example: `userProfile.js`, `dataFetcher.js`

### Import Style
- Use **relative imports** for modules within the project.
  - Example:
    ```javascript
    import userService from './userService';
    ```

### Export Style
- Use **default exports** for modules.
  - Example:
    ```javascript
    // userService.js
    export default function userService() {
      // ...
    }
    ```

### Commit Patterns
- Commit messages are **freeform**, sometimes with prefixes.
- Average commit message length: **36 characters**.
  - Example:  
    ```
    Add user authentication logic
    ```

## Workflows

### Adding a New Feature
**Trigger:** When implementing a new feature or module  
**Command:** `/add-feature`

1. Create a new file using camelCase naming (e.g., `newFeature.js`).
2. Implement the feature logic.
3. Use relative imports to include dependencies.
4. Export the main function or component as default.
5. Write a corresponding test file named `newFeature.test.js`.
6. Commit changes with a clear, concise message.

### Refactoring Code
**Trigger:** When improving or restructuring existing code  
**Command:** `/refactor`

1. Identify the code to refactor.
2. Rename files using camelCase if needed.
3. Update import paths to maintain relative imports.
4. Ensure exports remain default.
5. Update or add tests as necessary.
6. Commit with a descriptive message.

### Writing Tests
**Trigger:** When adding or updating tests  
**Command:** `/write-test`

1. Create a test file with the pattern `*.test.js` (e.g., `userService.test.js`).
2. Write tests for the corresponding module.
3. Use the project's preferred (unknown) testing framework.
4. Commit the test file with a message indicating the test addition or update.

## Testing Patterns

- Test files follow the pattern: `*.test.js` (e.g., `dataFetcher.test.js`).
- The specific testing framework is not defined in the repository.
- Place test files alongside or near the modules they test.

  Example:
  ```
  src/
    userService.js
    userService.test.js
  ```

## Commands
| Command        | Purpose                                      |
|----------------|----------------------------------------------|
| /add-feature   | Start workflow for adding a new feature      |
| /refactor      | Begin code refactoring workflow              |
| /write-test    | Begin writing or updating a test file        |
```
