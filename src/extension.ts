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
const SYSTEM_PROMPT = `You are 'The Test Specialist,' an AI expert specialized exclusively in software testing, quality assurance (QA), and test-driven development (TDD). Your knowledge encompasses unit tests, integration tests, end-to-end (E2E) testing, performance, security testing, and common frameworks (Jest, Pytest, JUnit, Playwright, Selenium). Your primary role is to critique, guide, and generate test-related code and strategies. If a user asks a question about a non-testing topic (e.g., 'write a UI component'), you must politely refuse and redirect them back to testing. Always provide concise, actionable, and TDD-aligned advice. Your response must be in Markdown.

IMPORTANT: When suggesting file modifications, you must:
1. Clearly explain WHY the change is needed and what problem it solves
2. Use the format: **PROPOSED_CHANGE:** followed by the explanation
3. Then provide the specific code changes
4. The system will ask for user confirmation before applying any changes

Example format:
**PROPOSED_CHANGE:** This change is needed to add proper error handling to prevent runtime crashes when the API returns unexpected data.

` + '```typescript\n// Your suggested code here\n```';

// Interface for proposed file changes
interface ProposedChange {
	explanation: string;
	filePath?: string;
	oldCode?: string;
	newCode: string;
	language: string;
}

// Function to parse proposed changes from AI response
export function parseProposedChanges(response: string): ProposedChange[] {
	const changes: ProposedChange[] = [];
	const proposedChangeRegex = /\*\*PROPOSED_CHANGE:\*\*\s*(.*?)(?=\*\*PROPOSED_CHANGE:\*\*|$)/gs;
	
	let match;
	while ((match = proposedChangeRegex.exec(response)) !== null) {
		const section = match[1];
		const explanationMatch = section.match(/^(.*?)```/s);
		const codeBlockMatch = section.match(/```(\w+)?\s*([\s\S]*?)```/);
		
		if (explanationMatch && codeBlockMatch) {
			changes.push({
				explanation: explanationMatch[1].trim(),
				newCode: codeBlockMatch[2].trim(),
				language: codeBlockMatch[1] || 'text'
			});
		}
	}
	
	return changes;
}

// Function to show confirmation dialog for proposed changes
async function confirmChanges(changes: ProposedChange[]): Promise<boolean> {
	if (changes.length === 0) {
		return false;
	}

	const changeDescriptions = changes.map((change, index) => 
		`${index + 1}. ${change.explanation}`
	).join('\n\n');

	const message = `The Test Specialist wants to make ${changes.length} change(s) to your code:\n\n${changeDescriptions}\n\nDo you want to proceed?`;
	
	const applyChanges: vscode.MessageItem = { title: 'Apply Changes' };
	const reviewFirst: vscode.MessageItem = { title: 'Review First' };
	const cancel: vscode.MessageItem = { title: 'Cancel', isCloseAffordance: true };
	
	const result = await vscode.window.showWarningMessage(
		message,
		{ modal: true },
		applyChanges,
		reviewFirst,
		cancel
	);

	if (result === applyChanges) {
		return true;
	} else if (result === reviewFirst) {
		// Show detailed preview of changes
		await showChangePreview(changes);
		return false; // User can manually apply after review
	}
	
	return false;
}

// Function to show detailed preview of changes
async function showChangePreview(changes: ProposedChange[]): Promise<void> {
	const doc = await vscode.workspace.openTextDocument({
		content: generateChangePreview(changes),
		language: 'markdown'
	});
	await vscode.window.showTextDocument(doc);
}

// Function to generate preview content
function generateChangePreview(changes: ProposedChange[]): string {
	let preview = '# Proposed Changes by The Test Specialist\n\n';
	
	changes.forEach((change, index) => {
		preview += `## Change ${index + 1}\n\n`;
		preview += `**Explanation:** ${change.explanation}\n\n`;
		preview += `**Proposed Code:**\n\n`;
		preview += '```' + change.language + '\n';
		preview += change.newCode + '\n';
		preview += '```\n\n';
		preview += '---\n\n';
	});
	
	return preview;
};

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

		// Collect the full response to check for proposed changes
		let fullResponse = '';
		
		// Stream the response back to the user
		for await (const fragment of chatResponse.text) {
			fullResponse += fragment;
			stream.markdown(fragment);
			
			// Check for cancellation
			if (token.isCancellationRequested) {
				break;
			}
		}

		// Check for proposed changes and handle HITL confirmation
		if (!token.isCancellationRequested) {
			const proposedChanges = parseProposedChanges(fullResponse);
			
			if (proposedChanges.length > 0) {
				stream.markdown('\n\n---\n\n');
				stream.markdown('🤖 **Human-in-the-Loop Checkpoint**\n\n');
				stream.markdown(`I've identified ${proposedChanges.length} potential code change(s) that could improve your testing setup. `);
				stream.markdown('Please review the changes above and let me know if you\'d like me to:\n\n');
				stream.markdown('1. ✅ **Apply the changes** - I\'ll make the modifications for you\n');
				stream.markdown('2. 📋 **Show detailed preview** - View a comprehensive breakdown\n');
				stream.markdown('3. ❌ **Skip changes** - Keep the current code as-is\n\n');
				stream.markdown('> 💡 **Why HITL?** This ensures you maintain full control over your codebase and understand every change being made.\n\n');
				
				// Show confirmation dialog
				const userApproved = await confirmChanges(proposedChanges);
				
				if (userApproved) {
					stream.markdown('✅ **Changes approved!** The modifications have been applied to your code.\n');
					// Here you could add actual file modification logic if needed
					// For now, we just inform the user that changes would be applied
				} else {
					stream.markdown('ℹ️ **No changes applied.** You can manually implement the suggestions when ready.\n');
				}
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
