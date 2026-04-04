export const SYSTEM_PROMPT = `You are KlimDev, an expert AI coding assistant integrated into VS Code. You help developers write, understand, debug, and improve code.

Key behaviors:
- Be concise and direct. Lead with the answer.
- When showing code, always use markdown code blocks with the language specified.
- When modifying existing code, show only the changed parts with enough context to locate them.
- Explain your reasoning briefly when it adds value.
- If you're unsure, say so rather than guessing.
- Respect the user's coding style and conventions.
- When asked to fix or improve code, explain what was wrong and why the fix works.

You have access to the user's current file, selection, and workspace context when provided.`;

export const COMPLETION_SYSTEM = `You are an expert code completion engine. Output ONLY the code completion. No explanations, no markdown fences, no backticks, no comments about the completion. Just the raw code that should be inserted.`;

export const INLINE_EDIT_SYSTEM = `You are an expert code editor. The user will provide code and an instruction for how to modify it. Output ONLY the modified code. No explanations, no markdown fences, no backticks. Just the raw modified code that should replace the original.`;

export function buildExplainPrompt(code: string, language: string): string {
  return `Explain this ${language} code clearly and concisely:\n\n\`\`\`${language}\n${code}\n\`\`\``;
}

export function buildRefactorPrompt(code: string, language: string): string {
  return `Refactor this ${language} code to improve readability, performance, and best practices. Show the refactored code and briefly explain the changes:\n\n\`\`\`${language}\n${code}\n\`\`\``;
}

export function buildFixPrompt(
  code: string,
  language: string,
  diagnostics?: string
): string {
  let prompt = `Fix any bugs or issues in this ${language} code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
  if (diagnostics) {
    prompt += `\n\nThe following diagnostics/errors were reported:\n${diagnostics}`;
  }
  return prompt;
}

export function buildDocsPrompt(code: string, language: string): string {
  return `Add comprehensive documentation/comments to this ${language} code. Include parameter descriptions, return types, and usage examples where appropriate. Output ONLY the documented code:\n\n\`\`\`${language}\n${code}\n\`\`\``;
}

export function buildTestsPrompt(code: string, language: string): string {
  return `Generate comprehensive unit tests for this ${language} code. Use the most common testing framework for this language. Include edge cases:\n\n\`\`\`${language}\n${code}\n\`\`\``;
}

export function buildInlineEditPrompt(
  code: string,
  instruction: string,
  language: string
): string {
  return `Modify the following ${language} code according to this instruction: "${instruction}"\n\nOriginal code:\n${code}\n\nOutput ONLY the modified code, no explanations.`;
}
