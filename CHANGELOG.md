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

## 2026-11-19 — Completing SearchBar behavior tests

- **Did:** Added a controlled `SearchBar` with unit selection and callback-based submission; updated its tests to use `userEvent` and narrower accessible-role queries.
- **Options considered:** Build a standalone SearchBar or first connect saved-location state to `App`; compared dependencies, isolated testability, and visible progress.
- **Decision & justification:** Start with SearchBar because it does not depend on app-level state or persistence and is independently testable.
- **Concepts explained:** Role-based queries target the intended accessible control; `userEvent` models user interactions more closely than low-level event dispatch.
- **TODO:** Connect SearchBar to app-level search state and the weather client.
- **Validation:** Full suite passed (24/24), build passed, SearchBar lint and formatting checks passed.

## 2026-11-19 — Verifying SearchBar tests

- **Did:** The student narrowed the city-field query and grouped the SearchBar tests into city submission and unit-selection scenarios.
- **Options considered:** A standalone SearchBar or first wiring saved-location state; the chosen SearchBar-first option and rationale are recorded in the student's prior decision.
- **Decision & justification:** Continue with the SearchBar slice because it is independent of app state and persistence and can be tested on its own.
- **Concepts explained:** A role-and-exact-name query avoids ambiguity when both a form and its input contain similar accessible names.
- **TODO:** Use the planned `userEvent` interactions, format `SearchBar.tsx`, and reduce its remaining function-length warning.
- **Validation:** SearchBar tests passed (4/4). Oxlint reports a component function-length warning; Oxfmt check fails for `SearchBar.tsx`.

## 2026-11-19 — Implementing SearchBar

- **Did:** The student added a controlled city-search form with unit selection and four behavior tests.
- **Options considered:** Build a standalone SearchBar or first connect the saved-location reducer and persistence hook to `App`. Compared dependencies, isolated testability, and visible progress.
- **Decision & justification:** Start with SearchBar because it does not depend on app-level state or persistence and is independently testable.
- **Concepts explained:** The input label and the form's accessible name both contain “City”, so a partial label query can match both elements.
- **TODO:** Narrow the ambiguous test selector; align interactions with the chosen RTL/userEvent testing strategy; resolve formatting and lint warnings.
- **Validation:** All four tests currently fail because `getByLabelText(/city/i)` matches both the input label and form name. Oxlint reports test/component warnings; Oxfmt check fails.

## 2026-11-19 — Starting the SearchBar slice

- **Did:** Chose the next implementation slice; no UI code changed.
- **Options considered:** Implement a standalone controlled `SearchBar` with unit selection and submit behavior, or connect the saved-location reducer and persistence hook in `App`. Compared dependencies, isolated testability, and visible progress. Reading: `docs/TASK.md` → Feature 2; `docs/hooks.md` → `useState`.
- **Decision & justification:** Start with `SearchBar` because it does not depend on app-level state or persistence, gives a visible interactive element, and can be tested independently.
- **Concepts explained:** A controlled input keeps its displayed value synchronized with React state; a submit callback lets the parent own search orchestration.
- **TODO:** Implement `SearchBar` and behavior-focused tests for input, units selection, and form submission.

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

## 2026-11-19 — App search orchestration

- **Did:** Connected SearchBar to the Open-Meteo city-search client through App and added an integration hook and results list.
- **Options considered:** Keep orchestration in `useCitySearch` or move it into `App`; compared reuse, effect/state cohesion, and isolated testability. Reading: `docs/hooks.md` → Custom Hooks and Basic Hooks (`useEffect`).
- **Decision & justification:** Move orchestration to `App` because the search logic is not reused.
- **Concepts explained:** The submit handler records a search intent; the effect performs the request and owns cleanup.
- **TODO:** Move search orchestration into `App` and verify the search error announcement.

## 2026-11-19 — Moving search orchestration to App

- **Did:** Moved city-search state and request orchestration into `App`; the pending query is handled by a `useEffect` with `AbortController` cleanup and stale-result protection.
- **Options considered:** Keep search orchestration in `useCitySearch` or move it into `App`; compared reuse, effect/state cohesion, and isolated testability. Reading: `docs/hooks.md` → Custom Hooks and Basic Hooks (`useEffect`).
- **Decision & justification:** Move orchestration to `App` because the search logic is not reused.
- **Concepts explained:** Effects own request execution and cleanup; event handlers record the user's search intent.
- **TODO:** Align the App error assertion with the chosen results announcement semantics.
- **Validation:** App integration tests passed (2/2) and build passed; lint and formatting findings remained.

## 2026-11-19 — Search error announcement

