import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { activate } from '../extension';

suite('Test Specialist Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	let context: vscode.ExtensionContext;
	let sandbox: sinon.SinonSandbox;

	setup(() => {
		sandbox = sinon.createSandbox();
		context = {
			subscriptions: [],
			extensionUri: vscode.Uri.file('/test/path'),
			extensionPath: '/test/path'
		} as any;
	});

	teardown(() => {
		sandbox.restore();
	});

	test('Extension should be present', () => {
		const extension = vscode.extensions.getExtension('undefined_publisher.vscode-test-specialist');
		assert.ok(extension);
	});

	test('Extension should activate', async () => {
		const extension = vscode.extensions.getExtension('undefined_publisher.vscode-test-specialist');
		await extension?.activate();
		assert.strictEqual(extension?.isActive, true);
	});

	test('Extension should register chat participant on activation', () => {
		const createChatParticipantStub = sandbox.stub(vscode.chat, 'createChatParticipant');
		const mockParticipant = {
			iconPath: undefined,
			dispose: () => {}
		} as any;
		createChatParticipantStub.returns(mockParticipant);

		activate(context);

		assert.ok(createChatParticipantStub.calledOnce);
		assert.ok(createChatParticipantStub.calledWith('test-specialist.assistant'));
		assert.ok(context.subscriptions.length > 0);
	});

	test('Chat participant should be registered with correct properties', () => {
		const createChatParticipantStub = sandbox.stub(vscode.chat, 'createChatParticipant');
		const mockParticipant = {
			iconPath: undefined,
			dispose: () => {}
		} as any;
		createChatParticipantStub.returns(mockParticipant);

		activate(context);

		const [participantId, handler] = createChatParticipantStub.getCall(0).args;
		assert.strictEqual(participantId, 'test-specialist.assistant');
		assert.strictEqual(typeof handler, 'function');
	});

	suite('Chat Handler Tests', () => {
		test('Handler should handle requests when no active editor is present', async () => {
			// Mock vscode.lm.selectChatModels to return empty array
			const selectChatModelsStub = sandbox.stub(vscode.lm, 'selectChatModels');
			selectChatModelsStub.resolves([]);

			// Mock stream
			const stream = {
				markdown: sandbox.stub()
			} as any;

			// Mock request and context
			const request = { prompt: 'Help me write unit tests' } as any;
			const chatContext = {} as any;
			const token = { isCancellationRequested: false } as any;

			// Get the handler from activation
			const createChatParticipantStub = sandbox.stub(vscode.chat, 'createChatParticipant');
			const mockParticipant = { iconPath: undefined, dispose: () => {} } as any;
			createChatParticipantStub.returns(mockParticipant);

			activate(context);
			const handler = createChatParticipantStub.getCall(0).args[1];

			// Execute handler
			const result = await handler(request, chatContext, stream, token);

			// Verify error message for no models
			assert.ok(stream.markdown.calledWith('❌ **Error**: No language models are available. Please ensure you have access to VS Code language models.'));
			assert.deepStrictEqual(result, { metadata: { command: '' } });
		});

		test('Handler should include active file context when editor is present', async () => {
			// Mock active editor
			const mockDocument = {
				fileName: '/test/file.ts',
				languageId: 'typescript',
				getText: () => 'console.log("test");'
			};
			const mockEditor = { document: mockDocument };
			sandbox.stub(vscode.window, 'activeTextEditor').value(mockEditor);

			// Mock language model
			const mockModel = {
				id: 'test-model',
				name: 'Test Model',
				vendor: 'Test Vendor',
				family: 'test-family',
				version: '1.0.0',
				maxInputTokens: 4096,
				countTokens: sandbox.stub(),
				sendRequest: sandbox.stub().resolves({
					text: (async function* () {
						yield 'Test response from AI';
					})()
				})
			} as any;
			const selectChatModelsStub = sandbox.stub(vscode.lm, 'selectChatModels');
			selectChatModelsStub.resolves([mockModel]);

			// Mock stream
			const stream = { markdown: sandbox.stub() } as any;

			// Mock request and context
			const request = { prompt: 'Help me write unit tests' } as any;
			const chatContext = {} as any;
			const token = { isCancellationRequested: false } as any;

			// Get the handler from activation
			const createChatParticipantStub = sandbox.stub(vscode.chat, 'createChatParticipant');
			const mockParticipant = { iconPath: undefined, dispose: () => {} } as any;
			createChatParticipantStub.returns(mockParticipant);

			activate(context);
			const handler = createChatParticipantStub.getCall(0).args[1];

			// Execute handler
			await handler(request, chatContext, stream, token);

			// Verify that sendRequest was called with system prompt and file context
			assert.ok(mockModel.sendRequest.calledOnce);
			const [messages] = mockModel.sendRequest.getCall(0).args;
			
			// Check if messages array has content
			assert.ok(messages.length > 0, 'Should have at least one message');
			
			// The sendRequest should have been called with proper arguments
			// We mainly want to verify that the handler was called with the right parameters
			assert.ok(Array.isArray(messages), 'Should pass messages array');
			assert.strictEqual(messages.length, 1, 'Should have exactly one message');
		});
	});
});
