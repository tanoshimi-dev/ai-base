import { describe, it, expect } from "vitest";
import { pathToSlug, projectName } from "../../src/utils/slug.js";

describe("pathToSlug", () => {
  it("converts Unix paths", () => {
    expect(pathToSlug("/home/user/my-project")).toBe(
      "home-user-my-project",
    );
  });

  it("converts Windows paths", () => {
    expect(pathToSlug("C:\\Users\\user\\project")).toBe(
      "c-users-user-project",
    );
  });

  it("handles paths with spaces", () => {
    expect(pathToSlug("/home/user/My Project")).toBe(
      "home-user-my-project",
    );
  });

  it("handles trailing slashes", () => {
    expect(pathToSlug("/home/user/project/")).toBe("home-user-project");
  });

  it("collapses multiple hyphens", () => {
    expect(pathToSlug("/home//user///project")).toBe("home-user-project");
  });

  it("handles Windows drive letters case-insensitively", () => {
    expect(pathToSlug("D:\\Projects\\app")).toBe("d-projects-app");
  });

  it("handles dots in path", () => {
    expect(pathToSlug("/home/user/.config/app")).toBe(
      "home-user-config-app",
    );
  });
});

describe("projectName", () => {
  it("extracts last segment from Unix path", () => {
    expect(projectName("/home/user/my-project")).toBe("my-project");
  });

  it("extracts last segment from Windows path", () => {
    expect(projectName("C:\\Users\\user\\project")).toBe("project");
  });

  it("handles trailing slash", () => {
    expect(projectName("/home/user/project/")).toBe("project");
  });
});
