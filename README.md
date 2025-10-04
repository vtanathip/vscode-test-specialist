# vscode-test-specialist

A VS Code extension that provides a specialized chat participant for software testing assistance.

## Features

This extension registers a chat participant called **The Test Specialist** that can be invoked using `@testarch` in the VS Code chat interface.

### Key Features:

1. **Chat Participant Registration**: Registers a chat participant with ID `test-specialist.assistant`
2. **Active File Context**: Automatically pulls in the content of the currently active file in the VS Code editor as context
3. **Interactive Chat**: Responds to user queries with contextual information about the open file

## Usage

1. Open a file in VS Code
2. Open the chat interface (View > Chat or `Ctrl+Alt+I`)
3. Type `@testarch` followed by your question
4. The Test Specialist will respond with information about your currently active file and help with software testing

## Requirements

- VS Code version 1.104.0 or higher

## Extension Settings

This extension does not currently contribute any settings.

## Development

### Building

```bash
npm run compile
```

### Linting

```bash
npm run lint
```

### Testing

```bash
npm test
```

## Release Notes

### 0.0.1

Initial release of the Test Specialist extension:
- Chat participant registration
- Active file context detection
- Basic chat response handler

## License

MIT - See LICENSE file for details
