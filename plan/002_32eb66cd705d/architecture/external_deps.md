# External Dependencies — Delta 0.2.0

## No New External Dependencies

The 0.2.0 delta introduces **zero** new runtime or build dependencies. It is a
pure React-context + component addition built entirely on the existing stack.

## Existing Dependencies (unchanged)

### Runtime (peerDependencies — `package.json`)
- `react`: `^18.0.0 || ^19.0.0`
- `react-dom`: `^18.0.0 || ^19.0.0`

These are the only runtime requirements. The viewport/dev-guard use only
React primitives (`useContext`, `useEffect`, `useRef`, `useState`, `useReducer`,
`useMemo`, `useCallback`) — all stable across React 18/19.

### Build / Test (devDependencies — unchanged)
- `tsup` ^8.3.0 — bundler.
- `typescript` ^5.7.0.
- `vitest` ^2.1.0 + `@testing-library/react` ^16.0.0 + jsdom — test stack.
- `@vitejs/plugin-react`, `vite` ^6.0.0.

No DOM API beyond what the existing `display:none` hidden-container pattern
already uses (no IntersectionObserver, no portals, no new browser features).

## Optional Consumer Dependency (documented only, not required)

The shared-modal pattern (PRD §10.1 / README Advanced Usage) is illustrated with
an MUI `<Dialog>` example, but geoform does **not** depend on MUI or any UI
library. The example is illustrative; consumers use any modal/window chrome they
prefer. This is documentation, not a code dependency.

## Implication for Planning

Because there are no new dependencies, there is **no dependency-installation
task, no lockfile change, and no version-compatibility research** required. The
delta is pure source + docs work. This is reflected in the task breakdown (no
infra/dependency milestones).
