export type JarvisPassValidatorRegistryItem = {
  readonly passRef: string;
  readonly scriptPath: string;
  readonly reportPath: string;
  readonly status: 'registered' | 'deprecated' | 'blocked';
  readonly safeSummary: string;
};

export type JarvisPassValidatorRegistryInput = {
  readonly registryRef: string;
  readonly items: readonly JarvisPassValidatorRegistryItem[];
};

export type JarvisPassValidatorRegistry = {
  readonly registryRef: string;
  readonly mode: 'read_only_validator_registry';
  readonly registeredCount: number;
  readonly blockedCount: number;
  readonly items: readonly JarvisPassValidatorRegistryItem[];
};

export function jarvisCreatePassValidatorRegistry(
  input: JarvisPassValidatorRegistryInput,
): JarvisPassValidatorRegistry {
  const items = [...input.items].sort((left, right) => left.passRef.localeCompare(right.passRef));
  return {
    registryRef: input.registryRef,
    mode: 'read_only_validator_registry',
    registeredCount: items.filter((item) => item.status === 'registered').length,
    blockedCount: items.filter((item) => item.status === 'blocked').length,
    items,
  };
}

export const JARVIS_PASS_VALIDATOR_REGISTRY_LIVE = true;
