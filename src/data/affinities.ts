import { SpellSchool } from '../types/rpg';

export interface RealmAffinity {
  id: string;
  name: string;
  group: 'fruto' | 'caos';
  primary: SpellSchool;
  secondary: SpellSchool;
}

export const REALM_AFFINITIES: RealmAffinity[] = [
  { id: 'havendor', name: 'Havendor', group: 'fruto', primary: 'Abjuration', secondary: 'Evocation' },
  { id: 'aurivelle', name: 'Aurivelle', group: 'fruto', primary: 'Enchantment', secondary: 'Evocation' },
  { id: 'selah', name: 'Sélah', group: 'fruto', primary: 'Abjuration', secondary: 'Divination' },
  { id: 'knathi', name: "K'Nahti", group: 'fruto', primary: 'Transmutation', secondary: 'Conjuration' },
  { id: 'lumivior', name: 'Lumivior', group: 'fruto', primary: 'Transmutation', secondary: 'Conjuration' },
  { id: 'neruviah', name: 'Neruviah', group: 'fruto', primary: 'Evocation', secondary: 'Transmutation' },
  { id: 'ringendah', name: 'Ringendah', group: 'fruto', primary: 'Conjuration', secondary: 'Divination' },
  { id: 'argolis', name: 'Argolis', group: 'fruto', primary: 'Divination', secondary: 'Illusion' },
  { id: 'sphalidor', name: 'Sphalidor', group: 'fruto', primary: 'Evocation', secondary: 'Abjuration' },
  { id: 'valdar', name: 'Valdar', group: 'caos', primary: 'Evocation', secondary: 'Abjuration' },
  { id: 'sataris', name: 'Sataris', group: 'caos', primary: 'Illusion', secondary: 'Enchantment' },
  { id: 'morvath', name: 'Morvath', group: 'caos', primary: 'Necromancy', secondary: 'Transmutation' },
  { id: 'mavaron', name: 'Mavaron', group: 'caos', primary: 'Enchantment', secondary: 'Necromancy' },
  { id: 'taevora', name: 'Taevora', group: 'caos', primary: 'Enchantment', secondary: 'Transmutation' },
  { id: 'morpheia', name: 'Morpheia', group: 'caos', primary: 'Illusion', secondary: 'Enchantment' },
  { id: 'hybris', name: 'Hybris', group: 'caos', primary: 'Evocation', secondary: 'Enchantment' },
];

const REALM_AFFINITY_INDEX: Record<string, RealmAffinity> = REALM_AFFINITIES.reduce(
  (acc, realm) => {
    acc[realm.id] = realm;
    return acc;
  },
  {} as Record<string, RealmAffinity>
);

export const SPELL_SCHOOL_LABELS_PT: Record<SpellSchool, string> = {
  Abjuration: 'Abjuração',
  Conjuration: 'Conjuração',
  Divination: 'Adivinhação',
  Enchantment: 'Encantamento',
  Evocation: 'Evocação',
  Illusion: 'Ilusão',
  Necromancy: 'Necromancia',
  Transmutation: 'Transmutação',
};

export function getRealmAffinity(
  realmId: string | undefined
): RealmAffinity | undefined {
  return realmId ? REALM_AFFINITY_INDEX[realmId] : undefined;
}

export function schoolAffinityStatus(
  school: string | undefined,
  realmId: string | undefined
): 'affinity' | 'outside' | 'none' {
  const realm = getRealmAffinity(realmId);
  if (!realm) return 'none';
  if (!school) return 'outside';
  const s = school.toLowerCase();
  return s === realm.primary.toLowerCase() ||
    s === realm.secondary.toLowerCase()
    ? 'affinity'
    : 'outside';
}

export function affinityLabel(realmId: string | undefined, school: string | undefined) {
  const realm = getRealmAffinity(realmId);
  const status = schoolAffinityStatus(school, realmId);
  const realmName = realm?.name ?? 'seu reino';
  if (status === 'none') {
    return {
      status,
      label: realmName,
      primary: null,
      secondary: null,
    };
  }
  return {
    status,
    label: realmName,
    primary: realm?.primary ? SPELL_SCHOOL_LABELS_PT[realm.primary] : null,
    secondary: realm?.secondary ? SPELL_SCHOOL_LABELS_PT[realm.secondary] : null,
  };
}