- **Did:** Chose the accessibility behavior for city-search failures; no code changed.
- **Options considered:** Render the message as an `output` within results or as an assertive `alert`; compared contextual announcement with interruption. Reading: `docs/TASK.md` → Feature 3 and `docs/README.md` → React Testing Library.
- **Decision & justification:** Keep the `output` announcement so users hear a clear search failure in the results area without interrupting their current context, and can retry.
- **Concepts explained:** Tests should assert the chosen user-facing accessible output.
- **TODO:** Update the App error test to assert the `output` message.

## 2026-11-19 — Verifying App search error output

- **Did:** Updated the error-flow test to assert the visible search error message rendered in the results area.
- **Options considered:** Keep the error as an `output` within results or announce it as an assertive `alert`; compared contextual announcement with interruption. Reading: `docs/TASK.md` → Feature 3 and `docs/README.md` → React Testing Library.
- **Decision & justification:** Keep the `output` so users can understand and retry the search without interrupting their current context.
- **Concepts explained:** Tests should assert the selected accessible output and its user-visible text.
- **TODO:** Continue implementing the selected-city forecast flow.
- **Validation:** App tests passed (2/2); lint and formatting checks passed for the App test at that point.

## 2026-11-19 — Choosing a city before weather lookup

- **Did:** Chose to let the user select a city from geocoding matches before requesting its forecast; implementation followed in the next step.
- **Options considered:** Automatically use the first geocoding result or show matches and request weather after selection. Weighed ambiguous city names, number of actions, and user control. Reading: `docs/TASK.md` → Features 3 and 6.
- **Decision & justification:** “Choosing from geocoding results gives users precise control when city names are ambiguous, with just one click before the weather loads.”
- **Concepts explained:** Geocoding resolves a city query into candidate locations; a forecast request needs the chosen location's coordinates.
- **TODO:** Implement the explicit city-selection flow.

## 2026-11-19 — Planning the selected-city forecast flow

- **Did:** Planned the data flow from selecting a geocoding match to displaying its forecast; implementation followed in the next step.
- **Options considered:** Use the previously chosen explicit city selection and continue the existing App-level `useEffect` request orchestration with cancellation. Reading: `docs/TASK.md` → Features 3 and 6; `docs/hooks.md` → Basic Hooks (`useEffect`).
- **Decision & justification:** Pass the selected match's identifying details and coordinates with the current units to App; let its effect request the forecast and cancel/ignore stale work when selection changes or the component unmounts.
- **Concepts explained:** The forecast is tied to a location's coordinates and the selected units; effect cleanup prevents obsolete requests from winning.
- **TODO:** Implement the candidate-selection callback and connect it to forecast states.

## 2026-11-19 — Testing city selection and forecast

- **Did:** Chose an integration test for the selection-to-forecast user flow; implementation followed in the next step.
- **Options considered:** Test the candidate callback alone or test selection through request and rendered forecast with the network mocked. Weighed component-boundary behavior, full user flow, and network isolation. Reading: `docs/README.md` → Vitest and React Testing Library.
- **Decision & justification:** “It verifies the real user flow from click through effect-driven request to rendered result or error, while isolating the network without mocking internal component functions.”
- **Concepts explained:** Mocking the network allows assertions on the user-visible flow without relying on real requests or internal component functions.
- **TODO:** Verify choosing among multiple city matches and the selected units in the integration test.

## 2026-11-19 — Implementing selected-city weather lookup

- **Did:** Added candidate selection, an App-level forecast effect with abort/stale-result guards, and current-weather loading, success, and error UI.
- **Options considered:** Follow the previously selected explicit city choice, App-level orchestration, effect-based requests with cleanup, and MSW integration testing.
- **Decision & justification:** The selected city's coordinates and search units drive the forecast request; effect cleanup cancels work when the selected request changes or the app unmounts.
- **Concepts explained:** Geocoding candidates are distinct locations; loading state is derived from the selected request until its matching result settles.
- **TODO:** Add an integration scenario with multiple matches, select a non-first result, and assert its coordinates and units are used.
- **Validation:** App integration tests passed (4/4); targeted Oxlint and Oxfmt checks passed; `pnpm build` passed.

## 2026-11-19 — Verifying non-first city selection

- **Did:** Added an integration scenario with multiple geocoding matches and selected the non-first city; its forecast coordinates are asserted.
- **Options considered:** Extended the existing MSW user-flow test rather than mocking internal component functions.
- **Decision & justification:** Keep testing the visible selection-to-forecast flow because it verifies the chosen city is the one requested.
- **Concepts explained:** The units are captured when the search is submitted, so changing the selector after submission does not alter the already displayed results' units.
- **TODO:** Set imperial before submitting the query and assert the exact Fahrenheit request parameter and visible unit; the current truthy check does not distinguish Celsius from Fahrenheit.
- **Validation:** App integration tests passed (5/5); targeted Oxlint and Oxfmt checks passed.

