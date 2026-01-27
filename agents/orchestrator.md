# Agent Orchestrator

> System for orchestrating sub-agents to perform specialized tasks.

## Overview

The orchestrator delegates tasks to specialized sub-agents, each with their own expertise and guidelines. Sub-agents operate independently and return structured results.

## Available Sub-Agents

| Agent | File | Purpose |
|-------|------|---------|
| UI Agent | `ui-agent.md` | Verify UI/UX compliance with design system |
| Coder Agent | `coder-agent.md` | Verify code quality, performance, and security |
| Code Reviewer | `code-reviewer-agent.md` | Review code for completeness, modularity, and maintainability |

## Task Format

Tasks are defined in JSON format in the `tasks/` directory:

```json
{
  "task_id": "unique-id",
  "agent": "ui-agent",
  "action": "verify",
  "targets": ["path/to/component.tsx"],
  "output": "tasks/results/task-id-result.md"
}
```

## Orchestration Flow

```
┌─────────────────┐
│   Orchestrator  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Load Task      │────▶│  Parse JSON  │
└────────┬────────┘     └──────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Select Agent   │────▶│  Load Rules  │
└────────┬────────┘     └──────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  Execute Task   │────▶│  Verify/Audit│
└────────┬────────┘     └──────────────┘
         │
         ▼
┌─────────────────┐
│  Output Results │
└─────────────────┘
```

## Running Tasks

```bash
# Run a specific task
npm run agent:task <task-id>

# Run all pending tasks
npm run agent:run-all

# Verify UI components
npm run agent:verify-ui

# Verify code quality
npm run agent:verify-code

# Review code (completeness, modularity, maintainability)
npm run agent:review-code
```
