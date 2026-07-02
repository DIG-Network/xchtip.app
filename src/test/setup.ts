// Vitest setup: extend expect with @testing-library/jest-dom matchers + auto-cleanup the DOM
// between tests (React Testing Library).
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => {
  cleanup();
});
