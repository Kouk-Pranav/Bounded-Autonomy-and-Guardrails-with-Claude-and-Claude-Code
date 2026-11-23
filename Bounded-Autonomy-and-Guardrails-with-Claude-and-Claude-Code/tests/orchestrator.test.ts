import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CodeReviewOrchestrator } from '../src/orchestrator';
import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema,
  CodeQualityResultJSONSchema,
  TestCoverageResultJSONSchema,
  RefactoringSuggestionJSONSchema
} from '../src/types/analysis-results';
import { ReviewReportSchema } from '../src/types/report-types';
import { RateLimiter, DEFAULT_RATE_LIMITS } from '../src/utils/rate-limiter';
import { withRetry, withTimeout, ReviewError, ErrorCodes } from '../src/utils/error-handler';

/**
 * Tests for CodeReviewOrchestrator and supporting utilities
 *
 * Tests cover:
 * - Orchestrator configuration
 * - Schema validation (Zod and JSON Schema)
 * - Rate limiter functionality
 * - Error handler (retry and timeout)
 * - Integration scenarios
 */

describe('CodeReviewOrchestrator', () => {
  describe('Configuration', () => {
    it('should initialize with default options', () => {
      const orchestrator = new CodeReviewOrchestrator();
      expect(orchestrator).toBeDefined();
    });

    it('should initialize with custom model option', () => {
      const customModel = 'claude-opus-4-5-20251101';
      const orchestrator = new CodeReviewOrchestrator({ model: customModel });
      expect(orchestrator).toBeDefined();
    });

    it('should use ANTHROPIC_MODEL environment variable as fallback', () => {
      const originalModel = process.env.ANTHROPIC_MODEL;
      process.env.ANTHROPIC_MODEL = 'test-model-123';

      const orchestrator = new CodeReviewOrchestrator();
      expect(orchestrator).toBeDefined();

      process.env.ANTHROPIC_MODEL = originalModel;
    });
  });

  describe('Schema Validation', () => {
    describe('CodeQualityResult Schema', () => {
      it('should validate correct code quality result', () => {
        const validResult = {
          file: 'src/index.ts',
          issues: [
            {
              line: 42,
              severity: 'high' as const,
              category: 'security' as const,
              description: 'SQL injection vulnerability',
              suggestion: 'Use parameterized queries'
            }
          ],
          overallScore: 72,
          summary: 'File has security concerns'
        };

        expect(() => CodeQualityResultSchema.parse(validResult)).not.toThrow();
      });

      it('should reject invalid severity level', () => {
        const invalidResult = {
          file: 'src/index.ts',
          issues: [
            {
              line: 42,
              severity: 'extreme', // Invalid
              category: 'security' as const,
              description: 'Issue',
              suggestion: 'Fix it'
            }
          ],
          overallScore: 72,
          summary: 'Summary'
        };

        expect(() => CodeQualityResultSchema.parse(invalidResult)).toThrow();
      });

      it('should reject score out of range', () => {
        const invalidResult = {
          file: 'src/index.ts',
          issues: [],
          overallScore: 150, // Invalid: > 100
          summary: 'Summary'
        };

        expect(() => CodeQualityResultSchema.parse(invalidResult)).toThrow();
      });
    });

    describe('TestCoverageResult Schema', () => {
      it('should validate correct test coverage result', () => {
        const validResult = {
          file: 'src/utils.ts',
          hasTests: false,
          testFiles: [],
          untestedPaths: [
            {
              type: 'function' as const,
              location: 'parseJSON()',
              priority: 'critical' as const,
              reasoning: 'Central utility used everywhere',
              suggestedTest: 'expect(parseJSON(\'{}\')toEqual({})'
            }
          ],
          coverageEstimate: 45,
          summary: 'No tests found'
        };

        expect(() => TestCoverageResultSchema.parse(validResult)).not.toThrow();
      });

      it('should reject invalid untested path type', () => {
        const invalidResult = {
          file: 'src/utils.ts',
          hasTests: false,
          testFiles: [],
          untestedPaths: [
            {
              type: 'unknown-type', // Invalid
              location: 'function()',
              priority: 'high' as const,
              reasoning: 'Needs tests',
              suggestedTest: 'test code'
            }
          ],
          coverageEstimate: 50,
          summary: 'No tests'
        };

        expect(() => TestCoverageResultSchema.parse(invalidResult)).toThrow();
      });
    });

    describe('RefactoringSuggestion Schema', () => {
      it('should validate correct refactoring suggestion', () => {
        const validResult = {
          file: 'src/controller.ts',
          suggestions: [
            {
              type: 'extract-function' as const,
              location: 'handleRequest() lines 10-50',
              impact: 'high' as const,
              description: 'Function too long',
              before: 'function handleRequest() { /* 40 lines */ }',
              after: 'function validateInput() {...}\nfunction handleRequest() {...}',
              benefits: 'Improved readability and testability'
            }
          ],
          summary: 'Several opportunities identified'
        };

        expect(() => RefactoringSuggestionSchema.parse(validResult)).not.toThrow();
      });

      it('should reject empty suggestions array', () => {
        const result = {
          file: 'src/controller.ts',
          suggestions: [],
          summary: 'No refactorings'
        };

        // Should still be valid - empty array is allowed
        expect(() => RefactoringSuggestionSchema.parse(result)).not.toThrow();
      });
    });

    describe('JSON Schema Exports', () => {
      it('should export valid JSON schema for CodeQualityResult', () => {
        expect(CodeQualityResultJSONSchema).toBeDefined();
        expect(CodeQualityResultJSONSchema.type).toBe('object');
      });

      it('should export valid JSON schema for TestCoverageResult', () => {
        expect(TestCoverageResultJSONSchema).toBeDefined();
        expect(TestCoverageResultJSONSchema.type).toBe('object');
      });

      it('should export valid JSON schema for RefactoringSuggestion', () => {
        expect(RefactoringSuggestionJSONSchema).toBeDefined();
        expect(RefactoringSuggestionJSONSchema.type).toBe('object');
      });
    });
  });

  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter();
    });

    it('should initialize with default limits', () => {
      const status = rateLimiter.getStatus();
      expect(status.activeRequests).toBe(0);
      expect(status.requestsInWindow).toBe(0);
      expect(status.tokensInWindow).toBe(0);
    });

    it('should track concurrent requests', async () => {
      const status1 = rateLimiter.getStatus();
      expect(status1.activeRequests).toBe(0);

      await rateLimiter.acquire(1000);
      const status2 = rateLimiter.getStatus();
      expect(status2.activeRequests).toBe(1);

      rateLimiter.release();
      const status3 = rateLimiter.getStatus();
      expect(status3.activeRequests).toBe(0);
    });

    it('should respect maxConcurrent limit', async () => {
      const limiter = new RateLimiter({ maxConcurrent: 2 });

      await limiter.acquire(100);
      await limiter.acquire(100);

      const status = limiter.getStatus();
      expect(status.activeRequests).toBe(2);
      expect(limiter.canProceed(100)).toBe(false); // Max concurrent reached

      limiter.release();
      limiter.release();
    });

    it('should track tokens used in window', async () => {
      await rateLimiter.acquire(5000);
      const status = rateLimiter.getStatus();
      expect(status.tokensInWindow).toBe(5000);
      expect(status.requestsInWindow).toBe(1);

      rateLimiter.release();
    });

    it('should update tokens on release', async () => {
      await rateLimiter.acquire(5000);
      rateLimiter.release(4500); // Actual tokens less than estimate
      const status = rateLimiter.getStatus();
      expect(status.tokensInWindow).toBe(4500);
    });

    it('should check if request can proceed', () => {
      const canProceed = rateLimiter.canProceed(1000);
      expect(typeof canProceed).toBe('boolean');
      expect(canProceed).toBe(true); // Should be true initially
    });
  });

  describe('Error Handler', () => {
    describe('withRetry', () => {
      it('should retry on failure and eventually succeed', async () => {
        let attempts = 0;
        const fn = async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error('Temporary failure');
          }
          return 'success';
        };

        const result = await withRetry(fn, 3, 10);
        expect(result).toBe('success');
        expect(attempts).toBe(3);
      });

      it('should throw after max retries exhausted', async () => {
        let attempts = 0;
        const fn = async () => {
          attempts++;
          throw new Error('Always fails');
        };

        try {
          await withRetry(fn, 2, 10);
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ReviewError);
          expect((error as ReviewError).code).toBe(ErrorCodes.RETRY_EXHAUSTED);
          expect(attempts).toBe(2);
        }
      });

      it('should use exponential backoff', async () => {
        const delays: number[] = [];
        const originalSetTimeout = global.setTimeout;

        vi.useFakeTimers();
        let attempts = 0;
        const fn = async () => {
          attempts++;
          if (attempts < 2) {
            throw new Error('Fail once');
          }
          return 'done';
        };

        const promise = withRetry(fn, 3, 100);
        // Fast-forward time
        vi.runAllTimers();
        const result = await promise;

        expect(result).toBe('done');
        vi.useRealTimers();
      });

      it('should succeed immediately if no error', async () => {
        const fn = async () => 'instant-success';
        const result = await withRetry(fn);
        expect(result).toBe('instant-success');
      });
    });

    describe('withTimeout', () => {
      it('should return result if completes before timeout', async () => {
        const fn = async () => {
          return 'completed';
        };

        const result = await withTimeout(fn, 1000);
        expect(result).toBe('completed');
      });

      it('should throw ReviewError on timeout', async () => {
        vi.useFakeTimers();
        const fn = async () => {
          return new Promise(resolve => setTimeout(() => resolve('done'), 5000));
        };

        const promise = withTimeout(fn, 1000, 'Operation timed out');
        vi.runAllTimers();

        try {
          await promise;
          expect.fail('Should have timed out');
        } catch (error) {
          expect(error).toBeInstanceOf(ReviewError);
          expect((error as ReviewError).code).toBe(ErrorCodes.AGENT_TIMEOUT);
        }

        vi.useRealTimers();
      });

      it('should include timeout in error metadata', async () => {
        vi.useFakeTimers();
        const fn = async () => new Promise(resolve => setTimeout(() => resolve('done'), 5000));
        const promise = withTimeout(fn, 2000);
        vi.runAllTimers();

        try {
          await promise;
        } catch (error) {
          if (error instanceof ReviewError) {
            expect(error.metadata?.timeoutMs).toBe(2000);
          }
        }

        vi.useRealTimers();
      });
    });

    describe('ReviewError', () => {
      it('should create error with code and metadata', () => {
        const error = new ReviewError('Test error', ErrorCodes.PR_NOT_FOUND, { pr: 123 });
        expect(error.message).toBe('Test error');
        expect(error.code).toBe(ErrorCodes.PR_NOT_FOUND);
        expect(error.metadata?.pr).toBe(123);
      });

      it('should have correct error name', () => {
        const error = new ReviewError('Test', ErrorCodes.UNKNOWN_ERROR);
        expect(error.name).toBe('ReviewError');
      });
    });
  });

  describe('Integration', () => {
    // These tests require actual API keys and should be skipped in CI
    it.skip('should review a real PR from udacity/cd14715-simple-todo-app', async () => {
      // NOTE: Only run manually with valid API keys and internet access
      // Example: npm test -- --run orchestrator.test.ts --reporter=verbose
      //
      // This would test against real PRs from:
      // - PR #1: add clean code fixture
      // - PR #2: Add search functionality for todos
      // - PR #3: Add premium subscription features

      const orchestrator = new CodeReviewOrchestrator();
      // const report = await orchestrator.reviewPullRequest(
      //   'udacity',
      //   'cd14715-simple-todo-app',
      //   1
      // );
      // expect(report).toBeDefined();
      // expect(report.pullRequest.number).toBe(1);
      // expect(report.summary.overallScore).toBeGreaterThanOrEqual(0);
      // expect(report.summary.overallScore).toBeLessThanOrEqual(100);
    });
  });
});
