// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-test-specialist" is now active!');

	// Register the chat participant
	const participant = vscode.chat.createChatParticipant('test-specialist.assistant', handler);
	participant.iconPath = vscode.Uri.joinPath(context.extensionUri, 'icon.png');

	context.subscriptions.push(participant);
}

// Chat request handler
async function handler(
	request: vscode.ChatRequest,
	context: vscode.ChatContext,
	stream: vscode.ChatResponseStream,
	token: vscode.CancellationToken
): Promise<vscode.ChatResult> {
	// Try to get the content of the currently active file
	const activeEditor = vscode.window.activeTextEditor;
	
	if (activeEditor) {
		const document = activeEditor.document;
		const fileName = document.fileName;
		const fileContent = document.getText();
		
		stream.markdown(`I can see you have **${fileName}** open with the following content:\n\n`);
		stream.markdown('```\n' + fileContent + '\n```\n\n');
		stream.markdown(`Your request was: "${request.prompt}"\n\n`);
		stream.markdown('I am The Test Specialist, here to help you with software testing!');
	} else {
		stream.markdown('No file is currently open in the editor.\n\n');
		stream.markdown(`Your request was: "${request.prompt}"\n\n`);
		stream.markdown('I am The Test Specialist, here to help you with software testing!');
	}
	
	return { metadata: { command: '' } };
}

// This method is called when your extension is deactivated
export function deactivate() {}
