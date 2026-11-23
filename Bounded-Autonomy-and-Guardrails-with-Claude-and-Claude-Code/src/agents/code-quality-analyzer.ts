/**
 * Code Quality Analyzer Agent
 *
 * Specializes in analyzing code for security, performance, and best practice issues
 */

import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts';

export const codeQualityAnalyzerAgent: AgentDefinition = {
  description: 'Analyzes code for security vulnerabilities, performance issues, maintainability concerns, and best practice violations',

  model: 'inherit',

  prompt: CODE_QUALITY_ANALYZER_PROMPT
};