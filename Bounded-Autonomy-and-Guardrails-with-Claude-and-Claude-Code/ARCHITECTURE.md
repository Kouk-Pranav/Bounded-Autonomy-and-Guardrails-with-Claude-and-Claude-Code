# Multi-Agent Code Review System - Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLI Entry Point                         │
│                      (src/main.ts)                              │
│  - Parse arguments (owner, repo, prNumber)                      │
│  - Validate authentication                                      │
│  - Instantiate Orchestrator                                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Orchestrator                               │
│                 (src/orchestrator.ts)                           │
│  - Fetches PR data via GitHub MCP                               │
│  - Coordinates three specialized agents                         │
│  - Aggregates results into ReviewReport                         │
│  - Validates output against Zod schemas                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌─────────┐  ┌──────────────┐  ┌──────────────┐
   │  Code   │  │   Test       │  │ Refactoring  │
   │ Quality │  │  Coverage    │  │  Suggester   │
   │Analyzer │  │  Analyzer    │  │              │
   └────┬────┘  └──────┬───────┘  └──────┬───────┘
        │              │                 │
        └──────────────┼─────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│              Report Generator                                   │
│          (src/utils/report-generator.ts)                        │
│  - JSON (complete data)                                         │
│  - Markdown (readable format)                                   │
│  - HTML (browser renderable)                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Agent Architecture

### Three-Agent Pattern

Each agent is a specialized Claude instance with:

1. **Clear Description** - Tells the orchestrator when to invoke
2. **Targeted Prompt** - Specific instructions for analysis
3. **Appropriate Tools** - Only the tools needed for the job
4. **Validation Schema** - Zod schema for output validation

### Agent Definitions

```typescript
interface AgentDefinition {
  name: string                    // Unique identifier
  description: string             // When and why to use this agent
  model: 'inherit' | string       // 'inherit' uses parent model
  tools: Tool[]                   // Permitted tools
}
```

### Three Specialized Agents

#### 1. Code Quality Analyzer
- **Purpose**: Identify security issues, performance problems, anti-patterns
- **Tools**:
  - GitHub MCP (read files)
  - Skill tool (invoke javascript-best-practices, security-analysis)
  - Grep (search for patterns)
- **Output Schema**:
  ```typescript
  {
    file: string
    issues: {
      line: number
      severity: 'high' | 'medium' | 'low' | 'info'
      category: string
      description: string
      suggestion: string
    }[]
    overallScore: 0-100
    summary: string
  }
  ```

#### 2. Test Coverage Analyzer
- **Purpose**: Evaluate test completeness and suggest missing tests
- **Tools**:
  - GitHub MCP (read source and test files)
  - Grep (find test patterns)
- **Output Schema**:
  ```typescript
  {
    file: string
    coverage: number (0-100)
    suggestions: {
      testType: string
      description: string
      importance: 'high' | 'medium' | 'low'
      codeExample?: string
    }[]
    summary: string
  }
  ```

#### 3. Refactoring Suggester
- **Purpose**: Recommend architectural improvements and modernization
- **Tools**:
  - GitHub MCP (read files)
  - Skill tool (invoke typescript-patterns)
  - Grep (find code patterns)
- **Output Schema**:
  ```typescript
  {
    file: string
    suggestions: {
      type: 'pattern' | 'modernization' | 'design'
      description: string
      currentCode?: string
      suggestedCode?: string
      benefit: string
      priority: 'high' | 'medium' | 'low'
    }[]
    summary: string
  }
  ```

## Orchestration Flow

### Step 1: Initialization
```typescript
const orchestrator = new Orchestrator()
// Loads MCP configurations
// Registers three subagents
// Prepares structured output schema
```

### Step 2: PR Analysis Request
```typescript
const result = await orchestrator.reviewPullRequest(owner, repo, prNumber)
// Calls query() with orchestrator prompt and all tools
```

### Step 3: Orchestrator Logic
```
Orchestrator receives prompt:
1. Fetch PR data using GitHub MCP
2. Get file list and content
3. Invoke code-quality-analyzer agent
4. Invoke test-coverage-analyzer agent
5. Invoke refactoring-suggester agent
6. Aggregate all results
7. Return structured ReviewReport
```

### Step 4: Subagent Invocation
```
Main agent uses Task tool:
"Use the code-quality-analyzer agent to analyze src/file.ts"
↓
Subagent spawns with:
- Filtered file content
- Agent-specific prompt
- Code quality schema for structured output
↓
Subagent returns validated CodeQualityResult
```

### Step 5: Result Aggregation
```
Orchestrator receives all results:
{
  pullRequest: { owner, repo, number }
  fileReviews: [
    {
      file: string
      codeQuality: CodeQualityResult
      testCoverage: TestCoverageResult
      refactoring: RefactoringResult
    }
  ]
  summary: AggregatedSummary
  overallScore: 0-100
}
```

### Step 6: Report Generation
```
ReportGenerator converts ReviewReport to:
- JSON (complete data)
- Markdown (formatted for docs)
- HTML (browser view)
```

## Data Flow

