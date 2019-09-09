# Sandbox Framework

This is a sandbox framework built around quickly building demos, prototypes, or web applications using [Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components) for deployment with [GitHub actions](https://github.com/features/actions) to [GitHub Pages](https://pages.github.com/).

## Requirements

- [Nodejs >= 12.10.0](https://nodejs.org/en/)
- [GitHub Actions](https://github.com/features/actions)

## New Project Setup

1. Download the [latest release](https://github.com/codewithkyle/sandbox-framework/releases)
2. Install NPM packages

```sh
# Install NPM packages
npm i
```

3. Open the `.env` file and fill in the information for your project

## Usage

```sh
# Compile the source code
npm run compile

# Compile the source code and start an HTTP server
npm run build

# Start an HTTP server
npm run preview

# Deploy to gh-pages
npm run deploy
```
