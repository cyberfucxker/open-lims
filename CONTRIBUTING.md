# Contributing to Open LIMS

Thanks for your interest in improving Open LIMS! This guide covers how to get set up and what we expect from a pull request.

## Getting started

1. Fork the repository and clone your fork.
2. Follow the **Quickstart** in [README.md](README.md) (Node 20+, PostgreSQL 14+, `npm install`, `npm run dev`).
3. Create a branch from `main`: `git checkout -b feat/short-description`.

## Development workflow

- Backend code lives in `backend/` (Express + Prisma), the staff app in `frontend/`, the Superadmin app in `frontend/superadmin/`, and the patient website in `frontend/patient-web/`.
- Schema changes: edit `backend/prisma/schema.prisma`, then run `npm run prisma:migrate -w backend -- --name <change>` and commit the generated migration.
- Run these before opening a PR:
  ```bash
  npm run lint
  npm run typecheck
  npm test -w backend
  ```
- A pre-commit hook (husky + lint-staged) formats and lints staged files.

## Code style

- TypeScript everywhere; avoid `any`.
- Backend layering: `routes -> controllers -> services -> repositories`. Validate input at the route (express-validator / zod); keep business logic in services.
- Frontend: React function components, TanStack Query for server state, React Hook Form + Zod for forms, shadcn/ui components.
- Prefer small, focused commits. We use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`).

## Pull requests

- Describe **what** changed and **why**; link the related issue.
- Include tests for bug fixes and new behaviour where practical.
- Update docs (`README.md`, `docs/`) when behaviour or configuration changes.
- Keep PRs focused. Unrelated refactors belong in a separate PR.

## Security and sensitive data

- **Never commit secrets** (`.env` files, API keys, tokens, private keys, database dumps).
- **Never commit real patient data.** All sample and test data must be fictional.
- Report security vulnerabilities privately (see the repository's security policy or contact the maintainers) rather than opening a public issue.

## Reporting bugs / requesting features

Use the issue templates under `.github/ISSUE_TEMPLATE`. Please include reproduction steps, expected vs. actual behaviour and your environment.

## License

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
