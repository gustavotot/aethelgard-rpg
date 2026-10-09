import {
  CompendiumRealm,
  RealmArchetype,
  SpellSchool,
} from '../types/rpg';
import { REALM_AFFINITIES, SPELL_SCHOOL_LABELS_PT } from './affinities';
import { COMPENDIUM_ARCHETYPES } from './archetypes';
import { REALM_TALENTS, pendingRealmTalent } from './realmTalents';

const ARCHETYPE_TALENT_LEVELS = [3, 6, 9, 12, 16];

const ARCHETYPE_LABEL_TO_ID: Record<string, string> = {
  Guerreiro: 'guerreiro',
  Baluarte: 'baluarte',
  Vigilante: 'vigilante',
  Arcanista: 'arcanista',
  Creator: 'creator',
};

function buildRealmArchetypes(seed: RealmSeed): RealmArchetype[] {
  return COMPENDIUM_ARCHETYPES.map((ae) => {
    const entry = (seed.arquetipos || []).find(
      (a) => ARCHETYPE_LABEL_TO_ID[a.classe] === ae.id
    );
    const realmTalents = REALM_TALENTS[ae.id]?.[seed.id];
    return {
      classe: ae.id,
      icone: entry?.icone ?? ae.icone,
      nome: entry?.nome ?? ae.nome,
      desc:
        entry?.desc ??
        (entry ? ae.tagline : `${ae.nome} de ${seed.name} — variante em revisão.`),
      revisao: !entry,
      talentos:
        realmTalents?.map((t) => ({ ...t })) ??
        ARCHETYPE_TALENT_LEVELS.map((nivel) => pendingRealmTalent(nivel)),
    };
  });
}

function affinityLabel(id: string): string {
  const aff = REALM_AFFINITIES.find((r) => r.id === id);
  if (!aff) return '';
  return `${SPELL_SCHOOL_LABELS_PT[aff.primary as SpellSchool]} + ${SPELL_SCHOOL_LABELS_PT[aff.secondary as SpellSchool]}`;
}

interface RealmSeed {
  id: string;
  name: string;
  icone: string;
  cor: string;
  group: 'fruto' | 'caos';
  virtude: string;
  atributo: string;
  frase: string;
  citacao: string;
  cultura: string;
  lore: string;
  fonte: { nome: string; desc: string };
  passiva: { nome: string; desc: string };
  vantagens: string[];
  corrupcao?: string;
  reflexo?: string;
  racas?: { id: string; nome: string; stats: string; desc: string; traits: string[] }[];
  arquetipos?: { classe: string; icone: string; nome: string; desc: string }[];
}

