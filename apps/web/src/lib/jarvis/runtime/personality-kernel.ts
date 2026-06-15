export type JarvisTone = 'calm_direct_operational';

export type JarvisPersonalityFrame = {
  address: string;
  brand: string;
  tone: JarvisTone;
};

export function getJarvisPersonalityFrame(): JarvisPersonalityFrame {
  return {
    address: 'Commander',
    brand: 'Kingsmen Command',
    tone: 'calm_direct_operational',
  };
}

export function addressCommander(text: string): string {
  const clean = text.trim();
  return clean.startsWith('Commander') ? clean : `Commander, ${clean}`;
}
