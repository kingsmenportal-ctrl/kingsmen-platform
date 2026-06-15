import { runJarvisKernel } from '../runtime/kernel';
import type { JarvisActor, JarvisRuntimeResult } from '../runtime/types';

export type JarvisApiKernelBridgeInput = {
  message: string;
  actor?: JarvisActor;
  nowIso?: string;
};

export type JarvisApiKernelBridgeOutput = {
  ok: boolean;
  kernel: JarvisRuntimeResult;
  answer: string;
};

export function runJarvisApiKernelBridge(input: JarvisApiKernelBridgeInput): JarvisApiKernelBridgeOutput {
  const kernel = runJarvisKernel({
    input: input.message || 'Jarvis system status',
    actor: input.actor || 'commander',
    nowIso: input.nowIso || new Date().toISOString(),
  });

  return {
    ok: kernel.ok,
    kernel,
    answer: kernel.answer,
  };
}
