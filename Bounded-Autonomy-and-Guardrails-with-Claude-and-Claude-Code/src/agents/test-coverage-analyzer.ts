/**
 * Test Coverage Analyzer Agent
 *
 * Specializes in identifying gaps in test coverage and suggesting specific test cases
 */

import { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts';

export const testCoverageAnalyzerAgent: AgentDefinition = {
  description: 'Analyzes test coverage, identifies untested functions and edge cases, and suggests specific test cases with meaningful assertions',

  model: 'inherit',

  tools: ['Skill', 'Read', 'Grep', 'Glob'],

  prompt: TEST_COVERAGE_ANALYZER_PROMPT
};