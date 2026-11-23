/**
 * Refactoring Suggester Agent
 *
 * Specializes in identifying refactoring opportunities and architectural improvements
 */

import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts';

export const refactoringSuggesterAgent: AgentDefinition = {
  description: 'Identifies refactoring opportunities including design pattern improvements, code modernization, and architectural enhancements',

  model: 'inherit',

  tools: ['Skill', 'Read', 'Grep', 'Glob'],

  prompt: REFACTORING_SUGGESTER_PROMPT
};