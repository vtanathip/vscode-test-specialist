# VS Code Test Specialist

An AI-powered VS Code extension specialized in software testing, QA, and test-driven development.

## Features

- **AI Testing Expert**: Leverages VS Code Language Models for intelligent testing guidance
- **Context-Aware**: Automatically includes your current file for relevant suggestions
- **Human-in-the-Loop**: Asks for confirmation before making any code changes
- **Testing-Focused**: Specializes in unit tests, integration tests, E2E testing, and TDD practices

## Usage

1. Use `@testarch` in VS Code Chat
2. Ask testing-related questions (unit tests, TDD, test frameworks, etc.)
3. Get AI-powered suggestions with explanations
4. Approve changes through confirmation dialogs

## Requirements

- VS Code 1.104.0+
- Access to VS Code Language Models

## Development & Testing

### Build the Extension

```bash
npm install          # Install dependencies
npm run compile      # Compile TypeScript
```

### Run Tests

```bash
npm test            # Run all tests
npm run lint        # Check code quality
```

### Test the Extension Locally

1. **Open in VS Code**: Open this project folder in VS Code
2. **Start Debug Session**: Press `F5` or go to Run > Start Debugging
3. **New VS Code Window**: A new Extension Development Host window will open
4. **Open Chat**: In the new window, use `Ctrl+Alt+I` or View > Chat
5. **Test the Assistant**: Type `@testarch help me write unit tests`

### Example Interactions

**Basic Testing Help:**

```text
@testarch How do I write unit tests for this function?
```

**Framework-Specific Questions:**

```text
@testarch Show me Jest test examples for async functions
@testarch Help me set up Playwright for E2E testing
```

**Code Review:**

```text
@testarch Review my test file for best practices
```

### Human-in-the-Loop Features

When the assistant suggests code changes, you'll see:

- 🤖 **HITL Checkpoint** with change summary
- **Confirmation dialog** with options:
  - ✅ Apply Changes
  - 📋 Review First (opens preview)
  - ❌ Cancel

### Troubleshooting

- **No Language Models**: Ensure you have access to GitHub Copilot or other VS Code language models
- **Chat Not Working**: Check that the extension is active in the Extensions view
- **Permission Issues**: Verify language model permissions in VS Code settings

## License

MIT - See LICENSE file for details
