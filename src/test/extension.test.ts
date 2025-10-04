import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Extension should be present', () => {
		const extension = vscode.extensions.getExtension('undefined_publisher.vscode-test-specialist');
		assert.ok(extension);
	});

	test('Extension should activate', async () => {
		const extension = vscode.extensions.getExtension('undefined_publisher.vscode-test-specialist');
		await extension?.activate();
		assert.strictEqual(extension?.isActive, true);
	});
});
