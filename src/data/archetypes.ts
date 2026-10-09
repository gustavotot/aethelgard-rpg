import {
  AbilityKey,
  CompendiumRealm,
  ProficiencyLevel,
  RealmArchetype,
} from '../types/rpg';

export interface CompendiumArchetype {
  id: string;
  nome: string;
  icone: string;
  tagline: string;
  funcao: string;
  hitDie: number; // dado de vida (PV Nv1 = dado máximo + CON)
  pvPorNivel: number; // média fixa por nível (já incluso +1 no Vigor do Guardião)
  manaMultiplier: number; // Base Mana × (Nível + mod INT): Guerreiro ×3, Baluarte ×3, Vigilante ×4, Arcanista ×5, Creator ×5
  calorMultiplier: number; // Calor Máx = multiplicador × melhor mod. principal + nível
  primaryAbilities: AbilityKey[];
  savingThrows: AbilityKey[];
  skillGrants: { skillId: string; level: ProficiencyLevel }[];
  talentLevels: number[]; // níveis em que o talento do Reino é desbloqueado
  featureNv1: { nome: string; desc: string };
  coreMilestones: { level: number; nome: string; desc: string }[];
}

export const ARCHETYPE_TALENT_LEVELS = [3, 6, 9, 12, 16];

export const COMPENDIUM_ARCHETYPES: CompendiumArchetype[] = [
  {
    id: 'guerreiro',
    nome: 'Guerreiro',
    icone: '⚔️',
    tagline: 'O mestre das armas',
    funcao: 'Combate físico e força',
    hitDie: 10,
    pvPorNivel: 6,
    manaMultiplier: 3,
    calorMultiplier: 2,
    primaryAbilities: ['STR', 'CON'],
    savingThrows: ['STR', 'CON'],
    skillGrants: [
      { skillId: 'athletics', level: 'Proficient' },
      { skillId: 'intimidation', level: 'Proficient' },
    ],
    talentLevels: ARCHETYPE_TALENT_LEVELS,
    featureNv1: {
      nome: 'Estilo de Luta · Golpe Poderoso · Vigor de Batalha',
      desc:
        'Estilo de Luta: Duelismo (+2 dano com uma mão e mão livre), Arma Grande (repete 1s e 2s de dano uma vez por rolagem), Defesa (+1 CA com armadura) ou Duas Armas (mod FOR/DES no dano da segunda). Golpe Poderoso: antes do ataque corpo a corpo, gasta 2 Mana; acertou, +1d6 do mesmo tipo (Nv 10: +1d8; Nv 17: +1d10). Vigor de Batalha: 1x/descanso curto, Ação Bônus, recupera 1d10 + nível PV.',
    },
    coreMilestones: [
      { level: 2, nome: 'Impulso Marcial · Postura de Combate', desc: 'Impulso Marcial: 1x/descanso curto, uma ação adicional no seu turno (Nv 18: 2 usos). Postura de Combate: Ação Bônus (3 Mana), por 1 minuto +1 CA e vantagem em testes de resistência de Força (Nv 10: +1d4 dano corpo a corpo).' },
      { level: 5, nome: 'Ataque Extra', desc: 'Ataca duas vezes ao usar a ação Atacar (Nv 10: 3; Nv 17: 4).' },
      { level: 7, nome: 'Determinação', desc: '1x/descanso longo, repete um teste de resistência falho (Nv 15: 2 usos).' },
      { level: 10, nome: 'Ataque Extra (2) · Postura Aprimorada', desc: '3 ataques com a ação Atacar; Postura de Combate também concede +1d4 de dano em ataques corpo a corpo.' },
      { level: 11, nome: 'Vigor de Batalha (2x)', desc: 'Vigor de Batalha passa a 2 usos por descanso curto (1d10 + nível PV).' },
      { level: 15, nome: 'Determinação (2x)', desc: '2 usos de Determinação por descanso longo.' },
      { level: 17, nome: 'Ataque Extra (3)', desc: '4 ataques ao usar a ação Atacar; Golpe Poderoso sobe para +1d10.' },
      { level: 18, nome: 'Impulso Marcial (2x)', desc: '2 usos de Impulso Marcial por descanso curto.' },
      { level: 20, nome: 'Mestre de Guerra', desc: 'Ataques corpo a corpo ignoram resistência a dano físico; 1x/dia, ao reduzir um inimigo a 0 PV, realiza um ataque adicional; Vigor de Batalha recupera o máximo em vez de rolar.' },
    ],
  },
  {
    id: 'baluarte',
    nome: 'Baluarte',
    icone: '🛡️',
    tagline: 'O guardião encouraçado',
    funcao: 'Defesa, proteção e resistência',
    hitDie: 12,
    pvPorNivel: 7,
    manaMultiplier: 3,
    calorMultiplier: 3,
    primaryAbilities: ['STR', 'CON'],
    savingThrows: ['STR', 'CON'],
    skillGrants: [
      { skillId: 'athletics', level: 'Proficient' },
      { skillId: 'intimidation', level: 'Proficient' },
    ],
    talentLevels: ARCHETYPE_TALENT_LEVELS,
    featureNv1: {
      nome: 'Postura de Aço · Vigor do Guardião',
      desc:
        'Postura de Aço: escolha um estilo — Escudo Pesado (+2 CA, Reação impõe desvantagem), Armadura Reforçada (+1 CA, resistência a 1 tipo de dano) ou Interceptação (Reação: reduz dano a um aliado a 3m em 1d10 + Prof). Vigor do Guardião: +1 PV por nível e 1x/descanso curto reduz dano sofrido em valor igual ao seu nível.',
    },
    coreMilestones: [
      { level: 2, nome: 'Provocação', desc: 'Ação Bônus: criatura a 6m faz teste SAB (CD 8 + Prof + FOR) ou tem desvantagem em ataques contra não-aliados por 1 rodada.' },
      { level: 5, nome: 'Ataque Extra', desc: 'Ataca duas vezes (Nv 17: 3 ataques).' },
      { level: 7, nome: 'Muralha Viva', desc: 'Ação: inimigos a 3m fazem SAB ou têm desvantagem em ataques contra aliados por 1 minuto.' },
      { level: 10, nome: 'Aura do Guardião', desc: 'Aliados a 3m ganham +1 CA e +1 em resistências.' },
      { level: 13, nome: 'Postura Elevada', desc: 'Com 3+ inimigos adjacentes no início do turno, resistência a dano físico até o próximo turno.' },
      { level: 20, nome: 'Fortaleza Inabalável', desc: 'Não pode ser movido à força; imune a medo/encantamento; Aura alcança 6m; 1x/dia Reação reduz qualquer dano a 0.' },
    ],
  },
  {
    id: 'vigilante',
    nome: 'Vigilante',
    icone: '🗡️',
    tagline: 'O especialista em mobilidade',
    funcao: 'Destreza, mobilidade e precisão',
    hitDie: 8,
    pvPorNivel: 5,
    manaMultiplier: 4,
    calorMultiplier: 3,
    primaryAbilities: ['DEX'],
    savingThrows: ['DEX', 'INT'],
    skillGrants: [
      { skillId: 'stealth', level: 'Proficient' },
      { skillId: 'acrobatics', level: 'Proficient' },
    ],
    talentLevels: ARCHETYPE_TALENT_LEVELS,
    featureNv1: {
      nome: 'Estilo de Luta · Ataque Furtivo (1d6)',
      desc:
        'Estilo de Luta: Arquearia (+2 à distância), Duas Armas (DEX no dano da segunda) ou Acrobático (+1 CA e +1 Acrobacia sem armadura pesada). Ataque Furtivo: 1x/turno, com vantagem ou aliado adjacente, +1d6 (sobe 2d6 no Nv5, 3d6 Nv9, 4d6 Nv11, 5d6 Nv15).',
    },
    coreMilestones: [
      { level: 2, nome: 'Astúcia', desc: 'Ação Bônus: Dash, Desengajar ou Esconder. Nv 18: duas Astúcias por Ação Bônus.' },
      { level: 5, nome: 'Ataque Extra', desc: 'Ataca duas vezes (Nv 17: 3 ataques).' },
      { level: 7, nome: 'Esquiva Sobrenatural', desc: 'Reação: reduz dano recebido à metade (Nv 13 também contra magias).' },
      { level: 10, nome: 'Movimento Rápido', desc: '+3m de deslocamento (total 12m).' },
      { level: 20, nome: 'Mestre da Sombra', desc: 'Ataque Furtivo de dano máximo contra desprevenidos; Astúcia 2x/rodada; 1x/dia rodada completa antes de todos.' },
    ],
  },
  {
    id: 'arcanista',
    nome: 'Arcanista',
    icone: '🔮',
    tagline: 'O conjurador pleno',
    funcao: 'Magia, conhecimento e conjuração',
    hitDie: 6,
    pvPorNivel: 4,
    manaMultiplier: 5,
    calorMultiplier: 4,
    primaryAbilities: ['INT'],
    savingThrows: ['INT', 'WIS'],
    skillGrants: [
      { skillId: 'arcana', level: 'Proficient' },
      { skillId: 'investigation', level: 'Proficient' },
    ],
    talentLevels: ARCHETYPE_TALENT_LEVELS,
    featureNv1: {
      nome: 'Domínio Arcano · Reserva de Mana',
      desc:
        'Domínio Arcano: +1 na CD de todas as suas magias; seu Reino define seu estilo de magia e talentos de reino. Reserva de Mana: pode armazenar até metade do nível em Mana extra durante descanso longo.',
    },
    coreMilestones: [
      { level: 2, nome: 'Recuperação Arcana', desc: '1x/dia em descanso curto recupera Mana = metade do nível + mod INT (Nv 11: 2 usos).' },
      { level: 5, nome: 'Magia Acelerada', desc: '1x/descanso, conjura uma magia de 1 ação como Ação Bônus.' },
      { level: 7, nome: 'Magia Aprimorada', desc: 'Rola novamente qualquer 1 nos dados de dano de magia.' },
      { level: 13, nome: 'Mestre Arcano', desc: '1x/dia conjura magia de 7º círculo ou inferior sem gastar Mana.' },
      { level: 20, nome: 'Arquimago', desc: 'Máximo de Mana dobra; 1x/dia qualquer magia sem Mana; imune a controle mental.' },
    ],
  },
  {
    id: 'creator',
    nome: 'Summoner',
    icone: '⚙️',
    tagline: 'O invocador de criações vivas',
    funcao: 'Invocação, criação e utilidade',
    hitDie: 8,
    pvPorNivel: 5,
    manaMultiplier: 5,
    calorMultiplier: 4,
    primaryAbilities: ['INT'],
    savingThrows: ['INT', 'DEX'],
    skillGrants: [
      { skillId: 'arcana', level: 'Proficient' },
      { skillId: 'investigation', level: 'Proficient' },
    ],
    talentLevels: ARCHETYPE_TALENT_LEVELS,
    featureNv1: {
      nome: 'Assinatura do Criador · Criações',
      desc:
        'Assinatura do Criador: escolha uma criação permanente — Arma Flutuante (Ação Bônus voa até 9m, 1d6+INT, PV = seu nível, CA 12+Prof) ou Mini Golem (1d4+INT, PV = 2×nível, CA 13+Prof; tarefas simples). Criações: espaços = Bônus de Proficiência, preparadas em descanso longo — Item (até o descanso, sem custo) ou Criatura (1h; invocar gasta 5/10/15/25 Mana por Tier). Tema, tipo de dano e condutor definidos pelo seu Reino.',
    },
    coreMilestones: [
      { level: 2, nome: 'Modificação Arcana', desc: 'Ação Bônus (1 min): arma +1d4 elemental ou armadura +1 CA. Usos por descanso longo = mod INT (mín 1). Nv 7: arma +1d8, armadura +2 CA. Nv 15: afeta 2 aliados.' },
      { level: 5, nome: 'Ataque Extra · Assinatura Aprimorada', desc: 'Ataca duas vezes com a ação Atacar. Arma Flutuante: 1d8 e 2 ataques por Ação Bônus; Mini Golem: 1d6 e 2 ataques por Ação Bônus.' },
      { level: 7, nome: 'Criação Aprimorada', desc: 'Acesso a Criações Tier II.' },
      { level: 10, nome: 'Meca · Invenção Maior', desc: 'Acesso a Tier III. Meca: 2 espaços de Criação + 15 Mana invoca um construto Grande pilotável — PV 50 + nível, CA 14+Prof, 2 golpes de 1d10+Prof. Se destruído, você é ejetado ileso.' },
      { level: 11, nome: 'Assinatura Superior', desc: 'Arma Flutuante: 1d10 e atinge 2 alvos; Mini Golem: 1d8 e Ajudar como Ação Livre 1x/rodada.' },
      { level: 13, nome: 'Mestre Criador', desc: 'Acesso a Tier IV. Criações podem ser permanentes (gasto dobro de Mana no Tier + 1h extra).' },
      { level: 15, nome: 'Criação Superior', desc: '+1 espaço de Criação; Modificação Arcana afeta 2 aliados.' },
      { level: 17, nome: 'Ataque Extra (2) · Invocação em Massa', desc: '3 ataques com a ação Atacar. Invoca 3 criaturas Tier III de uma vez (45 Mana) ou 1 Tier IV + 1 Tier II (35 Mana).' },
      { level: 18, nome: 'Gênio Criativo', desc: '1x/dia, cria uma Criação instantaneamente como Ação Bônus (dura 1 hora).' },
      { level: 20, nome: 'Criador Supremo', desc: 'Número de Criações dobra; 1x/dia, Criação permanente sem custo; você pode manter duas Assinaturas ativas.' },
    ],
  },
];

const LEGACY_CLASS_TO_BASE: Record<string, string> = {
  lamina_arcana: 'arcanista',
  guardiao_vanguarda: 'baluarte',
};

export function resolveArchetypeBase(classId: string): string {
  if (LEGACY_CLASS_TO_BASE[classId]) return LEGACY_CLASS_TO_BASE[classId];
  const base = COMPENDIUM_ARCHETYPES.find((a) => a.id === classId);
  return base ? base.id : classId;
}

export function getArchetypeById(id: string): CompendiumArchetype | undefined {
  return COMPENDIUM_ARCHETYPES.find((a) => a.id === id);
}

export function getRealmArchetype(
  realm: CompendiumRealm | undefined,
  classId: string
): RealmArchetype | undefined {
  if (!realm?.arquetipos?.length) return undefined;
  const base = resolveArchetypeBase(classId);
  return (
    realm.arquetipos.find((a) => a.classe === base) || realm.arquetipos[0]
  );
}