import {
  getCurrentUser,
  requireAuth,
  requireAuthForAction,
} from "../auth-utils";
import { auth } from "@/_lib/auth";
import { redirect } from "next/navigation";

jest.mock("@/_lib/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

const mockedAuth = auth as unknown as jest.Mock;
const mockedRedirect = redirect as unknown as jest.Mock;

describe("auth-utils", () => {
  beforeEach(() => {
    mockedAuth.mockReset();
    mockedRedirect.mockClear();
  });

  describe("getCurrentUser", () => {
    it("should return the user from the session", async () => {
      mockedAuth.mockResolvedValue({ user: { id: "u1", email: "a@b.com" } });
      await expect(getCurrentUser()).resolves.toEqual({
        id: "u1",
        email: "a@b.com",
      });
    });

    it("should return null when no session exists", async () => {
      mockedAuth.mockResolvedValue(null);
      await expect(getCurrentUser()).resolves.toBeNull();
    });

    it("should return null when session has no user", async () => {
      mockedAuth.mockResolvedValue({});
      await expect(getCurrentUser()).resolves.toBeNull();
    });
  });

  describe("requireAuth", () => {
    it("should return the user when authenticated", async () => {
      mockedAuth.mockResolvedValue({ user: { id: "u1" } });
      await expect(requireAuth()).resolves.toEqual({ id: "u1" });
      expect(mockedRedirect).not.toHaveBeenCalled();
    });

    it("should redirect to /api/auth/signin when no user", async () => {
      mockedAuth.mockResolvedValue(null);
      await expect(requireAuth()).rejects.toThrow(
        "REDIRECT:/api/auth/signin",
      );
      expect(mockedRedirect).toHaveBeenCalledWith("/api/auth/signin");
    });

    it("should redirect when user has no id", async () => {
      mockedAuth.mockResolvedValue({ user: { email: "a@b.com" } });
      await expect(requireAuth()).rejects.toThrow(
        "REDIRECT:/api/auth/signin",
      );
    });
  });

  describe("requireAuthForAction", () => {
    it("should return the user when authenticated", async () => {
      mockedAuth.mockResolvedValue({ user: { id: "u1" } });
      await expect(requireAuthForAction()).resolves.toEqual({ id: "u1" });
    });

    it("should return null instead of redirecting when unauthenticated", async () => {
      mockedAuth.mockResolvedValue(null);
      await expect(requireAuthForAction()).resolves.toBeNull();
      expect(mockedRedirect).not.toHaveBeenCalled();
    });
  });
});
