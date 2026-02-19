export type Platform = 'ios' | 'android' | 'common';
export type Severity = 'critical' | 'warning' | 'info';

export interface ErrorPattern {
  id: string;
  platform: Platform;
  severity: Severity;
  title: string;
  cause: string;
  patterns: RegExp[];
  fixes: string[];
  autoFixable: boolean;
  fixId?: string;
}

export interface DiagnosedError {
  id: string;
  severity: Severity;
  title: string;
  cause: string;
  fixes: string[];
  autoFixable: boolean;
  fixId?: string;
  matchedLine?: string;
}

export interface EnvCheckResult {
  name: string;
  status: 'ok' | 'warning' | 'error' | 'not-installed';
  value?: string;
  expected?: string;
  message?: string;
}

export interface ProjectInfo {
  rnVersion?: string;
  reactVersion?: string;
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'unknown';
  ios?: {
    deploymentTarget?: string;
    hermesEnabled?: boolean;
    flipperEnabled?: boolean;
    newArchEnabled?: boolean;
    pods?: {
      installed: boolean;
      lockFilePresent: boolean;
    };
  };
  android?: {
    compileSdk?: number;
    targetSdk?: number;
    minSdk?: number;
    agpVersion?: string;
    gradleVersion?: string;
    kotlinVersion?: string;
    namespace?: string;
    newArchEnabled?: boolean;
    jetifierEnabled?: boolean;
    javaVersion?: string;
  };
}

export interface FixAction {
  id: string;
  title: string;
  description: string;
  commands: string[];
  executable: boolean;
  caution: 'safe' | 'moderate' | 'destructive';
}

export interface LibraryRecommendation {
  name: string;
  npmPackage: string;
  description: string;
  platforms: Platform[];
  expoSupported: boolean;
  setupSteps: string[];
  permissions?: string[];
  links: { docs?: string; github?: string; npm?: string };
}

export interface FeatureCategory {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  libraries: LibraryRecommendation[];
}

export interface GuideEntry {
  name: string;
  description: string;
  recommended: boolean;
  setupSteps?: string[];
  codeExample?: string;
  pros: string[];
  cons: string[];
  links: { docs?: string; github?: string };
}

export type GuideDomain =
  | 'architecture'
  | 'testing'
  | 'debugging'
  | 'security'
  | 'cicd'
  | 'accessibility'
  | 'styling'
  | 'i18n';

export interface GuideCategory {
  id: string;
  domain: GuideDomain;
  name: string;
  description: string;
  keywords: string[];
  entries: GuideEntry[];
}

export interface PublishingStep {
  order: number;
  title: string;
  description: string;
  commands?: string[];
  tips?: string[];
}

export interface PublishingGuide {
  id: string;
  platform: 'ios' | 'android' | 'common';
  name: string;
  description: string;
  keywords: string[];
  steps: PublishingStep[];
  commonRejections?: { reason: string; fix: string }[];
}

export type TemplateCategoryType =
  | 'official'
  | 'community'
  | 'fullstack'
  | 'expo-template';

export interface TemplateEntry {
  name: string;
  description: string;
  recommended: boolean;
  setupCommands: string[];
  features: string[];
  bestFor: string;
  pros: string[];
  cons: string[];
  links: { docs?: string; github?: string };
}

export interface TemplateCategory {
  id: string;
  category: TemplateCategoryType;
  name: string;
  description: string;
  keywords: string[];
  entries: TemplateEntry[];
}

// ── Upgrade Guide ────────────────────────────────

export interface UpgradeStep {
  order: number;
  title: string;
  description: string;
  commands?: string[];
  breakingChange: boolean;
  tips?: string[];
}

export interface VersionUpgradeGuide {
  id: string;
  from: string;
  to: string;
  name: string;
  description: string;
  keywords: string[];
  steps: UpgradeStep[];
  majorChanges: string[];
}

// ── Native Module Guide ──────────────────────────

export interface NativeModuleGuide {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  platform: 'ios' | 'android' | 'common';
  steps: { order: number; title: string; description: string; codeExample?: string; tips?: string[] }[];
}

// ── Compatibility Rule ───────────────────────────

export interface CompatibilityRule {
  id: string;
  library: string;
  libraryVersion: string;
  rnVersionMin?: string;
  rnVersionMax?: string;
  severity: 'error' | 'warning';
  description: string;
  fix: string;
  keywords: string[];
}

// ── Troubleshoot Recipe ──────────────────────────

export interface TroubleshootRecipe {
  id: string;
  symptom: string;
  description: string;
  platform: Platform;
  keywords: string[];
  checks: { order: number; action: string; expected: string; ifFail: string }[];
  commonCause: string;
  fix: string[];
}

// ── Performance Guide ────────────────────────────

export interface PerformanceGuide {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  category: 'rendering' | 'lists' | 'images' | 'navigation' | 'startup' | 'memory' | 'bridge';
  diagnosticSteps: string[];
  optimizations: { title: string; description: string; codeExample?: string }[];
  tools: string[];
}

// ── Migration Guide ──────────────────────────────

export interface MigrationGuide {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  direction: 'expo-to-bare' | 'bare-to-expo' | 'expo-prebuild' | 'eject';
  steps: { order: number; title: string; description: string; commands?: string[]; tips?: string[] }[];
  warnings: string[];
}

// ── Deep Link Guide ──────────────────────────────

export interface DeeplinkGuide {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  platform: 'ios' | 'android' | 'common';
  steps: { order: number; title: string; description: string; commands?: string[]; codeExample?: string; tips?: string[] }[];
}

// ── Monorepo Guide ───────────────────────────────

export interface MonorepoGuide {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  tool: 'turborepo' | 'nx' | 'yarn-workspaces' | 'pnpm-workspaces' | 'general';
  steps: { order: number; title: string; description: string; commands?: string[]; tips?: string[] }[];
  commonPitfalls: string[];
}

// ── Release Checklist ────────────────────────────

export interface ReleaseChecklistGuide {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  platform: 'ios' | 'android' | 'common';
  checklist: { order: number; item: string; description: string; critical: boolean }[];
  commonRejections?: { reason: string; fix: string }[];
}

// ── Environment Setup Guide ──────────────────────

export interface EnvSetupGuide {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  os: 'macos' | 'windows' | 'linux' | 'common';
  targetPlatform: 'ios' | 'android' | 'both';
  steps: { order: number; title: string; description: string; commands?: string[]; tips?: string[] }[];
  prerequisites: string[];
}

// ── State Management Guide ───────────────────────

export interface StateManagementGuide {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  bundleSize: string;
  learningCurve: 'easy' | 'moderate' | 'steep';
  bestFor: string;
  features: string[];
  codeExample: string;
  pros: string[];
  cons: string[];
  links: { docs?: string; github?: string };
}

// ── Code Snippet ─────────────────────────────────

export interface CodeSnippet {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  category: 'navigation' | 'api' | 'hooks' | 'forms' | 'notifications' | 'storage' | 'auth' | 'ui';
  dependencies?: string[];
  code: string;
  usage: string;
}
