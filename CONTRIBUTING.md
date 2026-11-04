# Contributing

Thank you for your interest in contributing to consumet.ts! This guide will help you get started with contributing to the project. Whether you're fixing a bug, adding a new provider, or improving documentation, we appreciate your help.

If you have any questions or suggestions, please open an [issue](https://github.com/jasanpreetn9/consumet.ts/issues/new?assignees=&labels=Bug&template=bug-report.yml) or join our [Discord server](https://discord.gg/qTPfvMxzNH).

No contribution is too small: typo fixes, docs, bug fixes and new providers are all welcome. For a small change (a typo, a fix, a new provider), open a pull request. For a big one, like a refactor, open an issue first so others can weigh in before you start.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Cloning the Repository](#cloning-the-repository)
  - [Installing Dependencies](#installing-dependencies)
  - [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Writing a Provider](#writing-a-provider)
  - [Adding a Provider](#adding-a-provider)
  - [Provider Examples](#provider-examples)
- [Updating the Codebase](#updating-the-codebase)
  - [Updating Documentation](#updating-documentation)
  - [Fixing a Provider](#fixing-a-provider)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Getting Help](#getting-help)


## Prerequisites

To contribute to consumet.ts, you should have knowledge of:

- **[Node.js](https://nodejs.org/)** - JavaScript runtime (v24.22.2 or higher recommended)
- **[TypeScript](https://www.typescriptlang.org/)** - Typed superset of JavaScript
- **Web Scraping** (for provider development):
  - [Cheerio](https://cheerio.js.org/) - jQuery-like HTML parsing
  - [Axios](https://axios-http.com/docs/example) - HTTP client
  - [CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) - For selecting HTML elements
  - [Browser DevTools](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/What_are_browser_developer_tools) - For inspecting web pages
- **Git** - Version control system

## Getting Started

### Cloning the Repository
1. [Fork the repository](https://github.com/jasanpreetn9/consumet.ts/fork)
2. Clone your fork to your local machine using the following command **(make sure to change `<your-username>` to your GitHub username)**:
```sh
git clone https://github.com/<your-username>/consumet.ts.git
```
3. Navigate to the project directory:
```sh
cd consumet.ts
```
4. Create a new branch:
```sh
git checkout -b <new-branch-name>
```

### Installing Dependencies

Install the required dependencies using yarn:

```sh
yarn install
```

### Running the Project

Build the project:
```sh
yarn build
```

Run tests:
```sh
yarn test
```

## Project Structure

The code is split into the **framework** (`src/core/`) and the **providers** (`src/providers/`). If you're adding or fixing a provider, you only need to work in `src/providers/`.

```sh
src/
├── index.ts                  # public API
├── core/                     # framework: base classes, HTTP client, types
│   ├── index.ts              # everything a provider imports comes from here
│   ├── provider.ts           # BaseProvider
│   ├── http.ts               # shared HTTP client (proxy, timeout, errors)
│   ├── errors.ts             # ProviderError
│   ├── parsers/              # MangaParser, AnimeParser, MovieParser
│   ├── types/                # IMangaInfo, ISearch, ...
│   ├── utils/
│   └── testing/              # fixtureAdapter for tests (not published)
└── providers/
    ├── index.ts              # ANIME, MANGA, MOVIES
    └── <category>/           # anime, manga, movies
        ├── index.ts          # lists the category's providers
        ├── _template/        # copy this to start a new provider
        └── <provider-name>/  # lowercase, e.g. mangadex
            ├── index.ts      # the provider class
            ├── index.test.ts # its tests
            ├── fixtures/     # saved responses its tests replay
            └── README.md     # its docs
docs/
├── guides/                   # usage guides per category
└── status.md                 # why removed providers were removed
```

## Writing a Provider

Each provider is a class that extends the parser for its category:

| Category | Parser        | Methods to implement                                               |
| -------- | ------------- | ------------------------------------------------------------------ |
| Manga    | `MangaParser` | `search`, `fetchMangaInfo`, `fetchChapterPages`                    |
| Anime    | `AnimeParser` | `search`, `fetchAnimeInfo`, `fetchEpisodeSources`, `fetchEpisodeServers` |
| Movies   | `MovieParser` | `search`, `fetchMediaInfo`, `fetchEpisodeSources`, `fetchEpisodeServers` |

Import the parser and the types you need from `src/core` (`'../../../core'` from a provider folder). You shouldn't need to open anything in `src/core/`; if you think a parser is missing something other providers would also need, open an issue.

A few rules that keep providers simple:

- **Use `this.client` for every request.** It applies the user's proxy config, a 20 second timeout, and turns failed requests into a `ProviderError` with the provider name, URL and status.
- **Don't wrap methods in `try/catch` just to rethrow.** Errors already carry the details. Only catch an error if you're going to handle it, for example by trying a fallback URL.
- **Don't create your own axios instance.** Pass per-request headers instead: `this.client.get(url, { headers: { Referer: this.baseUrl } })`.

### Adding a Provider

1. **Copy the template.** Copy `src/providers/manga/_template/` to `src/providers/<category>/<provider-name>/`.
2. **Write the provider** in `index.ts`: rename the class, set `name` and `baseUrl`, and implement the methods for its category.
3. **Register it** with one line in `src/providers/<category>/index.ts`.
4. **Write tests** in `index.test.ts`, then record fixtures against the live site:
   ```sh
   RECORD=1 yarn test src/providers/<category>/<provider-name>
   ```
   This saves every response into `fixtures/`. After that, `yarn test` replays them offline, so the tests don't break when the site is down.
5. **Document it** in `README.md`, and add it to the list in `docs/guides/<category>.md`.

### Provider Examples

For reference, check existing providers:
- Manga (HTML scraping): `src/providers/manga/mangapill/`
- Manga (JSON API): `src/providers/manga/mangadex/`

## Updating the Codebase

### Updating Documentation

1. Make your changes to the relevant documentation files: `docs/` for guides, or the provider's own `README.md`
2. Ensure all links and references are correct
3. Follow the existing documentation style
4. Test any code examples you include
5. [Commit your changes](#commit-guidelines)

### Fixing a Provider

1. Identify the issue (e.g., selector changes, API updates)
2. Update the provider code in `src/providers/<category>/<provider-name>/index.ts`
3. Re-record its fixtures so the tests use the site's current responses: `RECORD=1 yarn test src/providers/<category>/<provider-name>`
4. Update the provider's `README.md` if needed
5. [Commit your changes](#commit-guidelines)

## Testing

Before submitting your changes, make sure to test them:

```sh
# Run all tests (replays saved fixtures, no network)
yarn test

# Run one provider's tests
yarn test src/providers/manga/mangadex

# Re-record one provider's fixtures against the live site
RECORD=1 yarn test src/providers/manga/mangadex

# Type-check and build
yarn build
```

Every provider should have an `index.test.ts` next to it, with fixtures recorded.

## Code Style

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Maintain consistency with existing code
- Use async/await for asynchronous operations
- Let errors from `this.client` propagate instead of catching and rethrowing them

The project uses Prettier for formatting. Run:

```sh
yarn lint  # Format code with Prettier
```

The pre-commit hook runs `yarn lint` and `yarn build` for you.

## Commit Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This helps maintain a clean and organized commit history.

### Commit Message Format

Each commit message should have a **type** and a **description**:

```
<type>: <description>

[optional body]
```

### Commit Types

- `feat:` A new feature or enhancement
- `fix:` A bug fix
- `refactor:` Code refactoring without changing functionality
- `docs:` Documentation changes
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependency updates, etc.
- `perf:` Performance improvements
- `style:` Code style changes (formatting, missing semicolons, etc.)

### Examples

```
feat: add MangaFire provider
fix: resolve search issue in MangaPill
docs: update contributing guidelines
refactor: simplify chapter fetching logic in MangaHere
test: add tests for Mangadex provider
chore: update dependencies
```

### Tips

- Keep the description short and descriptive (50 characters or less)
- Use the imperative mood ("add" not "added" or "adds")
- Don't capitalize the first letter
- Don't end with a period

For more details, read [this guide](https://www.freecodecamp.org/news/writing-good-commit-messages-a-practical-guide/).

## Submitting a Pull Request

Once you've made your changes and committed them, you're ready to submit a pull request (PR):

1. **Push your changes** to your fork:
   ```sh
   git push origin <your-branch-name>
   ```

2. **Create a Pull Request**:
   - Go to the [consumet.ts repository](https://github.com/jasanpreetn9/consumet.ts)
   - Click "Pull Requests" → "New Pull Request"
   - Click "compare across forks"
   - Select your fork and branch
   - Click "Create Pull Request"

3. **Fill out the PR template**:
   - Provide a clear title following commit conventions
   - Describe what changes you made and why
   - Reference any related issues (e.g., "Fixes #123")
   - List any breaking changes
   - Add screenshots/examples if applicable

4. **Wait for review**:
   - Maintainers will review your PR
   - Address any requested changes
   - Once approved, your PR will be merged

### PR Best Practices

- Keep PRs focused on a single feature or fix
- Ensure all tests pass before submitting
- Update documentation if needed
- Respond to review comments promptly
- Be respectful and patient

## Getting Help

Need assistance? Here are your options:

- **Discord**: Join our [Discord server](https://discord.gg/qTPfvMxzNH) for real-time help
- **Issues**: Open an [issue](https://github.com/jasanpreetn9/consumet.ts/issues/new/choose) for bugs or feature requests
- **Discussions**: Use [GitHub Discussions](https://github.com/jasanpreetn9/consumet.ts/discussions) for questions
- **Documentation**: Check the [docs](./docs) folder for guides and examples

Thank you for contributing to consumet.ts! 🎉
