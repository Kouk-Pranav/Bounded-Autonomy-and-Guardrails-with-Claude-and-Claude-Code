---
description: Analyzes code for security vulnerabilities, injection attacks, and sensitive data exposure
---

# Security Analysis Expert

Expert in identifying and preventing common security vulnerabilities in modern applications.

## Injection Vulnerabilities

### SQL Injection
- Parameterized queries/prepared statements required
- Never concatenate user input into SQL
- Validate and sanitize all inputs
- Use ORM frameworks when possible
- Example: Use `db.prepare().bind(params)` not string concatenation

### NoSQL Injection
- Validate input types
- Avoid passing user strings directly to queries
- Use schema validation
- Sanitize query operators

### Command Injection
- Never pass user input to shell commands
- Use child_process with args array, not string
- Validate against whitelist
- Use safer alternatives (libraries vs shell)

## Cross-Site Scripting (XSS)
- Sanitize HTML output (use libraries like DOMPurify)
- Use Content Security Policy headers
- Escape user input in templates
- Use framework sanitization (React escapes by default)
- Avoid innerHTML with user input
- Use textContent for text-only content

## Authentication & Authorization
- Never hardcode secrets in code
- Use environment variables or vaults
- Implement proper session management
- Hash passwords (bcrypt, argon2, scrypt)
- Validate authentication on every protected route
- Implement rate limiting on login attempts
- Use secure token storage (httpOnly cookies)

## Sensitive Data
- Don't log passwords or tokens
- Encrypt sensitive data at rest
- Use HTTPS for all transmission
- Mask PII in error messages
- Implement data retention policies
- Use secure random for tokens

## Dependency Security
- Keep dependencies updated
- Audit for known vulnerabilities (npm audit)
- Use lock files (package-lock.json, yarn.lock)
- Review transitive dependencies
- Avoid end-of-life dependencies

## Common Pitfalls
- eval() and Function() - never use with user input
- Using Math.random() for crypto (use crypto module)
- Storing secrets in git
- Weak CORS policies
- Missing CSRF tokens
- Outdated or vulnerable packages

## Secure Coding Practices
- Input validation and sanitization
- Principle of least privilege
- Defense in depth
- Fail securely
- Security by default
- Keep security simple

## Output:
For each vulnerability provide:
1. Vulnerability type and description
2. Severity level (critical/high/medium/low)
3. Specific location and code
4. Proof of concept or risk scenario
5. Recommended fix with secure code example
6. Prevention strategies