const SEEDS: RealmSeed[] = [
  {
    id: 'havendor',
    name: 'Havendor',
    icone: '⚜️',
    cor: '#e0876d',
    group: 'fruto',
    virtude: 'Amor',
    atributo: 'Sabedoria',
    frase: '"Onde a luz encontra a coragem."',
    citacao: '"A luz não existe para ser vista. Ela existe para expulsar as trevas."',
    cultura: 'Uma civilização de cavaleiros e construtores que acredita na proteção dos fracos. Suas cidades flutuam sobre as nuvens, sustentadas por uma energia radiante que poucos compreendem.',
    lore: 'Dizem que o primeiro fragmento caiu aqui, incrustando-se no coração da montanha mais alta. Os havendorianos não adoram o fragmento — eles o estudam, pois acreditam que compreendê-lo é compreender a si mesmos. Sua sociedade é estratificada em ordens: os Portadores da Aurora (cavaleiros), os Forjadores de Luz (artesãos) e os Sussurradores (estudiosos).',
    fonte: { nome: 'Radiância', desc: 'Energia divina viva usada para cura, proteção, purificação e dano sagrado. Forte contra criaturas do Caos, corrupção e magia sombria.' },
    passiva: { nome: 'Radiância Viva', desc: 'Dano extra contra caóticos e leve resistência à corrupção durante combate. Canaliza Radiância em ataques, defesa e suporte — efeitos sagrados aprimorados.' },
    vantagens: ['Afinidade Radiante: usa Radiância independentemente do arquétipo', 'Purificação: resistência a maldições, corrupção, medo e magia caótica', 'Bênção do Núcleo: regeneração, cura e recuperação de mana ampliadas em locais sagrados', 'Luz Ofensiva: ataques radiantes causam dano ampliado em criaturas do Caos'],
    racas: [{ id: 'heavens', nome: 'Heavens', stats: '+2 SAB, +1 CAR', desc: 'Humanoides de linhagem divina, olhos luminosos e marcas douradas.', traits: ['Olhos do Juízo: percebe Caos e corrupção a 18m', 'Regeneração Divina: recupera 1 PV por turno abaixo da metade dos PV', 'Resistência a dano de corrupção e magia caótica', 'Fraqueza: dano caótico causa +1 dado; brilho dá desvantagem em Furtividade'] }],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Cavaleiro Radiante', desc: 'arma imbuída de luz — sem restrição de tipo' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Paladino da Aurora', desc: 'escudo de luz' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Vigia Radiante', desc: 'luz que revela inimigos' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Sacerdote Radiante', desc: 'luz purificadora' },
      { classe: 'Creator', icone: '⚙️', nome: 'Forjador de Luz', desc: 'drones radiantes' },
    ],
  },
  {
    id: 'aurivelle',
    name: 'Aurivelle',
    icone: '🎭',
    cor: '#f0c34a',
    group: 'fruto',
    virtude: 'Alegria',
    atributo: 'Carisma',
    frase: '"A vida é uma canção que nunca termina."',
    citacao: '"Enquanto houver canção… o mundo ainda pode florescer."',
    cultura: 'Artistas, músicos e performers. Aqui a expressão é tudo — cada pessoa encontra seu próprio ritmo. As cidades são construídas em florestas vivas, com madeira encantada que reage à música.',
    lore: 'O fragmento de Aurivelle caiu em uma clareira onde, dizem, os pássaros cantavam em uníssono. Desde então, a floresta ao redor absorveu essa harmonia. Os aurivellianos não constroem com pedra — usam madeira viva que cresce conforme a música que tocam. Cada pessoa tem uma "melodia pessoal" que reflete sua alma.',
    fonte: { nome: 'Arte Viva', desc: 'A magia se manifesta através de música, dança, emoção, atuação e criatividade — a arte possui efeito mágico real, não apenas estético.' },
    passiva: { nome: 'Expressão Viva', desc: '1x por rodada, pode somar metade do Carisma em ataque, dano ou defesa. Festivais vivos, cultura artística e armas feitas de madeira viva.' },
    vantagens: ['Expressão Arcana: usa Carisma para potencializar ações', 'Criatividade Viva: liberdade para improvisar e criar soluções incomuns', 'Ritmo Natural: sequências bem executadas aumentam precisão', 'Afinidade Social: bônus em persuasão, atuação e presença', 'Equipamentos Artísticos: ferramentas e armas com maior afinidade mágica'],
    racas: [{ id: 'auris', nome: 'Auris', stats: '+2 CAR, +1 INT', desc: 'Artistas filhos da madeira encantada de Aurivelle.', traits: ['Vocação Artística: +2 dados em arte, música ou performance', 'Carisma Solar: vantagem em testes sociais na luz plena', 'Proficiência em Música e Performance', 'Harmonia Emocional: resistência a encantamento através da arte'] }],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Duelista Performático', desc: 'golpes coreografados' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Guardião da Melodia', desc: 'proteção rítmica' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Artista das Sombras', desc: 'dança entre golpes' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Bardo da Melodia', desc: 'magia musical' },
      { classe: 'Creator', icone: '⚙️', nome: 'Artesão da Melodia', desc: 'instrumentos vivos' },
    ],
  },
  {
    id: 'selah',
    name: 'Sélah',
    icone: '🌄',
    cor: '#a9d3df',
    group: 'fruto',
    virtude: 'Paz',
    atributo: 'Sabedoria',
    frase: '"No silêncio, encontra-se a resposta."',
    citacao: '"A paz não é a ausência de conflito. É a presença de ordem."',
    cultura: 'Monges, meditadores e eremitas. Uma cultura de introspecção e equilíbrio. Não buscam poder — buscam compreensão. Sua arquitetura é minimalista, esculpida nas montanhas.',
    lore: 'O fragmento de Sélah não brilha — ele pulsa, como uma respiração. Os selahitas acreditam que o mundo foi criado em ciclos, e que cada pessoa pode aprender a fluir com eles. Seus mosteiros nas montanhas são centros de estudo do "Fluxo da Criação", uma energia que conecta todas as coisas. O fragmento caiu como orvalho sobre vastas planícies, onde surgiu o Coração do Silêncio.',
    fonte: { nome: 'Fluxo da Criação', desc: 'Uma energia que conecta todas as coisas, estudada através de ciclos e da respiração do mundo em mosteiros minimalistas de montanha.' },
    passiva: { nome: 'Fluxo da Criação', desc: 'Acumula Fluxo ao atacar, defender ou proteger aliados, e o gasta em grandes feitos. Quanto mais o jogador controla o impulso de gastar, maior a recompensa.' },
    vantagens: ['Disciplina meditativa', 'Mestres do Fluxo da Criação', 'Cidade-templo do Coração do Silêncio', 'Cultura de não-violência e autoconhecimento'],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Monge da Paz', desc: 'combate desarmado fluido' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Muro de Sélah', desc: 'defesa meditativa' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Vento de Sélah', desc: 'movimento fluido' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Sábio do Fluxo', desc: 'magia meditativa' },
      { classe: 'Creator', icone: '⚙️', nome: 'Escultor do Silêncio', desc: 'criações meditativas' },
    ],
  },
  {
    id: 'knathi',
    name: "K'Nahti",
    icone: '🌿',
    cor: '#7ba869',
    group: 'fruto',
    virtude: 'Paciência',
    atributo: 'Inteligência',
    frase: '"Tudo floresce no tempo certo."',
    citacao: '"A criação apressada produz ferramentas. A criação paciente produz maravilhas."',
    cultura: 'Uma cultura arbórea e lenta. Grandes árvores-cidades abrigam gerações. Os K\'Nahti não têm pressa — acreditam que apressar é quebrar. Usam uma tinta viva extraída de plantas para criar arte, armas e aliados.',
    lore: 'O fragmento de K\'Nahti caiu sobre a maior árvore do mundo, Ydrosyl, e enraizou-se nela. Os K\'Nahti desenvolveram uma relação simbiótica com a árvore — sua seiva é a "Tinta Viva" que usam para criar. Cada K\'Nahti nasce com uma cor de tinta única, que define seu estilo de criar. Sua magia é lenta para começar, mas extremamente versátil e poderosa.',
    fonte: { nome: 'Tinta Viva', desc: 'Seiva da Árvore Viva refinada em uma substância mágica capaz de alterar a realidade — a própria mana dos K\'Nahti.' },
    passiva: { nome: 'Tinta Viva', desc: 'Manifestação, invocação e transmutação feitas com a Tinta Viva. Criação lenta para começar, extremamente poderosa quando utilizada corretamente.' },
    vantagens: ['Manifestação: dar forma ao que não existe (objetos, armas, estruturas)', 'Invocação: dar vida ao desenho (criaturas de combate, transporte e vigilância)', 'Transmutação: tornar-se a própria criação', 'Floresta ancestral e árvores-cidades'],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Guerreiro-Árvore', desc: 'força da natureza' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Tronco da Vida', desc: 'enraizado e imóvel' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Predador Silencioso', desc: 'camuflagem natural' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Druida das Cores', desc: 'tinta viva mágica' },
    ],
  },
  {
    id: 'lumivior',
    name: 'Lumivior',
    icone: '⚙️',
    cor: '#63d9c4',
    group: 'fruto',
    virtude: 'Amabilidade',
    atributo: 'Inteligência',
    frase: '"A tecnologia é a chave para a alma."',
    citacao: '"Nenhum de nós é completo sozinho."',
    cultura: 'Engenheiros e inventores. Uma sociedade nômade que viaja em cidades-máquina. Não separam vida de máquina — para eles, o éter que move seus motores é a mesma energia que move o corpo.',
    lore: 'O fragmento de Lumivior foi encontrado por um mecânico que tentava criar um motor perpétuo. Quando tocou o fragmento, sua máquina ganhou vida. Desde então, os lumivorianos fundiram tecnologia e éter em uma única filosofia: "Energia Vital". Suas cidades são gigantescos mecanismos ambulantes. Após uma guerra que quase exterminou seu povo, criaram o Núcleo de Éter.',
    fonte: { nome: 'Éter', desc: 'Energia mágica refinada que alimenta construtos, próteses, armaduras e o Núcleo de Éter. Para utilizá-lo plenamente, é preciso um Coração de Éter.' },
    passiva: { nome: 'Coração de Éter', desc: 'Sua Vida é sua Mana (Energia Vital). Cuidar de um é cuidar do outro. Recuperação de vida também recupera mana — e gastar demais leva ao colapso.' },
    vantagens: ['Energia Unificada: Vida e Mana são o mesmo recurso', 'Rede de Conhecimento: acesso a informações compartilhadas por todo o reino', 'Aprimoramentos de Éter: substituição e melhoria de partes do corpo', 'Adaptabilidade: a cidade móvel se adapta a qualquer ambiente'],
    racas: [{ id: 'etherborn', nome: 'Etherborn', stats: '+2 INT, +1 CON', desc: 'Forjados sintéticos de Éter e metal, dotados de consciência.', traits: ['Arquivo Coletivo: obtém uma informação relevante 1x por descanso longo', 'Não respira, come ou bebe; imune a doenças e venenos', 'Mana máxima +10%; descanso curto recupera como longo', 'Fraquezas: precisa recarregar, críticos causam +1d6, cura mágica pela metade'] }],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Cavaleiro de Éter', desc: 'armadura elétrica' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Torre de Éter', desc: 'barreira tecnomágica' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Fantasma de Éter', desc: 'invisibilidade digital' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Tecnomago', desc: 'éter e código' },
    ],
  },
  {
    id: 'neruviah',
    name: 'Neruviah',
    icone: '🌊',
    cor: '#3f93a8',
    group: 'fruto',
    virtude: 'Bondade',
    atributo: 'Carisma',
    frase: '"As marés mudam, e nós mudamos com elas."',
    citacao: '"Assim como a água assume a forma do recipiente, a bondade assume a forma da necessidade."',
    cultura: 'Nômades do mar e do deserto. Adaptam-se a qualquer ambiente seguindo os ciclos da natureza. Sua sociedade é fluida — não têm cidades fixas, apenas caravanas e navios.',
    lore: 'O fragmento de Neruviah caiu no oceano e foi encontrado por uma tribo nômade que seguia as baleias. Desde então, eles aprenderam a "sentir" as marés da alma — estados de espírito que trazem diferentes bênçãos. Um neruviano pode mudar sua disposição conforme a situação, como o mar muda suas ondas. Nas profundezas repousa a capital submersa, O Fôlego de Mayim.',
    fonte: { nome: 'Marés da Alma', desc: 'Correntes internas que conectam emoções, espírito, magia e ambiente. Ao controlá-las, os neruvianos desenvolvem uma incrível capacidade de adaptação.' },
    passiva: { nome: 'Marés da Alma', desc: 'Escolhe uma Maré por descanso curto; cada Maré concede um bônus e um golpe diferentes. Alterna entre defesa, suporte, magia e combate.' },
    vantagens: ['Adaptabilidade das Marés: alterna foco defensivo, suporte, mágico ou ofensivo', 'Obsidiana Viva: armas e armaduras únicas com propriedades mágicas', 'Conexão Oceânica: vantagem em ambientes aquáticos e recuperação na água', 'Leitura Emocional: percepção apurada das intenções alheias'],
    racas: [{ id: 'nerus', nome: 'Nerus', stats: '+2 CAR, +1 CON', desc: 'Povo aquático de Neruviah, com formas inspiradas na vida marinha.', traits: ['Respira em terra e debaixo d\'água; natação 12m', 'Vantagem em ambientes aquáticos ou úmidos', 'Escolha uma inspiração: Tubarão, Polvo, Água-viva, Coral, Caracol ou Crustáceo', 'Fraquezas: desidratação e fogo causa +1 dado'] }],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Marujo das Tempestades', desc: 'luta nas marés' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Recife Coral', desc: 'defesa fluida' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Onda Silenciosa', desc: 'ataque das marés' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Xamã das Marés', desc: 'magia elemental' },
    ],
  },
  {
    id: 'ringendah',
    name: 'Ringendah',
    icone: '💍',
    cor: '#a374d1',
    group: 'fruto',
    virtude: 'Fidelidade',
    atributo: 'Inteligência',
    frase: '"Toda aliança é um portal."',
    citacao: '"Conhecimento não é poder. Conhecimento é responsabilidade."',
    cultura: 'Uma cultura de estudiosos e invocadores. Constroem portais entre lugares distantes usando anéis como chaves. Sua cidade principal, Serafur, é um entrecruzamento de círculos mágicos.',
    lore: 'O fragmento de Ringendah partiu-se em três anéis antes de cair. Cada anel foi encontrado por um estudioso diferente, e eles discordam sobre como usá-los. Até hoje, os três anéis são mantidos separados, e cada escola de pensamento em Ringendah segue um deles. Transformou um deserto implacável na maior potência comercial e mágica do mundo conhecido.',
    fonte: { nome: 'Magia dos Anéis', desc: 'Anéis são ferramentas arcanas que canalizam magia, armazenam energia e executam técnicas. Enquanto outros reinos aprendem a usar um poder, Ringendah aprende a compreender qualquer poder.' },
    passiva: { nome: 'Legado Arcano', desc: 'Aumenta a BASE de mana do arquétipo em +1 e soma +10% de recuperação de mana em descansos. Facilidade de aprendizado: bônus para aprender novas magias e conhecimentos.' },
    vantagens: ['Legado Arcano: mana adicional baseada em Inteligência e recuperação superior', 'Facilidade de Aprendizado: bônus em novas magias, idiomas e técnicas', 'Relíquias de Anel: equipamento que melhora magias e reduz custo de mana', 'Bibliotecas infinitas e academias de Serafur'],
    racas: [
      { id: 'elfo-deserto', nome: 'Elfos do Deserto', stats: '+2 DES, +1 INT', desc: 'Elfos de Ringendah adaptados ao sol, às runas e ao conhecimento.', traits: ['Resistência a fogo e calor extremo', 'Proficiência em Conhecimento (arcano)', 'Identifica magia como ação livre', 'Entende inscrições mágicas antigas'] },
      { id: 'marmoreano', nome: 'Marmoreanos', stats: '+2 CON, +1 INT', desc: 'Humanos transcendidos em mármore vivo, com veios mágicos.', traits: ['Resistência a dano físico, imunidade a veneno e doenças', 'CD de suas magias +1', 'Imune a calor, frio e pressão extremos; não precisa respirar', 'Fraquezas: deslocamento 6m, não nada, ruído e peso prejudicam'] },
    ],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Cavaleiro Arcano', desc: 'anéis que fortalecem armas' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Guardião do Portal', desc: 'escudo dimensional' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Ladrão de Portais', desc: 'teletransporte tático' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Mago dos Anéis', desc: 'portais e invocação' },
    ],
  },
  {
    id: 'argolis',
    name: 'Argolis',
    icone: '🌙',
    cor: '#7c86ba',
    group: 'fruto',
    virtude: 'Mansidão',
    atributo: 'Sabedoria',
    frase: '"Sob as duas luas, a verdade se revela."',
    citacao: '"A calma não é ausência de guerra. É domínio total dela."',
    cultura: 'Uma sociedade de estrategistas e observadores. Argolis tem duas luas no céu, e seus habitantes desenvolveram uma percepção aguçada do tempo e do espaço. São conhecidos como os melhores analistas táticos do mundo.',
    lore: 'O fragmento de Argolis caiu em um deserto de cristal que reflete a luz das duas luas infinitamente. Os argolianos aprenderam a ler padrões em tudo — no movimento das estrelas, nas ondas do deserto, nos passos de um inimigo. Sua "Disciplina Marcial" é lendária. O reino é militarizado e descentralizado: cidades-fortaleza, bases ocultas e unidades móveis de elite.',
    fonte: { nome: 'Disciplina Marcial', desc: 'Percepção avançada do ambiente e leitura instantânea de combate. Argolis não se adapta ao perigo — foi moldado para ele.' },
    passiva: { nome: 'Visão de Análise Tática', desc: '2x por combate, revela fraquezas, o campo de batalha ou anomalias ocultas. Sem tempo para análise, perde parte da vantagem.' },
    vantagens: ['Preparação Total: todos os cidadãos são treinados para combate', 'Visão Tática: leitura avançada do campo de batalha', 'Meritocracia: oportunidades baseadas em desempenho real', 'Versatilidade Operacional: infiltração, combate direto e táticas de grupo'],
    racas: [{ id: 'argoliano', nome: 'Argolianos', stats: '+2 DES, +1 SAB', desc: 'Híbridos de percepção sobre-humana e instinto tático.', traits: ['Visão Tática: 2x por combate revela campo, inimigos ou anomalias', 'Proficiência em Furtividade e Percepção', 'Esconde-se parcialmente oculto em vegetação ou ruínas', 'Vantagem para rastrear criaturas'] }],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Estrategista Lunar', desc: 'precisão cirúrgica' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Muralha Lunar', desc: 'defesa tática' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Infiltrador Lunar', desc: 'análise + furtividade' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Ilusionista Lunar', desc: 'mente e percepção' },
    ],
  },
  {
    id: 'sphalidor',
    name: 'Sphalidor',
    icone: '💎',
    cor: '#c987ab',
    group: 'fruto',
    virtude: 'Domínio Próprio',
    atributo: 'Constituição',
    frase: '"O som certo quebra qualquer montanha."',
    citacao: '"O que vibra em ti, obedece a ti."',
    cultura: 'Mineiros e artesãos de cristal. Descobriram que tudo vibra em uma frequência específica. Usam a "Ressonância" para extrair minérios, construir armas e até curar. Suas cavernas-cidades são obras de arte acústica.',
    lore: 'O fragmento de Sphalidor foi encontrado nas profundezas de uma caverna, incrustado em um cristal que cantava. Os sphalorianos desenvolveram a "Ressonância" — a arte de vibrar objetos e seres em sua frequência ideal. Um guerreiro sphaloriano pode fazer uma armadura vibrar para torná-la mais resistente, ou uma espada vibrar para cortar melhor.',
    fonte: { nome: 'Ressonância', desc: 'Tudo vibra: metal, pedra, carne, magia, alma. O Aço Ressoante armazena vibrações, amplifica impactos e responde à intenção do portador.' },
    passiva: { nome: 'Domínio da Ressonância', desc: 'Acumula Cargas de Vibração ao atacar, ser atingido ou bloquear com ressonância, e as gasta em dano, defesa, contra-ataque ou ondas de choque.' },
    vantagens: ['Poder Crescente: quanto mais o combate se prolonga, mais forte o sphaloriano fica', 'Versatilidade de Impacto: cargas para dano, defesa ou mobilidade', 'Aço Ressoante: armas e armaduras que evoluem com o portador', 'Resistência Natural: treino em impacto e controle corporal'],
    racas: [
      { id: 'elfo-negro', nome: 'Elfos Negros', stats: '+2 DES, +1 INT', desc: 'Elfos das cavernas, sintonizados com escuridão e vibrações.', traits: ['Eco-Sentido: percebe por vibração a 18m se houver som', 'Visão profunda: enxerga no escuro a 60m', 'Proficiência com armas de impacto e martelos; +1d6 sônico 1x por descanso curto', 'Fraquezas: luz solar e isolamento social'] },
      { id: 'anao-sphalidor', nome: 'Anões de Sphalidor', stats: '+2 CON, +1 FOR', desc: 'Anões artesãos do som, mestres da ressonância.', traits: ['Guilda Ressonante: proficiência em artesanato + ressonância', 'Pulso do Ferro: +1 dado em testes físicos em cavernas', 'Visão no escuro 36m', 'Resistência a dano sônico'] },
    ],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Guerreiro Ressonante', desc: 'vibração que corta' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Torre Ressonante', desc: 'vibração defensiva' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Lâmina Ressonante', desc: 'corte vibratório' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Cristalino', desc: 'magia de ressonância' },
    ],
  },
  {
    id: 'valdar',
    name: 'Valdar',
    icone: '🔥',
    cor: '#c0392b',
    group: 'caos',
    virtude: 'Ira',
    atributo: 'Força',
    frase: '"Não esconda quem você é. Liberte seus sentimentos e transforme-os em poder."',
    citacao: '"A força que você esconde ainda pertence ao medo. A força que você liberta pertence a você."',
    cultura: 'Um domínio de cinzas e brasas governado pelo Conclave das Cinzas. Os valdarianos acreditam que reprimir emoções é fraqueza: raiva, dor e ressentimento são fontes legítimas de força, e os conflitos se resolvem em arenas, duelos rituais e terras devastadas para extrair a verdade do caos.',
    lore: 'O Cristal Carmesim é um fragmento primordial corrompido que amplifica emoções intensas e as converte em força sobrenatural. Seu primeiro guardião, o Primeiro Corrompido, foi um herói que queria apenas fazer justiça — cada vitória alimentou sua fúria até ele se tornar o Senhor da Ira. Dizem que ele ainda governa, oculto entre as cinzas do Conclave.',
    fonte: { nome: 'Cristal Carmesim', desc: 'Amplifica emoções intensas e converte sentimentos em força sobrenatural. Não cria a raiva — apenas a torna mais poderosa, mais presente e mais difícil de abandonar.' },
    passiva: { nome: 'Fúria', desc: 'Acumula Fúria ao ser alvo de ataques; ao atingir 3, entra em Fúria Ativa com ataques intensificados. Os Berserkers são o maior símbolo do domínio.' },
    corrupcao: 'A Corrupção Carmesim começa como força e alívio, mas com o tempo a raiva passa a surgir antes do motivo, a dor vira justificativa para ferir e a violência parece honestidade. No estágio final, o portador perde a capacidade de escolher o que fazer com as próprias emoções — e vira um Dilacerado.',
    reflexo: 'Sphalidor',
    vantagens: ['Fúria Ativa: ataques intensificados ao acumular Fúria', 'Arenas e duelos rituais definem prestígio', 'Emoções são fontes legítimas de força', 'Forma Desperta dos Filhos da Fúria'],
    racas: [{ id: 'filhos-da-furia', nome: 'Filhos da Fúria', stats: '+2 FOR, +1 CON', desc: 'Humanos marcados pelo Cristal Carmesim de Valdar.', traits: ['Forma Desperta: em combate com PV ≤ 1/3, entra involuntariamente em fúria primal — +4 no atributo de guerra, −2 em dois outros (mín 8)', 'Teste de Controle: CD igual à sua CON para conter a Forma Desperta', 'Consumidos pelas emoções: vantagem contra medo'] }],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Campeão Carmesim', desc: 'fúria em sangue' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Muralha da Ira', desc: 'a dor vira escudo' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Predador Rubro', desc: 'caçada em chamas' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Hemomante Carmesim', desc: 'a magia do seu sangue' },
    ],
  },
  {
    id: 'sataris',
    name: 'Sataris',
    icone: '🎭',
    cor: '#8e7cc3',
    group: 'caos',
    virtude: 'Inveja',
    atributo: 'Carisma',
    frase: '"Por que permanecer sendo você, quando pode se tornar alguém superior?"',
    citacao: '"Seu rosto é apenas o primeiro disfarce que você recebeu."',
    cultura: 'A Terra dos Ocultos — o Domínio dos Segredos. Espionagem, manipulação e substituição são as armas de Sataris, que domina pelas sombras: induzir reis ao erro, destruir alianças e fazer impérios ruírem de dentro para fora.',
    lore: 'Antigas relíquias conhecidas como Faces Ancestrais — máscaras vivas com poderes, memórias e vontade de antigos portadores — definem a identidade de quem as carrega. O domínio é governado pelo Conselho das Máscaras, cujos membros nunca revelam seus verdadeiros nomes. Seu lema: "O rosto é a primeira mentira." No coração do domínio fica a Casa das Máscaras.',
    fonte: { nome: 'Faces Ancestrais', desc: 'Máscaras vivas que carregam poderes, técnicas, memórias e fragmentos da vontade de antigos portadores. Não apenas concedem poder — moldam o estilo de combate e o pensamento de seus usuários.' },
    passiva: { nome: 'Olho Observador', desc: 'Ação Bônus (2 Mana): copia habilidades e técnicas observadas para usá-las contra seus donos. O desejo de aprender com os outros vira necessidade de substituir a própria identidade.' },
    corrupcao: 'As máscaras comuns concedem habilidades; as Faces antigas exigem preço. Quanto mais tempo o vínculo dura, mais a máscara sussurra, mistura memórias, sugere decisões e muda desejos — até que já não se sabe se a máscara está sendo usada ou se é ela quem usa o novo portador.',
    reflexo: 'Aurivelle',
    vantagens: ['Espionagem e manipulação por excelência', 'Copia habilidades e técnicas observadas', 'Casa das Máscaras e o Conselho das Máscaras', 'Rosto é a primeira mentira'],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Lâmina Espelhada', desc: 'copiando estilos' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Muralha do Espelho', desc: 'reflete tudo' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Sombra Sem Rosto', desc: 'nunca é visto' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Ilusionista das Faces', desc: 'conjura o que observa' },
    ],
  },
  {
    id: 'morvath',
    name: 'Morvath',
    icone: '🩸',
    cor: '#7d2b3c',
    group: 'caos',
    virtude: 'Gula',
    atributo: 'Constituição',
    frase: '"Tudo o que existe foi feito para ser consumido."',
    citacao: '"A fome nunca é saciada."',
    cultura: 'O Domínio da Fome Eterna, governado por antigas Casas Nobres Noctari que disputam influência há séculos. Cada Casa tem sua tradição de alimento — sangue, essência vital, magia, emoções ou anos de vida — e todas obedecem à mesma lei: quanto mais se alimentam, maior a fome.',
    lore: 'Ao buscar a imortalidade, muitos aceitaram o pacto do Cristal da Fome Eterna: pararam de envelhecer, mas passaram a depender da energia dos vivos. Nasceram os Noctari, os vampiros deste mundo. Entre banquetes e alianças, a política das Grandes Casas é uma guerra silenciosa que pode atravessar séculos.',
    fonte: { nome: 'Cristal da Fome Eterna', desc: 'Para os habitantes do domínio, toda existência possui um propósito: alimentar algo maior. Vida, sangue, magia, conhecimento, emoções e até o tempo de vida são recursos destinados aos fortes.' },
    passiva: { nome: 'Simbiose Devoradora', desc: '1x por turno ao atacar: acertou, cura; errou, fere a si mesmo (ignora resistência). A fome nunca é saciada.' },
    corrupcao: 'Os Noctari pararam de envelhecer ao pactuar com o Cristal, mas passaram a depender da energia dos vivos. Cada Casa tem sua tradição de alimento, e quanto mais se alimentam, maior a fome. Privados da Fome por muito tempo, perdem a graça e viram feras.',
    reflexo: 'Neruviah',
    vantagens: ['Simbiose Devoradora: atacar acertou cura', 'Imortalidade dos Noctari', 'Grandes Casas e tradições de alimento', 'Política de guerra silenciosa entre séculos'],
    racas: [{ id: 'noctari', nome: 'Noctari', stats: '+2 à sua escolha', desc: 'Vampiros do Domínio da Fome Eterna, elegantes e famintos.', traits: ['Fome Eterna: precisam consumir essência de vida — sangue, mana ou emoções — para se manter em forma', 'Elegantes e belos, presas discretas, olhos que brilham no escuro', 'Imunidade à doença e ao envelhecimento natural', 'Quando privado da Fome por muito tempo, torna-se monstro'] }],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Carne Armada', desc: 'corpo que é arma' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Carne Regenerativa', desc: 'ferida que se fecha' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Simbiose Parasita', desc: 'usa o inimigo' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Carne Arcana', desc: 'magia que devora' },
    ],
  },
  {
    id: 'mavaron',
    name: 'Mavaron',
    icone: '💰',
    cor: '#96711e',
    group: 'caos',
    virtude: 'Ganância',
    atributo: 'Inteligência',
    frase: '"Tudo tem um preço. O verdadeiro poder pertence àquele que está disposto a pagá-lo."',
    citacao: '"Nenhum valor é absoluto: tudo depende do preço que alguém paga."',
    cultura: 'Uma civilização construída sobre pactos, barganhas e sacrifícios ao redor do Cristal das Mil Trocas. Seus habitantes acumulam riquezas, magia, favores, títulos e até almas — para eles, possuir é vencer. Todos os Pelned trocaram a carne pela eternidade.',
    lore: 'O Cristal das Mil Trocas nunca concede nada de graça; ele apenas pergunta: "Quanto isso vale para você?". Reis ofereceram reinos, outros ofereceram a própria carne ou a própria vida — e o Cristal sempre cumpriu sua parte. Em Mavaron, nenhum valor é absoluto: tudo depende do preço que alguém paga.',
    fonte: { nome: 'Cristal das Mil Trocas', desc: 'Um pacto pode conceder poder, mas nunca é gratuito. O preço pode ser uma memória, uma relação, uma parte do corpo, uma escolha ou a própria identidade. O Cristal sempre cumpre sua promessa.' },
    passiva: { nome: 'Marca do Contrato', desc: '1x por turno, marca uma criatura (CD 12); rouba atributos e sente a localização e os PV do marcado. Em Mavaron, possuir é vencer.' },
    corrupcao: 'Cada pacto torna a oferta mais atraente e a resistência mais difícil. A eternidade é conquistada às custas da carne: os Pelned não respiram, não comem e não morrem — e negociam melhor que qualquer vivo.',
    reflexo: 'Ringendah',
    vantagens: ['Pactos e barganhas em toda parte', 'Marca do Contrato: rouba atributos do marcado', 'Riquezas, favores e títulos acumulados', 'Eternidade às custas da carne'],
    racas: [{ id: 'pelned', nome: 'Pelned', stats: '+2 INT, +1 SAB', desc: 'Os comerciantes imortais que trocaram a carne pela eternidade.', traits: ['Corpo sem Vida: não respira, não come, não bebe; imune a veneno e doença; não sangra', 'Estrutura Óssea: resistência a dano perfurante', 'Alma Presa: vantagem contra efeitos de medo e possessão', 'Negociador Nato: +1 em testes de carisma em barganhas'] }],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Carniceiro do Contrato', desc: 'preço cobrado' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Cofre Vivo', desc: 'protege o que tem preço' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Ladrão de Valores', desc: 'rouba o que importa' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Arconte das Trocas', desc: 'magia que cobra' },
    ],
  },
  {
    id: 'taevora',
    name: 'Taevora',
    icone: '🌹',
    cor: '#d95a8e',
    group: 'caos',
    virtude: 'Luxúria',
    atributo: 'Carisma',
    frase: '"Aquilo que você deseja pode ser seu."',
    citacao: '"Fique mais um pouco."',
    cultura: 'Uma Floresta Paradisíaca gigantesca e bela — árvores enormes, flores luminosas, frutas exóticas, rios cristalinos e néctares mágicos. Taevora não parece maligna: parece um paraíso. E seu maior perigo é o convite: "Fique mais um pouco."',
    lore: 'A Floresta Viva reage a cada visitante: produz frutos dos seus desejos, cria caminhos, oferece visões e intensifica conforto. Nunca obriga ninguém a ficar — apenas oferece exatamente aquilo que não se consegue recusar. Cada desejo satisfeito gera outro, e de Taevora nascem também os maiores venenos, poções e elixires do mundo.',
    fonte: { nome: 'Cristal da Luxúria', desc: 'O desejo levado ao extremo: querer, experimentar, possuir e repetir sem jamais aceitar um limite. A Floresta Viva reage aos desejos de cada visitante e nunca obriga ninguém a ficar.' },
    passiva: { nome: 'Conhecimento Tóxico', desc: 'Domina venenos e substâncias: prepara 1 por combate e os aplica com vantagem. De Taevora nascem os maiores venenos e elixires do mundo.' },
    corrupcao: 'A floresta oferece exatamente aquilo que não se consegue recusar. Cada desejo satisfeito gera outro, e o maior perigo é o convite — "Fique mais um pouco" — pois quem entra em Taevora pode nunca mais sair.',
    reflexo: 'Aurivelle',
    vantagens: ['Floresta Viva que reage aos desejos', 'Maiores venenos, poções e elixires do mundo', 'Vantagem ao aplicar venenos preparados', 'Conforto e visões intensificados'],
    racas: [{ id: 'insectoide', nome: 'Insectoides', stats: '+2 à sua escolha', desc: 'O enxame de Taevora, adaptados à floresta e aos venenos.', traits: ['Adaptação Insectoide: escolha UMA entre Voo, Veneno, Drenagem, Carapaça, Teia, Impulso, Percepção, Aderência, Camuflagem, Ácido, Feromônio, Fumaça, Anestésico, Cola ou Bioeletricidade', 'Resistência a dano de veneno', 'Vida curta e comunidade densa'] }],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Duelista do Êxtase', desc: 'golpes venenosos' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Bastião do Êxtase', desc: 'peçonha de prazer' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Sombra do Êxtase', desc: 'veneno silencioso' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Venefício Arcano', desc: 'feitiços venenosos' },
    ],
  },
  {
    id: 'morpheia',
    name: 'Morpheia',
    icone: '🌙',
    cor: '#6d7ab0',
    group: 'caos',
    virtude: 'Preguiça',
    atributo: 'Sabedoria',
    frase: '"Por que lutar contra a realidade, se você pode simplesmente sonhar com algo melhor?"',
    citacao: '"Quem entra em Morpheia não perde necessariamente o sonho. Perde o caminho de volta para a realidade."',
    cultura: 'O Reino da Névoa — florestas silenciosas, vilas vazias e ruínas onde as pessoas parecem ter desaparecido. Quando a Névoa Viva chega, o mundo adormece, e a consciência é puxada para o Mundo dos Sonhos, onde a lógica não é física.',
    lore: 'Dentro da Névoa, o Tempo Onírico não funciona como o real: um dia pode render décadas de sonhos, e ao acordar a pessoa pode ter vivido uma vida inteira em poucas horas. Quem entra em Morpheia não perde necessariamente o sonho — perde o caminho de volta para a realidade. É o lugar onde pensamentos ganham forma.',
    fonte: { nome: 'Cristal dos Sonhos', desc: 'O lugar onde os pensamentos ganham forma e os desejos tornam-se paisagens. A identidade pode deixar de depender do corpo. Dentro da Névoa, o Tempo Onírico não funciona como o real.' },
    passiva: { nome: 'Névoa Onírica', desc: 'Acumula Sono de dia e recebe Sonhos à noite, gastando-os em efeitos especiais. Quando a Névoa Viva chega, o mundo adormece.' },
    corrupcao: 'Dentro da Névoa, um dia pode render décadas de sonhos. Quem entra não perde necessariamente o sonho — perde o caminho de volta para a realidade. No Mundo dos Sonhos, a lógica não é física.',
    reflexo: 'Sélah',
    vantagens: ['Tempo Onírico: um dia pode render décadas', 'Pensamentos ganham forma', 'Vilas adormecidas e ruínas', 'Identidade independente do corpo'],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Corpo Onírico', desc: 'lutar como um sonho' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Guardião do Sono', desc: 'protege entre sonhos' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Névoa Sombria', desc: 'desaparece nos sonhos' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Sonho Arcano', desc: 'conjura adormecido' },
    ],
  },
  {
    id: 'hybris',
    name: 'Hybris',
    icone: '👑',
    cor: '#c9a24b',
    group: 'caos',
    virtude: 'Soberba',
    atributo: 'Carisma',
    frase: '"Prove o seu valor."',
    citacao: '"Ninguém nasce superior: superioridade é conquistada — ou perdida diante de todos."',
    cultura: 'A Cidade dos Jogos é construída ao redor da competição: arenas, cassinos, salas de duelo e praças de caçadas. Torneios, corridas e apostas decidem o valor de cada um, e tudo pode ser apostado — dinheiro, armas, títulos ou prestígio.',
    lore: 'A sociedade é dividida entre as Quatro Casas (Espadas, Copas, Ouros e Paus), e todos começam sem carta, subindo de 2 até 10 pela sequência de méritos. Acima de tudo está o Ás. Para Hybris, ninguém nasce superior: superioridade é conquistada — ou perdida diante de todos. Excelência, ambição e dignidade tornam-se obsessão por superioridade.',
    fonte: { nome: 'A Coroa Partida', desc: 'O domínio daqueles que acreditam que ninguém nasce superior. Todos chegam sem título, carta ou posição e precisam provar seu valor para subir. Excelência, ambição e dignidade viram obsessão por superioridade.' },
    passiva: { nome: 'Fama', desc: 'Cada acerto concedido pelos deuses soma +1 Fama (máx. 5); cada Fama soma +2 de dano aos golpes. Na Cidade dos Jogos, tudo pode ser apostado.' },
    corrupcao: 'A superioridade é conquistada — ou perdida diante de todos. Quem cai de posição perde prestígio, respeito e direitos; a obsessão por vencer consome identidade, e o Ás solitário descobre que a fama cobra seu preço.',
    reflexo: 'Argolis',
    vantagens: ['Torneios e competição definem o valor', 'Quatro Casas: Espadas, Copas, Ouros e Paus', 'Fama soma dano aos golpes', 'Tudo pode ser apostado'],
    arquetipos: [
      { classe: 'Guerreiro', icone: '⚔️', nome: 'Campeão da Fama', desc: 'o show é o golpe' },
      { classe: 'Baluarte', icone: '🛡️', nome: 'Muralha da Fama', desc: 'invencível diante das plateias' },
      { classe: 'Vigilante', icone: '🗡️', nome: 'Caçador da Fama', desc: 'caça com plateia' },
      { classe: 'Arcanista', icone: '🔮', nome: 'Arquimago da Fama', desc: 'a queda do gigante' },
    ],
  },
];