## 2026-11-19 — Verifying imperial forecast units

- **Did:** Updated the multi-candidate integration test to choose imperial before submitting the search and assert the Fahrenheit request parameter and displayed unit.
- **Options considered:** Kept the units assertion in the existing end-to-end city-selection scenario.
- **Decision & justification:** The same user flow now verifies both that the non-first city is selected and that the units chosen at submission reach the forecast request.
- **Concepts explained:** The search captures its units at submission; later changes do not retroactively alter that request.
- **TODO:** None for this test scenario.
- **Validation:** App integration tests passed (5/5); targeted Oxlint and Oxfmt checks passed.

## 2026-11-19 — Choosing saved-location identity

- **Did:** Chose the uniqueness key for saved locations; implementation has not started.
- **Options considered:** Keep one entry per city and ignore repeats, keep one entry and update it, or treat a city-and-units pair as unique. Weighed per-entry units, duplicate cards, and independent refetch behavior. Reading: `docs/TASK.md` → Feature 4.
- **Decision & justification:** “Because units are set per entry, this lets us store the same city in both metric and imperial and refetch each card independently.”
- **Concepts explained:** The saved-location identity key determines whether reducer add/refetch operations address one or several entries for the same city.
- **TODO:** Decide how cached `weather.tempC` stays Celsius when the current result was fetched in imperial units, then integrate the saved list and persistence.

## 2026-11-19 — Choosing cached weather units

- **Did:** Chose how saved weather remains consistent with the fixed `weather.tempC` field; implementation has not started.
- **Options considered:** Request each saved forecast in its selected units and normalize to Celsius at the cache boundary, or always request metric for saved forecasts and use each entry's units for display. Weighed the `tempC` contract, request-unit behavior, and display consistency. Reading: `docs/TASK.md` → Feature 4 and `src/api/openMeteo.ts` → `CurrentWeatherData`.
- **Decision & justification:** “We preserve the exact meaning of tempC, verify that the request uses the selected units, and display the temperature in the card's expected units.”
- **Concepts explained:** A fixed Celsius cache field must not contain a Fahrenheit value; the view can still present the saved location's selected units.
- **TODO:** Integrate the saved-location reducer and persistence, then add/render/remove/refetch saved entries and cover the flow with MSW tests.

## 2026-11-19 — Reviewing saved-state persistence integration

- **Did:** Connected reducer state to the `useLocalStorage` hook and added App tests for restoring a saved entry, persisting an added location, and surfacing a storage write error.
- **Options considered:** Continued with the previously selected reducer as the state owner and `useLocalStorage` as the persistence boundary.
- **Decision & justification:** No new design decision; the previously selected reducer and hook responsibilities remain unchanged.
- **Concepts explained:** A storage write effect can persist reducer updates, while read and write failures need separate verification.
- **TODO:** Test a `getItem` failure while `setItem` remains available, and ensure the read error stays visible after the initial fallback state is persisted.
- **Validation:** App tests passed (8/8); targeted Oxlint and Oxfmt checks passed; `pnpm build` passed.

## 2026-11-19 — Verifying storage read-error persistence

