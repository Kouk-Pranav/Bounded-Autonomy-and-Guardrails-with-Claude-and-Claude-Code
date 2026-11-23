---
description: Expert in TypeScript design patterns, type safety, and architectural improvements
---

# TypeScript Design Patterns & Architecture

Expert in modern TypeScript patterns, type safety improvements, and architectural best practices.

## Type Safety Improvements

### Generic Types
- Use generics for reusable, type-safe code
- Constrain generics with extends keyword
- Avoid any type (use unknown instead)
- Leverage conditional types
- Use keyof and typeof operators

### Advanced Types
- Union types for specific options
- Intersection types for combining types
- Discriminated unions for type safety
- Utility types (Pick, Omit, Partial, Required)
- Readonly modifiers for immutability

### Type Inference
- Let TypeScript infer types when obvious
- Explicit return types for public APIs
- Use as const for literal types
- Narrow types with guards (typeof, instanceof)
- Use never type for exhaustiveness checks

## Design Patterns

### Factory Pattern
- Encapsulate object creation
- Hide implementation details
- Example: Create class instances based on config
- Improves code maintainability

### Strategy Pattern
- Encapsulate algorithms
- Switch algorithms at runtime
- Use interfaces for strategies
- Reduces conditional complexity

### Dependency Injection
- Inject dependencies via constructor
- Use interfaces for contracts
- Improves testability and flexibility
- Avoid hardcoded dependencies

### Builder Pattern
- Complex object construction
- Fluent API for readability
- Validation at build time
- Example: Configuration builders

### Observer/Pub-Sub Pattern
- Event-driven architecture
- Decouple components
- Use typed event emitters
- Handle subscriptions properly

## Architectural Improvements

### Separation of Concerns
- Split into logical modules
- Each class has single responsibility
- Reduce tight coupling
- Use interfaces/abstract classes

### Composition over Inheritance
- Prefer composition for code reuse
- Inheritance for contracts
- Mixins for shared behavior
- Example: Combining traits

### Error Handling
- Use Result type (Success | Failure)
- Custom error types with discriminated unions
- Proper error propagation
- Avoid throwing in async code

### Async Patterns
- Proper Promise handling
- Use async/await over .then()
- Error boundaries for async operations
- Handle cancellation (AbortController)

## Common Refactorings

### Extract Method
- Break long functions into smaller ones
- Improve readability and reusability
- Add proper type signatures
- Each method should do one thing

### Extract Class
- Split responsibilities
- Create new classes for specific concerns
- Use dependency injection
- Improves testability

### Remove Dead Code
- Unused variables and functions
- Unreachable code paths
- Unused imports
- Improves clarity and reduces bundle size

### Simplify Conditionals
- Use early returns
- Replace switch with polymorphism
- Use ternary for simple cases
- Avoid nested conditions

## Modern TypeScript Features

### Classes
- Use private/protected/public access modifiers
- Accessors for computed properties
- Static methods for utility functions
- Constructor parameter shorthand

### Enums vs Const Objects
- Use as const object over enums
- Enums only for specific cases
- More tree-shakable const objects
- Better for type inference

### Decorators
- Metadata and annotations
- Logging and timing decorators
- Property validation
- Use sparingly

### Namespace and Modules
- Prefer ES modules over namespace
- Clear exports for public API
- Internal only for private code
- Organize logically

## Output:
For each pattern or refactoring opportunity provide:
1. Pattern or refactoring name
2. Current code showing the issue
3. Why this pattern/refactoring is beneficial
4. Refactored code with TypeScript best practices
5. Benefits gained (testability, readability, performance)
6. When to use this approach