```
GitHub MCP
    ↓
  PR Data
    ↓
  File List
    ↓
┌─────────────────────────────────────────┐
│   Orchestrator Prompt                   │
│   - PR context                          │
│   - File list                           │
│   - Specific instructions               │
└─────────────────────────────────────────┘
    ↓
Claude AI with Task Tool
    ├─→ Agent 1: Code Quality
    │   - Analyze security/performance
    │   - Return structured result
    │
    ├─→ Agent 2: Test Coverage
    │   - Analyze tests
    │   - Suggest missing tests
    │
    └─→ Agent 3: Refactoring
        - Suggest improvements
        - Return structured result
    ↓
ReviewReport (aggregated)
    ↓
ReportGenerator
    ├─→ JSON file
    ├─→ Markdown file
    └─→ HTML file
```

## Key Design Decisions

### 1. Explicit Subagent Invocation
Instead of relying on agent selection, the orchestrator prompt explicitly invokes agents:
```typescript
// Good: Explicit
"Use the code-quality-analyzer agent to analyze src/file.ts"

// Avoid: Implicit
"The code-quality-analyzer should analyze src/file.ts"
```

### 2. Structured Outputs
All agents return validated Zod schemas:
```typescript
const result = await orchestrator.reviewPullRequest(...)
// result is guaranteed to match ReviewReportSchema
```

### 3. Rate Limiting with Sliding Window
```
Time ──────────────────────────────→
     [────────── 60 seconds ─────────]
                   ↑ Now
     ×  ×  ×       × Request
Request history from last 60 seconds only
```

### 4. Exponential Backoff with Jitter
```
Retry 1: wait 100ms + random(0-100ms)
Retry 2: wait 200ms + random(0-100ms)
Retry 3: wait 400ms + random(0-100ms)
...
```
Prevents thundering herd when multiple clients retry.

### 5. MCP Server Configuration
```typescript
{
  type: 'stdio',                    // Process communication
  command: 'npx',                   // Run npm packages
  args: ['@anthropic-ai/github-mcp'], // Which package
  env: {                            // Environment variables
    GITHUB_TOKEN: process.env.GITHUB_TOKEN
  }
}
```

## Error Handling Strategy

### Hierarchy
```
ReviewError (Custom)
  ├─ NETWORK_ERROR
  ├─ RATE_LIMITED
  ├─ VALIDATION_ERROR
  ├─ MCP_ERROR
  ├─ TIMEOUT
  └─ RETRY_EXHAUSTED
    ↓
Wrapped with retry logic
  ├─ Exponential backoff
  ├─ Jitter
  └─ Max retries
    ↓
Timeout wrapper
  └─ Max execution time
```

### Error Recovery
```
1. Network error → Retry with backoff
2. Rate limited → Wait and retry
3. Validation error → Report issue
4. MCP error → Fail with helpful message
5. Timeout → Abort and return partial result
```

## Testing Strategy

### Unit Tests
- Schema validation (Zod)
- Error handler behavior
- Rate limiter logic
- Report generation

### Integration Tests
- Full orchestration flow
- Real PR analysis
- Multi-agent coordination
- Structured output validation

### Manual Testing
```bash
# Test with public repository
npm run dev -- udacity cd14715-simple-todo-app 1

# Verify reports generated
ls -la reports/
```

## Performance Considerations

### Parallel Execution
- Three agents run in parallel (via Task tool)
- Reduces total analysis time
- Independent agent results

### Rate Limiting
- Prevents API throttling
- Sliding window algorithm
- Tracks tokens and concurrent requests

### Caching
- MCP servers cache data locally
- Reduces API calls
- Improves performance on retries

### Timeouts
- Prevent hanging operations
- Default: 30 seconds per agent
- Configurable per use case

## Security & Best Practices

### No Hardcoded Secrets
```typescript
// Good
env: {
  GITHUB_TOKEN: process.env.GITHUB_TOKEN
}

// Bad (never do this)
env: {
  GITHUB_TOKEN: 'ghp_xxx...'
}
```

### Least Privilege Tools
Each agent gets only needed tools:
- Code Quality: GitHub MCP, Skills, Grep
- Test Coverage: GitHub MCP, Grep
- Refactoring: GitHub MCP, Skills, Grep

### Input Validation
```typescript
// CLI args validated
if (!Number.isInteger(prNumber) || prNumber <= 0) {
  throw new ReviewError('VALIDATION_ERROR', 'Invalid PR number')
}

// Environment validated
if (!ANTHROPIC_API_KEY && !AWS credentials) {
  throw new ReviewError('AUTH_ERROR', 'Missing credentials')
}
```

### Output Validation
```typescript
// All results validated before returning
const result = schema.safeParse(agentOutput)
if (!result.success) {
  throw new ReviewError('VALIDATION_ERROR', 'Invalid agent output')
}
```

## Future Improvements

1. **Caching Layer** - Cache analysis results for unchanged PRs
2. **Custom Skills** - Domain-specific analysis skills
3. **Webhook Integration** - Automatic PR analysis on push
4. **Dashboard** - Visualize reports over time
5. **Configuration** - Customizable analysis rules
6. **Multi-Model Support** - Different models for different agents
7. **Cost Tracking** - Monitor API usage and costs
