import type { Gender } from "@/types/wrestler"

export type PortraitStyle = "game-art" | "realistic"

export const PORTRAIT_REGISTRY: Record<string, { file: string; gender: Gender; style: PortraitStyle }> = {
  m_black_heavy_01:  { file: "m_black_heavy_01.png",  gender: "male",   style: "game-art"  },
  m_black_heavy_02:  { file: "m_black_heavy_02.png",  gender: "male",   style: "game-art"  },
  m_black_heavy_03:  { file: "m_black_heavy_03.png",  gender: "male",   style: "game-art"  },
  m_black_heavy_04:  { file: "m_black_heavy_04.png",  gender: "male",   style: "game-art"  },
  m_black_light_01:  { file: "m_black_light_01.png",  gender: "male",   style: "game-art"  },
  m_black_light_02:  { file: "m_black_light_02.png",  gender: "male",   style: "game-art"  },
  m_black_light_03:  { file: "m_black_light_03.png",  gender: "male",   style: "game-art"  },
  m_black_light_04:  { file: "m_black_light_04.png",  gender: "male",   style: "game-art"  },
  m_black_light_05:  { file: "m_black_light_05.png",  gender: "male",   style: "game-art"  },
  m_black_light_06:  { file: "m_black_light_06.png",  gender: "male",   style: "game-art"  },
  m_black_light_07:  { file: "m_black_light_07.png",  gender: "male",   style: "game-art"  },
  m_mixed_mid_01:    { file: "m_mixed_mid_01.png",    gender: "male",   style: "game-art"  },
  m_mixed_mid_02:    { file: "m_mixed_mid_02.png",    gender: "male",   style: "game-art"  },
  m_mixed_mid_03:    { file: "m_mixed_mid_03.png",    gender: "male",   style: "game-art"  },
  m_mixed_mid_04:    { file: "m_mixed_mid_04.png",    gender: "male",   style: "game-art"  },
  m_asian_heavy_01:  { file: "m_asian_heavy_01.png",  gender: "male",   style: "game-art"  },
  m_asian_heavy_02:  { file: "m_asian_heavy_02.png",  gender: "male",   style: "game-art"  },
  m_asian_heavy_03:  { file: "m_asian_heavy_03.png",  gender: "male",   style: "game-art"  },
  m_asian_heavy_04:  { file: "m_asian_heavy_04.png",  gender: "male",   style: "game-art"  },
  m_asian_light_01:  { file: "m_asian_light_01.png",  gender: "male",   style: "game-art"  },
  m_asian_light_02:  { file: "m_asian_light_02.png",  gender: "male",   style: "game-art"  },
  m_asian_light_03:  { file: "m_asian_light_03.png",  gender: "male",   style: "game-art"  },
  m_asian_light_04:  { file: "m_asian_light_04.png",  gender: "male",   style: "game-art"  },
  m_heavy_bald_01:   { file: "m_heavy_bald_01.jpg",   gender: "male",   style: "realistic" },
  m_heavy_bald_02:   { file: "m_heavy_bald_02.jpg",   gender: "male",   style: "realistic" },
  m_heavy_bald_03:   { file: "m_heavy_bald_03.jpg",   gender: "male",   style: "realistic" },
  m_heavy_bald_04:   { file: "m_heavy_bald_04.jpg",   gender: "male",   style: "realistic" },
  m_longbeard_01:    { file: "m_longbeard_01.jpg",    gender: "male",   style: "realistic" },
  m_longbeard_02:    { file: "m_longbeard_02.jpg",    gender: "male",   style: "realistic" },
  m_longbeard_03:    { file: "m_longbeard_03.jpg",    gender: "male",   style: "realistic" },
  m_longbeard_04:    { file: "m_longbeard_04.jpg",    gender: "male",   style: "realistic" },
  m_muscular_01:     { file: "m_muscular_01.jpg",     gender: "male",   style: "realistic" },
  m_muscular_02:     { file: "m_muscular_02.jpg",     gender: "male",   style: "realistic" },
  m_muscular_03:     { file: "m_muscular_03.jpg",     gender: "male",   style: "realistic" },
  m_muscular_04:     { file: "m_muscular_04.jpg",     gender: "male",   style: "realistic" },
  m_luchador_01:     { file: "m_luchador_01.jpg",     gender: "male",   style: "realistic" },
  m_luchador_02:     { file: "m_luchador_02.jpg",     gender: "male",   style: "realistic" },
  m_luchador_03:     { file: "m_luchador_03.jpg",     gender: "male",   style: "realistic" },
  m_luchador_04:     { file: "m_luchador_04.jpg",     gender: "male",   style: "realistic" },
  m_punk_01:         { file: "m_punk_01.jpg",         gender: "male",   style: "realistic" },
  m_punk_02:         { file: "m_punk_02.jpg",         gender: "male",   style: "realistic" },
  m_punk_03:         { file: "m_punk_03.jpg",         gender: "male",   style: "realistic" },
  m_punk_04:         { file: "m_punk_04.jpg",         gender: "male",   style: "realistic" },
  f_black_light_01:  { file: "f_black_light_01.png",  gender: "female", style: "game-art"  },
  f_black_light_02:  { file: "f_black_light_02.png",  gender: "female", style: "game-art"  },
  f_black_light_03:  { file: "f_black_light_03.png",  gender: "female", style: "game-art"  },
  f_mixed_01:        { file: "f_mixed_01.png",        gender: "female", style: "game-art"  },
  f_mixed_02:        { file: "f_mixed_02.png",        gender: "female", style: "game-art"  },
  f_mixed_03:        { file: "f_mixed_03.png",        gender: "female", style: "game-art"  },
  f_mixed_04:        { file: "f_mixed_04.png",        gender: "female", style: "game-art"  },
  f_asian_01:        { file: "f_asian_01.png",        gender: "female", style: "game-art"  },
  f_asian_02:        { file: "f_asian_02.png",        gender: "female", style: "game-art"  },
  f_asian_03:        { file: "f_asian_03.png",        gender: "female", style: "game-art"  },
  f_asian_04:        { file: "f_asian_04.png",        gender: "female", style: "game-art"  },
  f_athletic_01:     { file: "f_athletic_01.jpg",     gender: "female", style: "realistic" },
  f_athletic_02:     { file: "f_athletic_02.jpg",     gender: "female", style: "realistic" },
  f_athletic_03:     { file: "f_athletic_03.jpg",     gender: "female", style: "realistic" },
  f_athletic_04:     { file: "f_athletic_04.jpg",     gender: "female", style: "realistic" },
  f_facepaint_01:    { file: "f_facepaint_01.jpg",    gender: "female", style: "realistic" },
  f_facepaint_02:    { file: "f_facepaint_02.jpg",    gender: "female", style: "realistic" },
  f_facepaint_03:    { file: "f_facepaint_03.jpg",    gender: "female", style: "realistic" },
  f_facepaint_04:    { file: "f_facepaint_04.jpg",    gender: "female", style: "realistic" },
  f_elegant_01:      { file: "f_elegant_01.jpg",      gender: "female", style: "realistic" },
  f_elegant_02:      { file: "f_elegant_02.jpg",      gender: "female", style: "realistic" },
  f_elegant_03:      { file: "f_elegant_03.jpg",      gender: "female", style: "realistic" },
  f_elegant_04:      { file: "f_elegant_04.jpg",      gender: "female", style: "realistic" },
  f_braids_01:       { file: "f_braids_01.jpg",       gender: "female", style: "realistic" },
  f_braids_02:       { file: "f_braids_02.jpg",       gender: "female", style: "realistic" },
  f_braids_03:       { file: "f_braids_03.jpg",       gender: "female", style: "realistic" },
  f_braids_04:       { file: "f_braids_04.jpg",       gender: "female", style: "realistic" },
  f_shorthair_01:    { file: "f_shorthair_01.jpg",    gender: "female", style: "realistic" },
  f_shorthair_02:    { file: "f_shorthair_02.jpg",    gender: "female", style: "realistic" },
  f_shorthair_03:    { file: "f_shorthair_03.jpg",    gender: "female", style: "realistic" },
  f_shorthair_04:    { file: "f_shorthair_04.jpg",    gender: "female", style: "realistic" },
}

export function getPortraitSrc(portraitId: string): string {
  const entry = PORTRAIT_REGISTRY[portraitId]
  if (!entry) return ""
  return `/portraits/${entry.file}`
}

export function getFallbackPortrait(gender: Gender): string {
  if (gender === "female") return "/portraits/f_athletic_01.jpg"
  return "/portraits/m_black_heavy_01.png"
}

export function getPortraitsByGender(gender: Gender) {
  return Object.entries(PORTRAIT_REGISTRY)
    .filter(([, v]) => v.gender === gender)
    .map(([id, v]) => ({ id, ...v, src: `/portraits/${v.file}` }))
}

export function getUnusedPortraits(usedIds: string[], gender: Gender) {
  return getPortraitsByGender(gender).filter((p) => !usedIds.includes(p.id))
}