function buildRealmTraits(seed: RealmSeed): CompendiumRealm['traits'] {
  const traits: CompendiumRealm['traits'] = [
    {
      name: seed.passiva.nome,
      category: 'Others',
      actionType: 'Passive',
      description: seed.passiva.desc,
      source: { type: 'Realm', id: seed.id, name: seed.name },
    },
  ];
  if (seed.vantagens.length) {
    traits.push({
      name: 'Vantagens do Reino',
      category: 'Others',
      actionType: 'Passive',
      description: seed.vantagens.join(' · '),
      source: { type: 'Realm', id: seed.id, name: seed.name },
    });
  }
  if (seed.corrupcao) {
    traits.push({
      name: 'A Corrupção',
      category: 'Others',
      actionType: 'Passive',
      description: seed.corrupcao,
      source: { type: 'Realm', id: seed.id, name: seed.name },
    });
  }
  return traits;
}

export const COMPENDIUM_REALMS: CompendiumRealm[] = SEEDS.map((seed) => ({
  id: seed.id,
  name: seed.name,
  tagline: `${seed.icone} ${seed.frase}`,
  elementAffinity: `${seed.fonte.nome} · ${affinityLabel(seed.id)}`,
  lore: `${seed.cultura}\n\n${seed.lore}`,
  modifiers: [],
  traits: buildRealmTraits(seed),
  combatEffects: [],
  unlockedSpells: [],
  proficiencies: [],
  group: seed.group,
  cor: seed.cor,
  icone: seed.icone,
  virtude: seed.virtude,
  atributo: seed.atributo,
  citacao: seed.citacao,
  fonte: seed.fonte,
  passiva: seed.passiva,
  vantagens: seed.vantagens,
  corrupcao: seed.corrupcao,
  reflexo: seed.reflexo,
  racas: seed.racas,
  arquetipos: buildRealmArchetypes(seed),
}));

export const FRUTO_REALMS = COMPENDIUM_REALMS.filter((r) => r.group === 'fruto');
export const CAOS_REALMS = COMPENDIUM_REALMS.filter((r) => r.group === 'caos');

export const LEGACY_REALM_MAP: Record<string, string> = {
  revendor: 'havendor',
  umbria: 'morvath',
  vaelgard: 'neruviah',
};