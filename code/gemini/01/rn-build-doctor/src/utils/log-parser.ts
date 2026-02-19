import type { ErrorPattern, DiagnosedError, Platform } from '../types.js';

export function parseLog(
  log: string,
  patterns: ErrorPattern[],
  platform: Platform | 'auto',
): DiagnosedError[] {
  const lines = log.split('\n');
  const matched = new Map<string, DiagnosedError>();

  const applicablePatterns =
    platform === 'auto'
      ? patterns
      : patterns.filter((p) => p.platform === platform || p.platform === 'common');

  for (const line of lines) {
    for (const pattern of applicablePatterns) {
      if (matched.has(pattern.id)) continue;

      for (const regex of pattern.patterns) {
        if (regex.test(line)) {
          matched.set(pattern.id, {
            id: pattern.id,
            severity: pattern.severity,
            title: pattern.title,
            cause: pattern.cause,
            fixes: pattern.fixes,
            autoFixable: pattern.autoFixable,
            fixId: pattern.fixId,
            matchedLine: line.trim(),
          });
          break;
        }
      }
    }
  }

  const severityOrder: Record<string, number> = {
    critical: 0,
    warning: 1,
    info: 2,
  };

  return [...matched.values()].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );
}

export function detectPlatform(log: string): Platform {
  if (/xcodebuild|CocoaPods|Pods\/|\.xcworkspace|\.xcodeproj/i.test(log)) return 'ios';
  if (/gradlew|BUILD FAILED.*Gradle|AAPT|AGP|:app:/i.test(log)) return 'android';
  return 'common';
}
