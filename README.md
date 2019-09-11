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

### Deploying to GitHub Pages

This project is set up to deploy to the gh-pages won push to the master branch. When deploying to gh-pages the project will need a secret named `ACCESS_TOKEN`. To generate a access token add a new [personal access token](https://github.com/settings/tokens) to your GitHub account with the "full control of private repositories" scope selected.

### Custom Domain

To set a custom domain for the project add a `CNAME` file to the projects root directory, the file will be bundled into the gh-pages deployment.

### Registering Files

Files are registered via script elements on the pages `.html` file. Use the following scripts to register your files.

```html
<!-- Web Components -->
<script defer>components = [...components, 'my-custom-component'];</script>

<!-- State Mangers -->
<script defer>modules = [...modules, 'state-manager'];</script>

<!-- Stylesheets -->
<script defer>stylesheets = [...stylesheets, 'my-custom-stylesheet'];</script>
```

### Building Pages

All HTML files that are created within the `src/` directory will be injected into the `shell.html` file and placed in the `build/` directory when compiled. The directory structures created within the `src/` directory will be recreated in the `build/` directory when compiling the `.html` files. The `.html` file **SHOULD NOT** be valid HTML documents since they will be injected into the `shell.html` file when compiled.

**Example**

I want a `/app` route for my project. In the `src/` directory I would create a `app/` directory and place an `index.html` file within it. Then, after running the `npm run build` command, my new `/app` route will be available when previewing the site.

### State Managers

When creating a global state manager it's recommended that you place the source code in the `web_modules/` directory. At then end of a state managers file the manager should instantiate itself onto the `window` object. State managers are loaded before web components and when mounted onto the `window` can be called by all components whenever required.

**Example**

```javascript
class StateManager
{
    constructor()
    {
        console.log('Hello world!');
    }
}

window.stateManager = new StateManager();
```

### Web Components

Web components can exist anywhere within the `src/` directory. It's recommended that global components exist directly within the `src/` directory while all the other components are placed relative to the pages that they'll be used on.

**Example**

I want to create a global outline input component. I'll start by creating a `outline-input-component/` directory in the `src/` directory. Then I'll create a `outline-input-component.ts` file, a `outline-input-component.scss`, and a `outline-input-component.example` file within the `outline-input-component/` directory. *Note:* the `.example` file will not be used, it just exist as an example of how the web components HTML should be structured. Below is an example of how to define web components, you can read more about web components [here](https://developer.mozilla.org/en-US/docs/Web/Web_Components).

```javascript
class OutlineInputComponent extends HTMLElement
{
    connectedCallback()
    {
        this.addEventListener('click', () => { console.log('Outline Input Component was clicked'); });
    }
}

customElements.define('outline-input-component', OutlineInputComponent);
```