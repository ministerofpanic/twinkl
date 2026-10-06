import { describe, it } from "vitest";

// Valid baseline: each test overrides one field to prove that field alone is the failure
const validInput = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  password: "Passw0rdOk",
  createdDate: "2024-07-09",
  userType: "teacher",
};

describe("UserInput", () => {
  it.todo("accepts a valid signup for each userType: student, teacher, parent, private tutor");
  it.todo("rejects each required field when empty, whitespace-only or missing (it.each over fields)");

  describe("password", () => {
    it.todo("enforces 8 to 64 characters at the boundaries (7 and 65 rejected, 8 and 64 accepted)");
    it.todo("rejects a missing digit, lowercase or uppercase letter (it.each over rules)");
    it.todo("reports every failed rule together, not just the first");
    it.todo("does not trim the password");
  });

  it.todo("rejects an invalid email");
  it.todo("lowercases the email when parsed");
  it.todo("rejects an unknown userType");
  it.todo("accepts yyyy-mm-dd and rejects anything else: time part, 2024-02-30, 09/07/2024 (it.each)");
});

describe("UserOutput", () => {
  it.todo("contains id, fullName, email, createdDate, userType and never password or passwordHash");
  it.todo("rejects an id that is not a uuid");
});
