# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

## Configuration

Copy `.env.example` to `.env.local` and set `VITE_API_URL` to the HTTPS API
origin in deployed environments. The student registration flow is available at
`/register-student` and uses the public `POST /api/mobile/parent/student`
endpoint.

The API server must list the deployed browser origins in `CLIENT_URL` (or
`CORS_ORIGINS`). The registration page uses
`https://regester12s.netlify.app`, and the Find My Bus portal uses
`https://find-my-school-bus.netlify.app`. Do not set either variable to `*` in
production. Successful registration remains on the success page; it does not
grant portal access.

### Azure Static Web Apps deployment

Build from this directory with `npm ci` followed by `npm run build`, then
deploy the generated `dist` directory. Set `VITE_API_URL` and
`VITE_SUCCESS_PAGE_URL` as build-time environment variables; Vite embeds
`VITE_*` values into the JavaScript bundle.

The committed `public/staticwebapp.config.json` is copied into `dist` and
rewrites React Router routes to `index.html`, so direct requests to
`/register-student`, `/login`, and other client-side routes work on Azure.
Add the deployed Azure hostname to the API server's production `CLIENT_URL`
before testing browser requests.

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
