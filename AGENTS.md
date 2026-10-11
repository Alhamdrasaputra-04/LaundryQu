# Project AI Agent Configuration: ECC & Superpowers

This project integrates two advanced agent frameworks:
1. **Superpowers** (`https://github.com/obra/superpowers`): Core skills library for Test-Driven Development (TDD), systematic debugging, planning, and subagent-driven development.
2. **ECC (Enterprise/Everything Claude Code)** (`https://github.com/affaan-m/ECC`): Comprehensive agentic engineering toolkit featuring 70+ specialized agents, multi-language coding standards, and verification loops.

---

## 📁 Workspace Directory Structure

* **`agents/ECC/`**: Full upstream repository source and tools for ECC.
* **`agents/superpowers/`**: Full upstream repository source and documentation for Superpowers.
* **`.agents/`**: Active Antigravity workspace integration:
  * **`.agents/skills/`**: Active on-demand skills (including `using-superpowers`, `brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `systematic-debugging`, `test-driven-development`, `verification-before-completion`, `tdd-workflow`, etc.).
  * **`.agents/agents/`**: Specialized agent definitions (e.g. `code-reviewer`, `architect`, `build-error-resolver`, `flutter-reviewer`).
  * **`.agents/rules/`**: Contextual coding guidelines and standards.
  * **`.agents/workflows/`**: Interactive workflows.

---

## ⚡ Core Methodology (Superpowers & ECC)

When executing engineering tasks on this codebase:
1. **Understand & Clarify**: Do not rush to write code. Brainstorm with the user, clarify intent, and write a clear, concise plan (`writing-plans`).
2. **Test-Driven Development (TDD)**: Write minimal failing tests before implementing features. Keep solutions lean and DRY.
3. **Systematic Debugging**: When errors occur, formulate hypotheses, test them systematically, and trace root causes before modifying code.
4. **Verification**: Always verify all changes thoroughly before marking any task as complete.
