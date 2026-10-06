import { describe, it } from "vitest";

const validError = {
  code: "validation_failed",
  context: { issues: [{ path: ["password"], code: "too_small", message: "Too short" }] },
};

describe("AppError", () => {
  it.todo("accepts a valid error for each code: validation_failed, user_not_found");
  it.todo("rejects an unknown code");
  it.todo("rejects unexpected keys, top level and in context (strict)");
  it.todo("rejects context that belongs to a different code");
  it.todo("validation_failed requires issues with path and message");
  it.todo("user_not_found requires the id");
});
