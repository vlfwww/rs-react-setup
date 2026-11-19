# Decision log — Weather Dashboard (Task 1)

**2026-11-19 — Note:** The harness integrity check reported expected configuration assets missing from this starter baseline. Continued using the surviving project guidance.

## 2026-11-19 — Saved-locations state tool

- **Did:** Chose the state tool for the saved-locations collection; no application code changed.
- **Options considered:** `useState` or `useReducer`, compared by collection update consistency, per-item fetch lifecycle, and isolated testability. Reading: `docs/hooks.md` → Basic Hooks (`useState`) and Advanced Hooks (`useReducer`).
- **Decision & justification:** `useReducer`, because it defines status update rules in one place, can reset an old error, and can account for a removed city.
- **Concepts explained:** A reducer centralizes state transitions; the selected approach remains the student's decision.
- **TODO:** Implement the selected state model after defining its actions and data types.

## 2026-11-19 — Initial dashboard architecture sketch

- **Did:** Captured the planned component responsibilities, state ownership, request flow, and error presentation; no application code changed.
- **Options considered:** The task's example component decomposition in `docs/TASK.md`; the student drafted the responsibilities and data flow.
- **Decision & justification:** Keep search input and units local to `SearchBar`; keep current-search and saved-list state above display components; let `App` orchestrate callbacks and effects; show request errors beside the affected result; reserve the Error Boundary for render failures.
- **Concepts explained:** Presentational components receive data/actions from the state-owning level; request errors and render failures need different handling.
- **TODO:** Refine reducer actions and effect dependencies during implementation.

## 2026-11-19 — Dashboard custom-hook boundary

- **Did:** Chose where dashboard orchestration will live; no application code changed.
- **Options considered:** Keep search/list orchestration in `App` and use the required `useLocalStorage`, or extract orchestration into a dashboard hook. Compared reuse and isolated testability with the risk of adding an unnecessary wrapper. Reading: `docs/hooks.md` → Custom Hooks.
- **Decision & justification:** Keep orchestration in `App` and isolate storage in `useLocalStorage`, because one screen does not require reusable orchestration and a wrapper would be unnecessary.
- **Concepts explained:** A custom hook is useful for reusable stateful logic; it need not be created for every component's internal logic.
- **TODO:** Implement `useLocalStorage` and `App` orchestration.

## 2026-11-19 — Fetch effect cleanup

- **Did:** Chose the stale-request cleanup approach for search and saved-location refetch effects; no application code changed.
- **Options considered:** Abort requests using `AbortController` or ignore results that become stale or return after unmount. Compared behavior on new searches, same-location refetches, and unmounting. Reading: `docs/hooks.md` → Basic Hooks (`useEffect`).
- **Decision & justification:** Use `AbortController`, because it immediately stops stale and unnecessary network requests on a new search, same-location refetch, or unmount.
- **Concepts explained:** Effect cleanup runs before the effect reruns and when its component unmounts.
- **TODO:** Implement request effects and verify cancellation and per-item isolation.

## 2026-11-19 — Error Boundary design

- **Did:** Chose the Error Boundary's scope, fallback, recovery, logging, and demo-trigger placement; no application code changed.
- **Options considered:** Wrap the whole dashboard or only its main area. Compared what remains usable after a render failure, fallback/recovery behavior, error logging, and test-trigger access. Reading: `docs/README.md` → React Error Boundary.
- **Decision & justification:** Wrap the main area and show a fallback with a restore button while keeping the header and its trigger outside; this preserves controls during a failure and provides a predictable recovery path. Network errors remain visible next to their corresponding result.
- **Concepts explained:** Error Boundaries catch render errors in descendants, not ordinary request failures.
- **TODO:** Implement the boundary, fallback, recovery, logging, and demo trigger.

## 2026-11-19 — Testing strategy

- **Did:** Defined the behavior and pure-logic test scope and selected network mocking; no test or application code changed.
- **Options considered:** Test user-visible interactions separately from pure reducer/hook logic; use Vitest mocks or MSW for network requests. Compared behavior-focused assertions, isolation of state logic, and mocking at the network boundary. Reading: `docs/README.md` → Vitest and React Testing Library.
- **Decision & justification:** Cover search, saved-location lifecycle/persistence, per-item refetch, and Error Boundary recovery; unit-test reducer transitions and `useLocalStorage`; use MSW because it intercepts at the network layer and exercises the data flow without mocking internal client functions.
- **Concepts explained:** RTL focuses on user-visible behavior; pure state logic and reusable hooks can also be tested independently.
- **TODO:** Add behavior and pure-logic tests alongside implementation slices.

## 2026-11-19 — Weather data source

- **Did:** Selected the source for city lookup and weather data; no application code changed.
- **Options considered:** Open-Meteo, another key-free public API, or a small local mock. Compared support for city-name search, coordinates, current weather, and units. Reading: `docs/TASK.md` → What you'll build and FAQ.
- **Decision & justification:** Use Open-Meteo because it supports city-name search, provides coordinates for saved locations, and returns current weather in the requested units.
- **Concepts explained:** The task allows key-free public APIs or a local mock and does not require a backend.
- **TODO:** Complete reducer transition tests before wiring the UI.

