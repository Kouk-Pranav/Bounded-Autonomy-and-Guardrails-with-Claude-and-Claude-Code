import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { CodeReviewOrchestrator } from './orchestrator';
import { ReportGenerator } from './utils/report-generator';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

/**
 * Main entry point for the Claude Multi-Agent Code Review System
 * Usage: npm run dev <owner> <repo> <pr-number>
 */
async function main() {
  const [owner, repo, prStr] = process.argv.slice(2);

  // Validate command line arguments
  if (!owner || !repo || !prStr) {
    console.error(
      '❌ Missing required arguments\n' +
      'Usage: npm run dev <owner> <repo> <pr-number>\n' +
      'Example: npm run dev facebook react 12345'
    );
    process.exit(1);
  }

  const prNumber = parseInt(prStr, 10);
  if (isNaN(prNumber) || prNumber <= 0) {
    console.error(`❌ PR number must be a positive integer, got: ${prStr}`);
    process.exit(1);
  }

  // Validate authentication method
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY;
  const hasAwsAuth =
    !!process.env.AWS_ACCESS_KEY_ID &&
    !!process.env.AWS_SECRET_ACCESS_KEY &&
    !!process.env.AWS_REGION;

  if (!hasApiKey && !hasAwsAuth) {
    console.error(
      '❌ No authentication method configured\n\n' +
      'Choose ONE of the following:\n' +
      '1. Anthropic API (Recommended)\n' +
      '   - Set ANTHROPIC_API_KEY environment variable\n\n' +
      '2. AWS Bedrock\n' +
      '   - Set AWS_ACCESS_KEY_ID\n' +
      '   - Set AWS_SECRET_ACCESS_KEY\n' +
      '   - Set AWS_REGION'
    );
    process.exit(1);
  }

  if (hasAwsAuth) {
    console.log('🔐 Using AWS Bedrock authentication');
  } else {
    console.log('🔐 Using Anthropic API authentication');
  }

  // Validate ANTHROPIC_MODEL environment variable
  const model = process.env.ANTHROPIC_MODEL;
  if (!model) {
    console.error(
      '❌ ANTHROPIC_MODEL environment variable is required\n' +
      'For Anthropic API: claude-opus-4-5-20251101\n' +
      'For AWS Bedrock: us.anthropic.claude-sonnet-4-5-20250929-v1:0'
    );
    process.exit(1);
  }

  try {
    console.log(`\n🔍 Starting code review for ${owner}/${repo}#${prNumber}...`);

    // Create orchestrator instance
    const orchestrator = new CodeReviewOrchestrator({ model });

    // Review the pull request
    const report = await orchestrator.reviewPullRequest(owner, repo, prNumber);

    // Generate reports in all formats
    const reportGenerator = new ReportGenerator();

    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate and save reports
    const baseName = `${owner}_${repo}_pr${prNumber}`;

    // JSON report
    const jsonReport = reportGenerator.generateJSONReport(report);
    const jsonPath = path.join(reportsDir, `${baseName}.json`);
    fs.writeFileSync(jsonPath, jsonReport);
    console.log(`✅ JSON report saved: ${jsonPath}`);

    // Markdown report
    const mdReport = reportGenerator.generateMarkdownReport(report);
    const mdPath = path.join(reportsDir, `${baseName}.md`);
    fs.writeFileSync(mdPath, mdReport);
    console.log(`✅ Markdown report saved: ${mdPath}`);

    // HTML report
    const htmlReport = reportGenerator.generateHTMLReport(report);
    const htmlPath = path.join(reportsDir, `${baseName}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    console.log(`✅ HTML report saved: ${htmlPath}`);

    console.log(
      `\n📊 Review Complete!\n` +
      `Overall Score: ${report.summary.overallScore}/100\n` +
      `Critical Issues: ${report.summary.criticalIssues}\n` +
      `Test Gaps: ${report.summary.highPriorityTests}\n` +
      `Refactoring Opportunities: ${report.summary.refactoringOpportunities}`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Code review failed', {
      owner,
      repo,
      prNumber,
      error: errorMessage
    });
    console.error(`\n❌ Error: ${errorMessage}`);
    process.exit(1);
  }
}

main();
