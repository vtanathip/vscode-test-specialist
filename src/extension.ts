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

// The Test Specialist system prompt
const SYSTEM_PROMPT = `You are 'The Test Specialist,' an AI expert specialized exclusively in software testing, quality assurance (QA), and test-driven development (TDD). Your knowledge encompasses unit tests, integration tests, end-to-end (E2E) testing, performance, security testing, and common frameworks (Jest, Pytest, JUnit, Playwright, Selenium). Your primary role is to critique, guide, and generate test-related code and strategies. If a user asks a question about a non-testing topic (e.g., 'write a UI component'), you must politely refuse and redirect them back to testing. Always provide concise, actionable, and TDD-aligned advice. Your response must be in Markdown.`;

// Chat request handler
async function handler(
	request: vscode.ChatRequest,
	context: vscode.ChatContext,
	stream: vscode.ChatResponseStream,
	token: vscode.CancellationToken
): Promise<vscode.ChatResult> {
	try {
		// Get available language models
		const models = await vscode.lm.selectChatModels();
		if (models.length === 0) {
			stream.markdown('❌ **Error**: No language models are available. Please ensure you have access to VS Code language models.');
			return { metadata: { command: '' } };
		}

		// Use the first available model
		const model = models[0];
		
		// Get the content of the currently active file as context
		let fileContext = '';
		const activeEditor = vscode.window.activeTextEditor;
		
		if (activeEditor) {
			const document = activeEditor.document;
			const fileName = document.fileName;
			const fileContent = document.getText();
			
			fileContext = `\n\n**Current File Context:**\nFile: ${fileName}\n\`\`\`${document.languageId}\n${fileContent}\n\`\`\`\n\n`;
		}

		// Prepare the messages for the language model
		const messages = [
			vscode.LanguageModelChatMessage.User(`${SYSTEM_PROMPT}${fileContext}User request: ${request.prompt}`)
		];

		// Request chat response from the language model
		const chatResponse = await model.sendRequest(messages, {}, token);

		// Stream the response back to the user
		for await (const fragment of chatResponse.text) {
			stream.markdown(fragment);
			
			// Check for cancellation
			if (token.isCancellationRequested) {
				break;
			}
		}

		return { metadata: { command: '' } };
		
	} catch (error) {
		console.error('Error in Test Specialist handler:', error);
		
		if (error instanceof vscode.LanguageModelError) {
			// Handle different types of language model errors
			const errorMessage = error.message;
			if (errorMessage.includes('permission') || errorMessage.includes('access')) {
				stream.markdown('❌ **Error**: No permissions to use language model. Please check your VS Code settings and ensure you have appropriate access.');
			} else if (errorMessage.includes('blocked') || errorMessage.includes('filtered')) {
				stream.markdown('❌ **Error**: Request was blocked by content filtering. Please rephrase your request.');
			} else {
				stream.markdown(`❌ **Language Model Error**: ${errorMessage}`);
			}
		} else {
			stream.markdown(`❌ **Unexpected Error**: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
		}

		return { metadata: { command: '' } };
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