- **Did:** Added an App test where `getItem` fails while `setItem` succeeds, and verified the storage error remains visible after the fallback state is written.
- **Options considered:** No new design choice; verified the previously selected explicit storage-error reporting behavior.
- **Decision & justification:** Unresolved (not the student's call) — this turn verified the existing behavior; no separate design choice was discussed.
- **Concepts explained:** A successful fallback write must not erase the fact that the initial saved data could not be read.
- **TODO:** Continue the saved-locations feature with per-item refetch and its effect cleanup tests.
- **Validation:** App tests passed (9/9); targeted Oxlint and Oxfmt checks passed; `pnpm build` passed.

## 2026-11-21 — Saved-location refetch effect placement

- **Did:** Chose where the per-location refetch effect will be orchestrated; no application code changed.
- **Options considered:** Centralize the request effect in the dashboard hook, triggered by a refetch intent, or place it in a custom hook for each list item. Compared reducer state consistency, separation of presentation and network work, and cancellation of stale requests. Reading: `docs/TASK.md` → Features 4 and 6; `docs/hooks.md` → Basic Hooks (`useEffect`) and Custom Hooks.
- **Decision & justification:** Centralized useEffect в dashboard hook по намерению обновить конкретный id держит единый источник истины в savedLocationsReducer для переходов idle - loading - success/error, оставляя список презентационным и вынося сеть с AbortController в слой хука. При этом хук на элемент списка легко смешивает жизненный цикл карточки с запросами и усложняет координацию отмены устаревших ответов при повторном Refetch, удалении локации или размонтировании.
- **Concepts explained:** The effect's placement is separate from the reducer's ownership of item status transitions; cleanup must cover superseded requests, removed locations, and unmounting.
- **TODO:** Implement the refetch intent and per-item effect lifecycle, then add MSW tests.

## 2026-11-21 — Planning per-location refetch lifecycle

- **Did:** Sketched the click-to-effect flow and chose the stale-response guard; no application code changed.
- **Options considered:** Use `AbortController` and check cancellation before dispatch, or add a per-request token as an additional guard. Compared repeat-refetch behavior, protection against late results, and the extra state and test complexity. Reading: `docs/hooks.md` → Basic Hooks (`useEffect`).
- **Decision & justification:** Оставить AbortController и проверку отмены: cleanup эффекта вызывает controller.abort() и выставляет флаг отмены, а перед dispatch проверяется отмена (!cancelled && !signal.aborted), без лишнего состояния и усложнения тестов.
- **Concepts explained:** Cleanup and the pre-dispatch cancellation guard prevent superseded requests from updating reducer state.
- **TODO:** Add the refetch callback/button, then connect it to reducer transitions and the effect; cover success, failure, repeated refetch, removal, and cleanup with tests.

## 2026-11-21 — Adding the saved-location refetch trigger

- **Did:** Added an `onRefetch(id)` callback and button to the saved-locations list, plus a focused test that verifies the clicked location id. Parent integration is not complete.
- **Options considered:** No new design decision; this follows the previously logged centralized dashboard-effect approach.
- **Decision & justification:** Existing choices remain unchanged; the component test checks that the correct saved entry is identified by the user's action.
- **Concepts explained:** The UI test verifies the callback's observable behavior without coupling to the eventual fetch implementation.
- **TODO:** Connect `onRefetch` through `App` and the dashboard hook; resolve duplicate section markup, preserve the displayed units, and address formatting/lint feedback.
- **Validation:** The new component test passes (1/1). `pnpm build` fails because `App` does not yet pass `onRefetch`; `pnpm format` reports both changed files, and Oxlint warns that `SavedLocationsList` exceeds the function-length limit.

## 2026-11-21 — Choosing saved-list markup ownership

- **Did:** Chose which component owns the saved-locations section and heading; no application code changed.
- **Options considered:** Keep the section and heading in `App` with `SavedLocationsList` rendering the list and empty state, or move them into `SavedLocationsList` and remove the parent wrapper. Compared page structure ownership with list-component responsibility.
- **Decision & justification:** App отвечает за структуру страницы и секцию сохранённых локаций, тогда как SavedLocationsList отвечает только за рендер списка, пустого состояния и действий над карточкой.
- **Concepts explained:** Keeping page-level structure in one place avoids nested duplicate landmarks and headings.
- **TODO:** Apply this choice, restore the per-location units label, connect the refetch callback through `App`, then rerun the focused test, lint, formatting, and build.

## 2026-11-21 — Checking saved-list callback wiring

- **Did:** Removed the duplicate section wrapper, restored the units label, split the list item into its own component, and passed an `onRefetch` prop from `App`. The prop currently receives an empty callback, so refetch behavior is not connected.
- **Options considered:** No new design decision; the page/list markup follows the previously recorded choice, while dashboard refetch orchestration remains pending.
- **Decision & justification:** Existing choices remain unchanged; an empty callback satisfies the prop type but does not implement the user's refetch action.
- **Concepts explained:** Type correctness alone does not ensure a callback has observable behavior.
- **TODO:** Replace the empty callback with the dashboard-hook handler and test the integrated refetch flow; format `App.tsx` and `SavedLocationsList.test.tsx`.
- **Validation:** Full tests passed (33/33), Oxlint passed, and the production build passed. Oxfmt reports formatting issues in `App.tsx` and `SavedLocationsList.test.tsx`.

## 2026-11-21 — Wiring saved-location refetch

- **Did:** Connected the list callback through `App` to the dashboard hook and added a centralized refetch effect that dispatches reducer lifecycle actions.
- **Options considered:** No new design decision; followed the previously recorded centralized effect and cancellation choices.
- **Decision & justification:** Existing choices remain unchanged; this is the first implementation of the per-location refetch flow.
- **Concepts explained:** The effect now starts and settles a reducer-managed request, but the result mapping and cancellation behavior still need verification.
- **TODO:** Map the typed weather response into the Celsius cache correctly; keep concurrent locations independent and cancel requests when their item is removed; add tests that exercise refetch success, failure, superseding requests, and removal.
- **Validation:** All 33 current tests passed, Oxlint and Oxfmt passed, and the production build passed. Current tests do not exercise the refetch effect.

## 2026-11-21 — Verifying saved-location refetch

- **Did:** Corrected the saved-weather mapping, tracked active requests by location, added removal/unmount cleanup, and added App-level tests for success, failure, imperial conversion, concurrent requests, and removal.
- **Options considered:** No new design decision; the implementation follows the previously logged centralized effect and per-location cancellation choices.
- **Decision & justification:** Existing choices remain unchanged; the latest tests exercise the real user flow through MSW.
- **Concepts explained:** Independent request controllers prevent refreshing one location from cancelling another; saved temperatures are normalized to Celsius before display conversion.
- **TODO:** Add focused coverage for superseding a request for the same location and unmount cleanup; consider reusing the existing Fahrenheit conversion helper and making the active-map type explicit.
- **Validation:** All 37 tests passed; Oxlint, Oxfmt, TypeScript, and the production build passed.

## 2026-11-21 — Choosing repeated refetch behavior

- **Did:** Chose the user-visible behavior for clicking Refetch again while that location is loading; no application code changed.
- **Options considered:** Allow another click to cancel and replace the active request, or disable the button until the request settles. Compared recovery from a slow request, request cancellation, and how the behavior can be tested. Reading: `docs/TASK.md` → Features 4 and 6; `docs/hooks.md` → Basic Hooks (`useEffect`).
- **Decision & justification:** пользователь может перезапустить зависший запрос без ожидания, старый запрос прерывается через AbortController без гонки данных, а тест честно проверяет замену активного запроса.
- **Concepts explained:** A real replacement test must start the second request before settling the first and verify that the older result cannot win.
- **TODO:** Keep Refetch available while loading and update the same-location test to assert abort and latest-result behavior.

## 2026-11-21 — Replacing an in-flight refetch

- **Did:** Kept the Refetch button enabled during loading and changed the same-location test to start a second request before resolving the first.
- **Options considered:** Followed the previously logged choice to allow a repeat click and cancel the older request.
- **Decision & justification:** Existing decision remains unchanged; the latest test now exercises an overlapping same-location refetch and checks that the older result does not replace the newer one.
- **Concepts explained:** The saved cache stores Celsius, while the card should format that value in the location's selected units.
- **TODO:** Restore unit-aware temperature display and the empty-list message; strengthen the replacement test by asserting the first request's abort signal.
- **Validation:** All 39 tests passed; Oxlint, Oxfmt, TypeScript, and the production build passed.

## 2026-11-22 — Finalizing saved-location refetch behavior

- **Did:** Restored the unit-aware temperature formatter and empty-list message, and strengthened the same-location test to observe the first AbortSignal.
- **Options considered:** Kept the previously selected repeat-refetch behavior and used the existing temperature helper for display.
- **Decision & justification:** Existing choices remain unchanged; this verifies that the first request is aborted and the latest response is displayed.
- **Concepts explained:** Celsius remains the cache format, while each location's unit controls presentation.
- **TODO:** Continue with the remaining Error Boundary, Husky pre-commit hook, and repository technical-requirement checks.
- **Validation:** All 42 tests passed; statements 95.23%, branches 88.02%, functions 95.65%, lines 95.80%; Oxlint, Oxfmt, and the production build passed.

## 2026-11-22 — Implementing and verifying the Error Boundary

- **Did:** Added a class-based `ErrorBoundary` with fallback UI, error logging, retry recovery, and reset-key support; integrated it around the dashboard main area and added a test trigger in the header.
- **Options considered:** Kept the boundary around the dashboard main area so the header and trigger remain accessible, while network errors continue to render beside their affected result.
- **Decision & justification:** The boundary handles render failures, and the application fallback is recoverable: `Try again` resets the crash flag and restores the dashboard main area.
- **Concepts explained:** `getDerivedStateFromError` sets the fallback state, `componentDidCatch` logs render failures, and a reset callback restores child state; Error Boundaries do not replace network error handling.
- **TODO:** Restore the coaching-harness assets and Husky hooks, then resolve the repository technical-requirement checks.
- **Validation:** Added unit and App-level integration tests; all 44 tests passed, coverage remained above thresholds (94.63% statements, 86.81% branches, 95.14% functions, 95.45% lines), and `pnpm lint`, `pnpm format`, and `pnpm build` passed.