## 2026-11-19 — Saved-locations model and reducer

- **Did:** Added the `SavedLocation` and `SavedWeather` types, a pure reducer for collection and per-location fetch actions, and six reducer tests.
- **Options considered:** `useState` or `useReducer` for collection updates and per-item lifecycle; the `useReducer` choice and justification are recorded above.
- **Decision & justification:** Use the previously selected `useReducer` approach to centralize immutable list and status transitions.
- **Concepts explained:** Reducers should return updated state without mutating prior state; per-item updates should leave other entries unchanged.
- **TODO:** Prevent a superseded request from updating an existing location.

## 2026-11-19 — Guarding stale same-location responses

- **Did:** Chose where to reject results from superseded requests; no effect code changed.
- **Options considered:** Check request cancellation in the effect before dispatch, or carry a request identifier/generation through reducer state and actions. Compared same-location race protection, effect complexity, and isolated reducer testability. Reading: `docs/hooks.md` → Basic Hooks (`useEffect`).
- **Decision & justification:** Guard in the effect: `AbortController` stops the previous request and checking `!signal.aborted` prevents stale success or error dispatches, without adding request-only fields to `SavedLocation`.
- **Concepts explained:** `AbortController` cancellation and a signal check can stop an obsolete effect from dispatching its result.
- **TODO:** Verify both success and error paths check the abort signal before dispatch.

## 2026-11-19 — Expanding reducer test coverage

- **Did:** Added direct tests for removing a location without mutating prior state and for updating weather on successful fetch.
- **Options considered:** Added focused tests for the two reducer actions not directly covered by the initial suite.
- **Decision & justification:** No new design decision; the tests check the `REMOVE` and successful `FETCH_SUCCESS` transitions.
- **Concepts explained:** Reducer tests can assert both the resulting state and that the input state remains unchanged.
- **TODO:** Test cancellation guards at the effect layer when search and refetch effects are implemented.

## 2026-11-19 — Verifying persistence and weather client

- **Did:** Confirmed the `useLocalStorage` hook and Open-Meteo client/test slices are present.
- **Options considered:** Rechecked the completed data-layer slices before integrating them with the dashboard screen.
- **Decision & justification:** No new design decision; earlier hook, API source, reducer, and testing decisions remain in effect.
- **Concepts explained:** The client resolves `globalThis.fetch` at request time so MSW can intercept requests; MSW 3.0.7 uses `onUnhandledFrame`.
- **TODO:** Connect the reducer, persistence hook, and weather client to the dashboard UI. `App` is still the starter placeholder.
- **Validation:** Full tests passed (20/20), build passed, lint passed, and Oxfmt passed for the five changed logic files.

## 2026-11-19 — Refactoring long functions for lint

- **Did:** The student split reducer tests into behavior-focused groups and extracted Open-Meteo request helpers to reduce oversized functions.
- **Options considered:** Split large test groups and extract focused helpers while preserving current behavior.
- **Decision & justification:** No new design decision; the changes restructure existing logic to address `max-lines-per-function` warnings.
- **Concepts explained:** Test suites can be organized by behavior; request construction, transport, and response mapping can be separate responsibilities.
- **TODO:** Resolve the remaining long test callback warning and format the three changed files.
- **Validation:** Reducer and API tests passed (13/13). Oxlint now reports one remaining warning; Oxfmt check still fails on the three checked files.

**2026-11-19 — Note:** The Open-Meteo files were formatted; their seven tests and the build pass. Remaining project-wide checks still report Oxfmt issues in 21 other files, three Oxlint function-length warnings, and missing baseline harness assets.

## 2026-11-19 — Addressing lint warnings

- **Did:** Chose to address lint warnings in changed code before returning to other commit checks.
- **Options considered:** Refactor the long client factory and test-suite callbacks, or defer lint cleanup and first investigate the baseline formatting and harness failures. Compared scope to the current commit with the broader starter-baseline issues.
- **Decision & justification:** Address lint warnings first because they are in code included in the current commit.
- **Concepts explained:** `max-lines-per-function` flags oversized callbacks as well as ordinary functions; splitting test groups or extracting focused helpers can preserve test behavior.
- **TODO:** Refactor the warned client factory and test suite callbacks, and rerun lint plus the related tests.

## 2026-11-19 — Open-Meteo client and MSW tests

- **Did:** The student added the Open-Meteo geocoding/current-weather client and seven MSW tests; MSW was added as a development dependency.
- **Options considered:** Uses the previously recorded Open-Meteo data-source and MSW testing decisions.
- **Decision & justification:** No new design decision; the client supports city lookup, current weather in both unit systems, and abort signals, as planned.
- **Concepts explained:** The client resolves `globalThis.fetch` when a request runs so MSW interception can be active; MSW 3.0.7 uses `onUnhandledFrame` (not `onUnhandledRequest`) to reject unhandled requests.
- **TODO:** Address Oxfmt failures and Oxlint function-length warnings in the API files.
- **Validation:** API tests passed (7/7) and `pnpm build` passed. Oxlint reported function-length warnings; Oxfmt check did not pass.

