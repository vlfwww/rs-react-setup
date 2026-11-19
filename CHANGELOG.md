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

- **Did:** Added the `SavedLocation` and `SavedWeather` types, a pure reducer for collection and per-location fetch actions, and four reducer tests.
- **Options considered:** `useState` or `useReducer` for collection updates and per-item lifecycle; the `useReducer` choice and justification are recorded above.
- **Decision & justification:** Use the previously selected `useReducer` approach to centralize immutable list and status transitions.
- **Concepts explained:** Reducers should return updated state without mutating prior state; per-item updates should leave other entries unchanged.
- **TODO:** Add focused tests for `REMOVE` and successful `FETCH_SUCCESS`; prevent a superseded request from updating an existing location.

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
