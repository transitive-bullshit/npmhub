import githubInjection from 'github-injection';
import App from './components/App.svelte';
import ScrollButton from './components/ScrollButton.svelte';

function isPackageJson() {
  // Example URLs:
  // https://github.com/npmhub/npmhub/blob/main/package.json
  const pathnameParts = window.location.pathname.split('/');
  return pathnameParts[3] === 'blob' && pathnameParts.pop() === 'package.json';
}

function getPackageURL() {
  if (isPackageJson()) {
    return location.origin + location.pathname;
  }

  // Example URLs:
  // https://github.com/npmhub/npmhub
  // https://github.com/eslint/eslint/tree/main/packages/eslint-config-eslint
  return document.querySelector(`
    .react-directory-filename-column :is(
      a[title="package.json"],
      [title="package.json"] a
    )
  `)?.href;
}

let app;

async function init() {
  const packageURL = getPackageURL();

  // GitHub's React navigation keeps our container around, so only re-render when the package.json changes
  const container = document.querySelector('.npmhub-container');
  if (container?.dataset.packageUrl === packageURL) {
    return;
  }

  app?.$destroy();
  app = undefined;
  container?.remove();

  if (!packageURL) {
    return;
  }

  const target = document.createElement('div');
  target.className = 'npmhub-container';
  target.dataset.packageUrl = packageURL;
  const parent = [
    '#repo-content-turbo-frame',
    '.repository-content', // Old container https://github.com/refined-github/refined-github/issues/5751
    '#repos-split-pane-content', // React layout, no Turbo frame
    'main',
  ].map(selector => document.querySelector(selector)).find(Boolean);
  if (!parent) {
    console.error('npmhub: could not find where to add the dependency list on', location.href);
    return;
  }

  parent.append(target);

  app = new App({
    props: {
      isPackageJson: isPackageJson(),
      packageURL,
    },
    target,
  });

  const position = document.querySelector(['.BorderGrid-cell [href$=\'/forks\']'])?.parentElement;

  if (position) {
    const frag = document.createDocumentFragment();

    new ScrollButton({target: frag});

    position.after(frag);
  }
}

githubInjection(init);

// GitHub's React navigation doesn't fire the Turbo/pjax events that `github-injection` listens to
document.addEventListener('soft-nav:end', init);
document.addEventListener('soft-nav:react-done', init); // Also fired on back/forward