**2026-11-19 — Note:** The Open-Meteo tests could not resolve `msw/node` because MSW is not declared as a project dependency. `pnpm add -D msw` was attempted twice but stopped with Windows access-denied errors while creating files/symlinks in `node_modules`; no tracked dependency files were changed.

**2026-11-19 — Note:** MSW was subsequently installed and added to `package.json`/`pnpm-lock.yaml`. The Open-Meteo test suite then ran, but five tests failed after reaching the real API; the client captures `fetch` before the MSW server starts, and the server option is misspelled. Stop running this suite until interception is corrected.

**2026-11-19 — Note:** Restored `pnpm-workspace.yaml` at the student's request after she noted its deletion may have been accidental during dependency installation.

## 2026-11-19 — Starting with `useLocalStorage`

- **Did:** Chose the next implementation slice; no hook code changed.
- **Options considered:** Implement and test `useLocalStorage`, build the Open-Meteo client, or create the `SearchBar` and screen skeleton. Compared dependencies, isolated testability, and whether to prioritize foundational behavior, data integration, or a visible UI scenario. Reading: `docs/hooks.md` → Custom Hooks; `docs/TASK.md` → Features 2, 3, 6, and What you'll build.
- **Decision & justification:** Start with `useLocalStorage` because it does not depend on network or UI and is easy to test in isolation for reading, writing, and malformed stored data.
- **Concepts explained:** A custom hook can isolate reusable stateful behavior and be tested independently of the screen.
- **TODO:** Define the hook's read/write contract, including behavior when stored JSON is invalid or browser storage is unavailable, before implementation.

## 2026-11-19 — `useLocalStorage` integration contract

- **Did:** Chose how persistence will integrate with the saved-locations reducer and how storage errors will be surfaced; no hook code changed.
- **Options considered:** Have the hook return a stored value/setter, or keep the reducer as the source of truth while the hook isolates loading and saving. For storage failures, return a fallback with an explicit error or throw for handling above. Compared state duplication, single-source-of-truth ownership, and explicit error behavior. Reading: `docs/hooks.md` → Custom Hooks.
- **Decision & justification:** Keep the reducer as the only state source and isolate load/save in the hook; on malformed or unavailable storage, use the initial value and explicitly report the error. This avoids duplicate state while preserving a safe fallback.
- **Concepts explained:** Persisted state needs one owner; a fallback must not silently hide storage failures.
- **TODO:** Define how the hook exposes storage errors to its caller, then implement the hook and focused tests.

## 2026-11-19 — Implementing `useLocalStorage`

- **Did:** Implemented reusable local-storage read/save behavior and added four hook tests.
- **Options considered:** Lazy initialization with React state versus rendering-time ref access; the state initializer avoids reading mutable refs during render.
- **Decision & justification:** Read persisted data once through a lazy state initializer, keep errors explicit, and use callbacks only for save and clear operations.
- **Concepts explained:** Lazy state initialization runs once when mounting the hook, while callbacks preserve stable action functions.
- **TODO:** Add tests for unavailable localStorage and split the hook test block if lint length warnings should be kept under the threshold.

## 2026-11-19 — Completing `useLocalStorage` tests

- **Did:** Chose to finish the persistence slice before moving to weather requests.
- **Options considered:** Complete hook tests now or move directly to the Open-Meteo client. Compared isolated persistence coverage against starting the network integration earlier.
- **Decision & justification:** Finish hook tests because persistence logic is already implemented and should be validated independently before network integration.
- **Concepts explained:** Storage read failures and write failures are separate paths and deserve explicit tests.
- **TODO:** Cover unavailable or failing storage reads, resolve test lint warnings, and rerun the hook checks.

## 2026-11-19 — Completing `useLocalStorage` coverage

- **Did:** Added hook tests for invalid JSON, rejected parsed shapes, unavailable storage, write failures, successful writes, and error clearing.
- **Options considered:** Kept read and write behavior in separate test groups and used a small render helper.
- **Decision & justification:** No new persistence design decision; split the tests so storage initialization and write/error behavior remain independently reviewable.
- **Concepts explained:** Mocking storage access allows read and write failures to be tested without real browser persistence.
- **TODO:** Remove remaining test-block lint length warnings and verify the full hook slice.

## 2026-11-19 — Expanding reducer test coverage

- **Did:** Added direct tests for removing a location without mutating prior state and for updating weather on successful fetch.
- **Options considered:** Added focused tests for the two reducer actions not directly covered by the initial suite.
- **Decision & justification:** No new design decision; the tests check the `REMOVE` and successful `FETCH_SUCCESS` transitions.
- **Concepts explained:** Reducer tests can assert both the resulting state and that the input state remains unchanged.
- **TODO:** Test cancellation guards at the effect layer when search and refetch effects are implemented.
