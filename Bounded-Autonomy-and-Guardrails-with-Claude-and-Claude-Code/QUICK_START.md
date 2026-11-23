# Quick Start Guide

## For Reviewers

### What to Check First

1. **README.md** - Overview and getting started
2. **SUBMISSION.md** - What's included in this submission
3. **ARCHITECTURE.md** - How the system is designed
4. **reports/** - Review the 9 generated analysis reports

### Key Files to Review

**Implementation:**
- `src/config/mcp.config.ts` - MCP server configuration
- `src/orchestrator.ts` - Main coordination logic
- `src/agents/` - Three specialized agent definitions
- `src/prompts/` - Agent-specific prompts
- `src/main.ts` - CLI application entry point

**Production Features:**
- `src/utils/error-handler.ts` - Retry logic with exponential backoff
- `src/utils/rate-limiter.ts` - Sliding window rate limiting
- `src/utils/report-generator.ts` - Multi-format report generation

**Analysis Results:**
- `reports/udacity_cd14715-simple-todo-app_pr*.json` - Complete analysis data
- `reports/udacity_cd14715-simple-todo-app_pr*.md` - Readable markdown reports
- `reports/udacity_cd14715-simple-todo-app_pr*.html` - Browser-renderable reports

---

## For Developers

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with ANTHROPIC_API_KEY and ANTHROPIC_MODEL

# 3. Build
npm run build

# 4. Run tests
npm test
```

### Running the System

```bash
# Analyze a pull request
npm run dev -- <owner> <repo> <pr-number>

# Example: Analyze a real PR
npm run dev -- udacity cd14715-simple-todo-app 1

# Production build and run
npm run build
npm start udacity cd14715-simple-todo-app 1
```

### View Generated Reports

Generated reports are saved to `reports/` directory:
```bash
# View JSON report (complete data)
cat reports/udacity_cd14715-simple-todo-app_pr1.json

# View Markdown report (formatted)
cat reports/udacity_cd14715-simple-todo-app_pr1.md

# View HTML report in browser
open reports/udacity_cd14715-simple-todo-app_pr1.html
```

### Project Structure

```
src/
├── config/
│   └── mcp.config.ts              # GitHub & ESLint MCP servers
├── agents/                        # Three subagent definitions
│   ├── code-quality-analyzer.ts
│   ├── test-coverage-analyzer.ts
│   ├── refactoring-suggester.ts
│   └── index.ts
├── prompts/                       # Targeted prompts
│   ├── orchestrator.prompt.ts
│   ├── code-quality-analyzer.prompt.ts
│   ├── test-coverage-analyzer.prompt.ts
│   ├── refactoring-suggester.prompt.ts
│   └── index.ts
├── utils/                         # Production utilities
│   ├── error-handler.ts
│   ├── rate-limiter.ts
│   ├── logger.ts
│   ├── report-generator.ts
│   └── index.ts
├── types/                         # Zod schemas
│   ├── analysis-results.ts
│   ├── report-types.ts
│   └── index.ts
├── orchestrator.ts                # Main orchestration
└── main.ts                        # CLI entry point

tests/
└── orchestrator.test.ts           # Unit and integration tests

reports/                          # Generated PR analyses
├── udacity_cd14715-simple-todo-app_pr1.{json,md,html}
├── udacity_cd14715-simple-todo-app_pr2.{json,md,html}
└── udacity_cd14715-simple-todo-app_pr3.{json,md,html}
```

---

## System Flow

### How It Works

```
1. User runs: npm run dev -- owner repo 1
2. CLI validates inputs and environment
3. Orchestrator creates query to Claude
4. Claude fetches PR data via GitHub MCP
5. Claude invokes 3 subagents in parallel:
   - Code Quality Analyzer
   - Test Coverage Analyzer
   - Refactoring Suggester
6. Each agent analyzes the PR files
7. Results aggregated into ReviewReport
8. Report Generator creates 3 formats:
   - JSON (data)
   - Markdown (readable)
   - HTML (browser view)
9. Reports saved to reports/ directory
```

### Key Technologies

- **Claude Agent SDK** - Multi-agent orchestration
- **Model Context Protocol (MCP)** - GitHub/ESLint integration
- **Zod** - Runtime schema validation
- **TypeScript** - Type safety
- **Vitest** - Testing framework

---

## Reports Explained

### What Each Report Contains

**Code Quality Analysis**
- Security vulnerabilities
- Performance issues
- Best practice violations
- Line numbers for each issue
- Severity levels (high/medium/low/info)

**Test Coverage Analysis**
- Current test coverage assessment
- Specific missing test cases
- Edge cases and error scenarios
- Suggested test examples

**Refactoring Suggestions**
- Architectural improvements
- Design pattern recommendations
- Modernization opportunities
- Code examples where applicable

**Overall Score**
- Composite quality score (0-100)
- Summary of key findings
- Prioritized action items

### Report Formats

**JSON** - Complete analysis data, programmatic use
**Markdown** - Human-readable format for documentation
**HTML** - Browser-renderable with formatting

---

## Troubleshooting

### "Cannot find module" errors
```bash
# Rebuild TypeScript
npm run build

# Check imports have .js extensions
# (required for ES modules)
```

### "Missing GITHUB_TOKEN" in reports
```bash
# Add to .env
GITHUB_TOKEN=ghp_your_token_here

# Restart application
```

### Reports with minimal data
```bash
# Check ANTHROPIC_MODEL is set correctly
echo $ANTHROPIC_MODEL

# Should be: claude-sonnet-4-5-20250929 (or similar)
```

### Authentication errors
```bash
# Check one of these is set:
echo $ANTHROPIC_API_KEY      # For Anthropic API
# OR
echo $AWS_ACCESS_KEY_ID      # For AWS Bedrock
echo $AWS_SECRET_ACCESS_KEY
echo $AWS_REGION
```

---

## Development Notes

### Adding New Agents

1. Create new agent file in `src/agents/`
2. Define AgentDefinition with description and tools
3. Create corresponding prompt file in `src/prompts/`
4. Register in `src/orchestrator.ts`
5. Update orchestrator prompt to invoke new agent

### Customizing Analysis

Edit prompts in `src/prompts/` to:
- Change analysis criteria
- Adjust severity levels
- Modify output format
- Add new check categories

### Modifying Report Format

Edit `src/utils/report-generator.ts` to:
- Change output template
- Add new sections
- Customize styling (HTML)
- Adjust formatting (Markdown)

---

## Documentation Map

| Document | Purpose |
|----------|---------|
| **README.md** | Setup, installation, usage |
| **SUBMISSION.md** | Project structure & deliverables |
| **ARCHITECTURE.md** | System design & implementation |
| **QUICK_START.md** | This file - quick reference |

---

## Support

For detailed information:
- Architecture decisions → `ARCHITECTURE.md`
- Project structure → `SUBMISSION.md`
- Setup instructions → `README.md`
- Code implementation → Source files have inline comments

---

## Success Criteria

Your setup is correct when:

✓ `npm run build` completes without errors
✓ `npm test` passes all tests
✓ `npm run dev -- udacity cd14715-simple-todo-app 1` generates 3 report files
✓ Report files contain populated analysis data
✓ No error messages in output

---

Generated reports are available in the `reports/` directory for review.

Enjoy exploring the multi-agent code review system! 🚀
