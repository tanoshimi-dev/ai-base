/**
 * Convert a project path to a filesystem-safe slug.
 *
 * Examples:
 *   /home/user/my-project     → home-user-my-project
 *   C:\Users\user\project     → c-users-user-project
 *   /home/user/My Project     → home-user-my-project
 */
export function pathToSlug(projectPath: string): string {
  return (
    projectPath
      // Normalize Windows drive letter (C: → c)
      .replace(/^([A-Za-z]):/, (_, letter: string) => letter.toLowerCase())
      // Replace backslashes with forward slashes
      .replace(/\\/g, "/")
      // Remove leading slash
      .replace(/^\//, "")
      // Remove trailing slash
      .replace(/\/$/, "")
      // Replace path separators and non-alphanumeric chars with hyphens
      .replace(/[^a-zA-Z0-9-]/g, "-")
      // Collapse multiple hyphens
      .replace(/-+/g, "-")
      // Remove leading/trailing hyphens
      .replace(/^-|-$/g, "")
      // Lowercase
      .toLowerCase()
  );
}

/**
 * Extract the project name (last path segment) from a full path.
 */
export function projectName(projectPath: string): string {
  const normalized = projectPath.replace(/\\/g, "/").replace(/\/$/, "");
  const segments = normalized.split("/");
  return segments[segments.length - 1] || "unknown";
}
