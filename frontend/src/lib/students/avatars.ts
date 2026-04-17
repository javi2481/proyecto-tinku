/**
 * Avatares Ola 1. Placeholders simples con emoji + color de fondo.
 * Reemplazar por SVGs custom Ola 2 si queremos identidad visual única.
 */

export type AvatarId = 'avatar_01' | 'avatar_02' | 'avatar_03' | 'avatar_04' | 'avatar_05' | 'avatar_06';

export interface Avatar {
  id: AvatarId;
  emoji: string;
  bgClass: string;
  label: string;
}

export const AVATARS: Avatar[] = [
  { id: 'avatar_01', emoji: '🦊', bgClass: 'bg-orange-100', label: 'Zorro' },
  { id: 'avatar_02', emoji: '🐶', bgClass: 'bg-sky-100',    label: 'Perro' },
  { id: 'avatar_03', emoji: '🐱', bgClass: 'bg-pink-100',   label: 'Gato' },
  { id: 'avatar_04', emoji: '🐼', bgClass: 'bg-gray-100',   label: 'Panda' },
  { id: 'avatar_05', emoji: '🦁', bgClass: 'bg-yellow-100', label: 'León' },
  { id: 'avatar_06', emoji: '🐸', bgClass: 'bg-green-100',  label: 'Rana' },
];

export const DEFAULT_AVATAR: AvatarId = 'avatar_01';

export function getAvatar(id: string | null | undefined): Avatar {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0]!;
}
