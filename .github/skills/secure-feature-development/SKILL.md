---
name: secure-feature-development
description: "Plan and implement security-conscious application features. Use for every code change involving login, signup, sessions, JWTs, roles, protected routes, REST or GraphQL APIs, CORS, rate limiting, database access, user input, forms, uploads, environment variables, secrets, dependencies, or deployment. Also use when reviewing security, preparing a commit, or deploying."
argument-hint: "Describe the feature, affected app or service, and expected behavior."
---

# Secure Feature Development

Turn an ambiguous feature request into a small, secure, buildable plan before implementation. Use the existing stack and project conventions. For new features, pages, apps, or projects, stop after presenting the plan and wait for approval unless the user explicitly asks to implement immediately.

## Procedure

### 1. Restate and scope the request

Write one sentence describing the desired outcome. If the goal cannot be stated clearly, ask one focused clarifying question before planning. Define done with 3-5 observable acceptance criteria in the form: "When the user does X, Y happens."

Identify:

- The affected app, service, page, component, route, or symbol.
- The smallest UI-to-API-to-database path needed.
- What is explicitly not being built now.

Before editing, inspect the owning implementation and one nearby test or call site. State one local hypothesis about the behavior and one cheap check that could disconfirm it.

Present this plan before coding:

```text
Goal: ...
Done when:
- [ ] ...
Files to create/change: ...
Data model: ...
Risks / security notes: ...
Steps:
1. (smallest working version)
2. ...
Not now: ...
```

For a new feature or vague request, wait for approval after this output. For a narrow bug fix or an explicit request to implement, continue to the next step after the local hypothesis and discriminating check are identified.

### 2. Identify risk and trust boundaries

Flag whether the change touches authentication, authorization, personal data, payments, file uploads, deletion, secrets, external services, or database access. Treat every client-provided ID, role, ownership field, and permission flag as untrusted.

For auth or API work, use the additional controls in the [auth hardening checklist](#auth-and-api-hardening). For every change, use the [security checklist](#security-checklist). Apply these rules even when the user does not explicitly mention security.

### 3. Design the walking skeleton

List the smallest set of files, routes, components, services, models, schemas, and tests. Prefer existing providers and helpers over new abstractions. Use a proven authentication provider where possible; do not write cryptography or password storage yourself. Prefer the stack already in the repository and do not introduce a new framework without a clear need.

Choose a sequence where each step can run or be tested independently:

1. Establish or adjust the contract and validation.
2. Implement the server-side behavior and authorization.
3. Connect the client workflow and loading/error states.
4. Add focused abuse-case and behavior tests.

Build the thinnest end-to-end version first: client workflow to API contract to persistence. Cut optional scope aggressively and name deferred work instead of silently expanding the feature.

### 4. Implement narrowly

Make the smallest edit that tests the hypothesis. Preserve existing public APIs and local style unless the contract requires a change. Validate request bodies, parameters, and query values on the server with a schema, including lengths, formats, enums, and pagination limits.

For state changes, use `POST`, `PUT`, or `DELETE` as appropriate. Return only required fields and generic client-facing errors; keep sensitive diagnostic details server-side. Never add secrets to source, comments, logs, frontend bundles, or chat. If a secret was previously committed, tell the user to rotate it; deleting the file is not sufficient.

After the first substantive edit, immediately run the cheapest focused executable check available. If it fails, repair the same slice and rerun it before expanding the change.

### 5. Verify and review

Run the narrow tests, typecheck, lint, or build for the touched slice, followed by the broader available check when risk warrants it. Review the diff for unrelated changes and run the [completion checklist](#completion-checklist).

## Auth and API Hardening

- Store passwords only with bcrypt cost 12+ or Argon2; never plaintext, MD5, or SHA-1.
- Prefer HttpOnly, Secure, SameSite cookies for sessions. Do not store auth tokens in `localStorage`.
- Use short-lived JWTs with refresh tokens, verify signature and `exp`, reject `alg: none`, and read signing secrets from environment configuration.
- Make password-reset tokens single-use and expiring; return the same response whether an account exists or not.
- Rate-limit login, signup, and reset endpoints and apply brute-force protection, using a maintained package when one is needed.
- Authenticate and authorize on the server for every protected request. Default deny.
- Scope record queries by the authenticated owner or permitted tenant to prevent IDOR. Never trust client-sent roles or `isAdmin` values.
- Restrict CORS to real allowed origins; never combine `*` with credentials.
- Validate bodies, parameters, and queries with a schema. Limit request bodies and pagination, with `limit` no greater than 100 unless there is a documented reason.
- Use parameterized queries or an ORM. Enable RLS or equivalent database rules for every exposed table.
- Use `401` for missing or invalid authentication, `403` for insufficient permission, `404` when appropriate for inaccessible records, `429` for rate limits, and avoid leaking whether protected records exist.
- Add CSRF protection when cookie-based authentication is used.

Required auth tests:

1. An unauthenticated request receives `401`.
2. User A cannot access User B's data and receives `403` or an indistinguishable `404`.
3. A user with the wrong role receives `403`.
4. An expired or tampered token receives `401`.
5. Repeated login, signup, or reset attempts trigger the configured rate limit.

## Security Checklist

- [ ] No secrets, tokens, passwords, connection strings, or private keys are present in the diff.
- [ ] Secrets use environment variables; `.env` is ignored and a fake `.env.example` is used when configuration is needed.
- [ ] Frontend bundles contain no secrets; public environment variables are treated as public.
- [ ] All untrusted input is validated server-side with type, length, format, and allowed-value checks.
- [ ] SQL uses parameterization or an ORM; no string-built SQL is introduced.
- [ ] SQL, HTML, shell commands, redirects, file paths, and uploads cannot be controlled through unchecked user input.
- [ ] User HTML is sanitized or avoided; do not use `dangerouslySetInnerHTML`, `innerHTML`, or `eval` with user data.
- [ ] User input is never passed unchecked to process execution or operating-system commands.
- [ ] Uploads enforce size, extension, and MIME checks, use generated names, and stay outside the web root.
- [ ] Errors are generic to clients and logs do not contain passwords, tokens, full payment data, or unnecessary personal data.
- [ ] New dependencies are necessary, maintained, correctly named, audited when applicable, and included in the lockfile.
- [ ] Security headers, HTTPS, debug settings, and least-privilege deployment configuration are appropriate for the environment.

## Completion Checklist

- [ ] Acceptance criteria pass.
- [ ] Focused executable validation ran after the first edit and after final changes.
- [ ] Relevant abuse-case tests exist or their absence is explicitly reported.
- [ ] Typecheck, lint, build, or broader tests were run when available and failures are reported accurately.
- [ ] The diff contains only task-related changes.
- [ ] Documentation or environment examples were updated when the public contract or setup changed.
- [ ] Before commit or deployment, the security checklist was explicitly reviewed and high or critical dependency issues were addressed or reported.