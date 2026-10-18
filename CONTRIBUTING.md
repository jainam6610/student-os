# Contributing to Student OS

First off — thank you for taking the time to contribute! 🎉

## Ways to contribute

- 🐛 **Report bugs** — open an issue with clear reproduction steps.
- 💡 **Suggest features** — open an issue describing the problem and your idea.
- 📝 **Improve docs** — typos, clarity and examples are always welcome.
- 🔧 **Send a pull request** — see the workflow below.

## Development setup

**Requirements:** Node.js 20+, pnpm, and (for Android) Android Studio + JDK 17+.

```bash
git clone https://github.com/jainam6610/student-os.git
cd student-os
pnpm install
pnpm dev
```

Before opening a PR, make sure the full gate passes:

```bash
pnpm check   # tsc --noEmit && eslint . && next build
```

## Project conventions

- **Language:** TypeScript (strict). Prefer explicit types over `any`.
- **Components:** one component per file, `kebab-case` filenames.
- **State:** add new state to `lib/store/slices/*`; follow the existing slice pattern.
- **Styling:** Tailwind utility classes + the OKLCH design tokens in `app/globals.css`.
- **Animation:** use the shared presets in `components/motion.tsx`; animate only `opacity` and `transform`.
- **Accessibility:** interactive elements should meet a 44×44px minimum touch target.

## Commit messages

This project uses **[Conventional Commits](https://www.conventionalcommits.org/)**:

```
<type>(<scope>): <short summary>

[optional body]
[optional footer]
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.

Examples:

```
feat(focus): add 25/5 pomodoro preset
fix(analytics): correct peak-hour calculation
docs: clarify Android build steps
```

## Pull request workflow

1. Fork the repo and create a branch: `git checkout -b feat/my-feature`.
2. Make your changes and keep commits focused and well-described.
3. Run `pnpm check` and fix any errors.
4. Open a PR against `main` with a clear description of *what* and *why*.
5. Link any related issues (e.g. `Closes #12`).

## Reporting security issues

Please **do not** open a public issue for security problems — see [`SECURITY.md`](./.github/SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
