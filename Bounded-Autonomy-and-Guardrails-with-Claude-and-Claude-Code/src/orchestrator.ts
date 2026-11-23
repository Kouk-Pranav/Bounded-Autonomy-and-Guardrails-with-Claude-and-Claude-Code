import {
  query
} from '@anthropic-ai/claude-agent-sdk';
import { ReviewReport, ReviewReportSchema, ReviewReportJSONSchema } from './types/report-types';
import { buildOrchestratorPrompt } from './prompts';
import { mcpServersConfig } from './config/mcp.config';
import { codeQualityAnalyzerAgent, testCoverageAnalyzerAgent, refactoringSuggesterAgent } from './agents';
import { logger, logReviewStart, logReviewError } from './utils/logger';

/**
 * Orchestrator configuration options
 */
export interface OrchestratorOptions {
  model?: string;
}

/**
 * Main Code Review Orchestrator
 * Coordinates subagents to analyze pull requests and generate comprehensive reports
 */
export class CodeReviewOrchestrator {
  private model: string;

  constructor(options: OrchestratorOptions = {}) {
    this.model = options.model || process.env.ANTHROPIC_MODEL || 'claude-opus-4-5-20251101';
  }

  /**
   * Review a pull request using parallel subagent analysis
   * @param owner - Repository owner
   * @param repo - Repository name
   * @param prNumber - Pull request number
   * @returns Complete review report
   */
  async reviewPullRequest(
    owner: string,
    repo: string,
    prNumber: number
  ): Promise<ReviewReport> {
    const startTime = Date.now();
    logReviewStart(owner, repo, prNumber);

    try {
      const prompt = buildOrchestratorPrompt(owner, repo, prNumber);

      // Configure MCP servers
      const mcpServers = {
        github: (mcpServersConfig.github as any),
        eslint: (mcpServersConfig.eslint as any)
      };

      // Configure subagents for parallel execution
      const agents = {
        'code-quality-analyzer': codeQualityAnalyzerAgent,
        'test-coverage-analyzer': testCoverageAnalyzerAgent,
        'refactoring-suggester': refactoringSuggesterAgent
      };

      // Run the main orchestrator with the query method
      let reviewReport: ReviewReport | null = null;

      for await (const message of query({
        prompt,
        options: {
          model: this.model,
          agents,
          mcpServers,
          outputFormat: {
            type: 'json_schema',
            schema: ReviewReportJSONSchema as any
          }
        }
      })) {
        // Handle result messages
        if ('result' in message) {
          try {
            const parsed = typeof message.result === 'string'
              ? JSON.parse(message.result)
              : message.result;
            reviewReport = ReviewReportSchema.parse(parsed);
          } catch (parseError) {
            logger.error('Failed to parse structured output', parseError);
          }
        }
      }

      if (!reviewReport) {
        throw new Error('Failed to generate review report - no structured output received');
      }

      const duration = Date.now() - startTime;

      // Add metadata
      reviewReport.metadata = {
        analyzedAt: new Date().toISOString(),
        duration,
        agentVersions: {
          'code-quality': '1.0.0',
          'test-coverage': '1.0.0',
          'refactoring': '1.0.0'
        }
      };

      logger.info('Code review completed', {
        owner,
        repo,
        prNumber,
        score: reviewReport.summary.overallScore,
        duration,
        status: 'success'
      });

      return reviewReport;
    } catch (error) {
      logReviewError(owner, repo, prNumber, error as Error);
      throw error;
    }
  }
}
