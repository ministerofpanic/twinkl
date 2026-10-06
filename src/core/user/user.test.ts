import { describe, it } from "vitest";

const validInput = {
  fullName: "Ada Lovelace",
  email: "ada@example.com",
  password: "Passw0rdOk",
  createdDate: "2024-07-09",
  userType: "teacher",
};

describe("UserInput", () => {
  describe("valid input", () => {
    it.todo("accepts a valid signup");
    it.todo("accepts each userType: student, teacher, parent, private tutor");
  });

  describe("required fields", () => {
    it.todo("rejects empty fullName");
    it.todo("rejects whitespace-only fullName");
    it.todo("rejects empty email");
    it.todo("rejects empty password");
    it.todo("rejects empty createdDate");
    it.todo("rejects empty userType");
    it.todo("rejects missing fields");
  });

  describe("password rules", () => {
    it.todo("rejects 7 characters");
    it.todo("accepts 8 characters (lower boundary)");
    it.todo("accepts 64 characters (upper boundary)");
    it.todo("rejects 65 characters");
    it.todo("rejects no digit");
    it.todo("rejects no lowercase letter");
    it.todo("rejects no uppercase letter");
    it.todo("reports every failed rule together, not just the first");
    it.todo("does not trim the password");
  });

  describe("email", () => {
    it.todo("rejects an invalid email");
    it.todo("lowercases the email when parsed");
  });

  describe("userType", () => {
    it.todo("rejects an unknown userType");
  });

  describe("createdDate", () => {
    it.todo("accepts yyyy-mm-dd");
    it.todo("rejects a date with a time part");
    it.todo("rejects an impossible date, e.g. 2024-02-30");
    it.todo("rejects a wrong format, e.g. 09/07/2024");
  });
});

describe("UserOutput", () => {
  it.todo("contains id, fullName, email, createdDate, userType");
  it.todo("does not contain password");
  it.todo("does not contain passwordHash");
  it.todo("rejects an id that is not a uuid");
});
