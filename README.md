# Deployment Operations Workspace

An interactive operations workspace by Harsh Mistry, connecting industrial assets, component quotations, and bounded decisions.

[Open the live workspace](https://h3zus-m.github.io/D3p1oym3nt-W0rksp4c3/)

## Explore

- Inspect a 3D microinverter assembly, select component records, and compare quotations.
- Navigate linked sourcing, distribution, robotic inspection, process-control, and academic architecture objects.
- Run browser-local sourcing, slotting, and inspection simulations with visible state and action history.
- Use the five-minute guided walkthrough or ask the deterministic operations advisor a question.
- Switch to text view or reduced motion when preferred.

## Data and scope

The experience metrics are supplied by Harsh Mistry. The Generac quotation comparison represents a $1,247,538.11 annualized sourcing opportunity, not realized savings. Individual component quotation references retain their own cost basis and do not reconcile automatically to the historical aggregate bridge.

The geometry illustrates industrial systems. It is not an employer CAD export. Actions update only the current browser session and make no external enterprise changes. The slotting travel reduction and zero-defect scan output belong to the local scenarios. The PLM-ERP ontology is academic architecture.

This is an independent demonstration inspired by public operational-software patterns. It is not affiliated with or endorsed by Palantir, Generac, or the other organizations discussed. It does not connect to Foundry or AIP. The advisor uses a local deterministic answer library, with no hosted language-model service.

## Run locally

Requires Node.js 22 or later. No package installation is required.

```sh
npm run check
npm run build
npm test
npm start -- --port=5174
```

Open `http://127.0.0.1:5174/`. To verify served assets:

```sh
npm run test:server
```

## Deployment

GitHub Actions checks the JavaScript, builds the 18-file static distribution, runs the tests, and deploys `dist/` to GitHub Pages after each push to `main`. The workflow can also be run manually from the Actions tab.

All runtime paths are relative, so the project works under the repository subpath. Three.js, its loader, the model, and Inter are bundled locally. External documentation links open separately.

To reproduce the public release locally, build from this repository. The workflow uploads only `dist/`.

## Controls

- Drag the model to orbit; scroll to adjust the camera.
- Use ISO, FRONT, and TOP for repeatable views.
- Select a CBOM row to locate its component and inspect the quotation basis.
- Use the assembly slider or Explode Assembly / Collapse Assembly toggle.
- Preview an action before running its local simulation.
- Reset scenario restores the initial state.

## Third-party licenses

Three.js: [MIT license](vendor/THREE-LICENSE.txt).

Inter: [SIL Open Font License](fonts/OFL.txt).

The included third-party licenses apply to those dependencies. No additional license is granted for the remaining project files.
