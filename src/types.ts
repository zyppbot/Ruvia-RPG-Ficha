/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CharacterAttributes {
  forca: number;
  destreza: number;
  vigor: number;
  intelecto: number;
  expressao: number;
  carisma: number;
}

export interface CharacterStats {
  pv: { current: number; max: number };
  pm: { current: number; max: number };
}

export interface CharacterStatChange {
  id: string;
  key: 'pv' | 'pm';
  before: number;
  after: number;
  changedAt: string;
}

export interface Skill {
  name: string;
  bonus: number;
  isLocked?: boolean;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  price?: number;
  icon?: string;
  type?: string;
  category?: EidosItemCategory;
  orvCode?: string;
}

export interface ClassAbility {
  name: string;
  description: string;
  category?: string;
  orvCode?: string;
}

export type CharacterSupplement =
  | 'modulo-basico'
  | 'quatro-elementos'
  | 'infames-condutores'
  | 'fading-humans'
  | 'ad-astra'
  | 'nova-ruvia'
  | 'portadores-milagres'
  | 'eidos'
  | 'nave';

export type EidosOrigin = 'Mago de Casta' | 'Insurgente' | 'Mago Artificial';
export type EidosItemCategory = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface EidosCad {
  id: string;
  name: string;
  format: string;
  type: 'Geral' | 'Integrado' | 'Especializado' | 'Autônomo';
  slots: number;
  compilerModel: number;
  psiprojectorModel: number;
  memoryModel: number;
  model: string;
  linked: boolean;
  modules: string;
  notes: string;
  spellSlots: { id: string; spellId: string }[];
  orvCode?: string;
}

export interface EidosSpell {
  id: string;
  name: string;
  categories: string[];
  cores: string;
  castingTime: string;
  duration: string;
  damageType: string;
  resistanceSkill: string;
  pp: string;
  psCost: string;
  passive: boolean;
  spiritual: boolean;
  recordedEffect: boolean;
  spellSheet: string;
  description: string;
  orvCode?: string;
}

export interface EidosCircle {
  id: string;
  name: string;
  materials: string;
  description: string;
}

export interface EidosFamiliar {
  id: string;
  name: string;
  grade: number;
  desire: string;
  taboo: string;
  bondLevel: number;
  core: string;
  defiant: boolean;
  orvCode?: string;
}

export interface EidosBattery {
  id: string;
  model: string;
  currentPS: number;
  capacity: number;
}

export interface EidosVehicle {
  id: string;
  name: string;
  category: EidosItemCategory;
  currentPV: number;
  maxPV: number;
  defense: number;
  movement: number;
  armor: number;
  seats: number;
  security: number;
  refinements: { engine: number; armor: number; wheels: number; structure: number; electronics: number; security: number };
  antiMagicInsulation: boolean;
  enchantedParts: string;
  mountedWeapons: { id: string; name: string; description: string }[];
  orvCode?: string;
}

export interface EidosSubject {
  id: string;
  name: string;
  studies: number;
}

export interface EidosClub {
  id: string;
  name: string;
  description: string;
}

export interface EidosBond {
  id: string;
  characterName: string;
  type: 'Cumplicidade' | 'Rivalidade';
  degree: number;
}

export interface EidosNpcLink {
  id: string;
  npcName: string;
  level: number;
  affinityPoints: number;
}

export interface EidosSheetData {
  origin?: EidosOrigin;
  family?: string;
  customFamily?: string;
  casteCore?: string;
  artificialBody?: 'PV' | 'PS';
  artificialOrigin?: 'Pública' | 'Secreta';
  institute?: string;
  customInstitute?: string;
  course?: string;
  academicYear?: number;
  stubbornnessUsed?: boolean;
  resilienceUsed?: boolean;
  pvCurrent?: number;
  psCurrent?: number;
  pvBonus?: number;
  psBonus?: number;
  sequelae?: number;
  miraclePoint?: boolean;
  conditions?: Record<string, boolean>;
  otherConditions?: string;
  reputationEvents?: number;
  cads?: EidosCad[];
  spells?: EidosSpell[];
  circles?: EidosCircle[];
  familiars?: EidosFamiliar[];
  euros?: number;
  batteries?: EidosBattery[];
  vehicles?: EidosVehicle[];
  resources?: number;
  interludeActions?: number;
  studyBonuses?: string;
  subjects?: EidosSubject[];
  clubs?: EidosClub[];
  bonds?: EidosBond[];
  npcLinks?: EidosNpcLink[];
  familyBackground?: string;
  magicDiscovery?: string;
  cadAppearance?: string;
  motivation?: string;
  secret?: string;
}

export type NovaVehicleCategory =
  | 'Bicicleta ou patinete'
  | 'Moto'
  | 'Carro'
  | 'Utilitário'
  | 'Caminhão'
  | 'Ônibus'
  | 'Tanque'
  | 'Lancha'
  | 'Barco'
  | 'Helicóptero'
  | 'Avião pequeno';

export interface NovaVehicleWeapon {
  id: string;
  name: string;
  description: string;
}

export interface NovaVehicle {
  id: string;
  name: string;
  category: NovaVehicleCategory;
  currentPV: number;
  maxPV: number;
  defense: number;
  movement: number;
  armor: number;
  seats: number;
  security: number;
  refinements: {
    engine: number;
    armor: number;
    wheels: number;
    structure: number;
    electronics: number;
    security: number;
  };
  antiMagicInsulation: boolean;
  enchantedParts: string;
  mountedWeapons: NovaVehicleWeapon[];
  orvCode?: string;
}

export interface MiracleGift {
  id: string;
  name: string;
  description: string;
  actionType: string;
  impetusCost: number;
  attackForm: 'Luta' | 'Pontaria' | 'Afinidade' | 'Nenhuma';
  combinable: boolean;
  equipped: boolean;
  orvCode?: string;
}

export interface ShipResource {
  current: number;
  max: number;
}

export interface ShipCrewMember {
  id: string;
  name: string;
  type: 'Jogador' | 'NPC';
  role: string;
}

export interface ShipSystem {
  id: string;
  name: string;
  role: string;
  description: string;
  energyCost: number;
}

export interface ShipModule {
  id: string;
  name: string;
  description: string;
}

export interface ShipInventoryItem {
  id: string;
  name: string;
  quantity: number;
}

export interface ShipData {
  captain: string;
  size: 'Pequena' | 'Média' | 'Grande' | 'Colossal';
  level: number;
  attributes: {
    structure: number;
    mobility: number;
    firepower: number;
    energyEfficiency: number;
    sensors: number;
    computing: number;
    stability: number;
  };
  availableAttributePoints: number;
  resources: {
    hull: ShipResource;
    shields: ShipResource;
    energy: ShipResource;
    fuel: ShipResource;
  };
  defense: number;
  activeDamage: string[];
  aiType: 'Assistente' | 'Tática' | 'Analítica' | 'Autônoma';
  aiLevel: number;
  crewMaximum: number;
  crewIdeal: number;
  crew: ShipCrewMember[];
  systemSlots: number;
  systems: ShipSystem[];
  moduleSlots: number;
  modules: ShipModule[];
  inventorySlots: number;
  inventory: ShipInventoryItem[];
  credits: number;
  resourcesCount: number;
}

export interface SupplementSubfold {
  id: string;
  name: string;
  rank: number;
}

export interface SupplementProtocol {
  id: string;
  name: string;
  description: string;
  actionType: string;
  energyCost: number;
  matrixPoints: number;
  snippets: string[];
  orvCode?: string;
}

export interface SupplementData {
  element?: 'Fogo' | 'Terra' | 'Água' | 'Ar' | 'Nenhum';
  elementRank?: number;
  subfolds?: SupplementSubfold[];
  conduction?: string;
  conductionTraits?: ClassAbility[];
  karmicRed?: number;
  karmicBlue?: number;
  masteries?: Record<string, number>;
  physicalFrame?: 'Robusto' | 'Padrão' | 'Mirrado';
  attributePoints?: number;
  characterPoints?: number;
  vehicles?: NovaVehicle[];
  heroName?: string;
  activeFace?: 'civil' | 'hero';
  civilAttributes?: CharacterAttributes;
  noMiracle?: boolean;
  heroAttributeBonuses?: Partial<CharacterAttributes>;
  civilSkillPoints?: Record<string, number>;
  heroSkillPoints?: Record<string, number>;
  originAbilityText?: string;
  civilPVCurrent?: number;
  heroPVCurrent?: number;
  civilPVAdjustment?: number;
  heroPVAdjustment?: number;
  impetus?: number;
  miracleTheme?: string;
  miracleObject?: string;
  miracleSpark?: string;
  bondRank?: number;
  bondBenefits?: string;
  giftSlots?: number;
  miracleGifts?: MiracleGift[];
  miracleWeapon?: string;
  civilLinks?: string[];
  civilSecret?: string;
  money?: number;
  matrixChoice?: 'Portador' | 'Sem Matriz';
  matrixTheme?: string;
  protocols?: SupplementProtocol[];
  mainSlots?: number;
  secondarySlots?: number;
  mainLoadout?: string[];
  secondaryLoadout?: string[];
  snippets?: string[];
  income?: number;
  resourceCount?: number;
  destransformed?: boolean;
  eidos?: EidosSheetData;
}

export interface CharacterSheet {
  id: string;
  folderId?: string;
  shareId?: string;
  shareOwnerSecret?: string;
  name: string;
  title: string;
  level: number;
  supplement?: CharacterSupplement;
  kind?: 'personagem' | 'nave';
  shipData?: ShipData;
  species?: string;
  specializationChoice?: string;
  offices?: string[];
  isCaptain?: boolean;
  supplementData?: SupplementData;
  attributes: CharacterAttributes;
  stats: CharacterStats;
  statChangeLog?: CharacterStatChange[];
  skills: Skill[];
  inventory: Item[];
  abilities: ClassAbility[];
  notes: string;
  origin?: string;
  specializations: { [name: string]: number };
  trainingPointsAdjustment: number;
  pvAdjustment: number;
  pmAdjustment: number;
  soulTestsUsed: number;
  soulTestsAdjustment: number;
  soulTestsState?: { [key: number]: boolean };
  soulTestStarActive?: boolean;
  domains: { [name: string]: number };
  elements: { [name: string]: number };
  skillTraining: { [skillName: string]: number };
  unlockedSkills: string[];
  defenseAdjustment: number;
  pvReduced?: boolean;
  pmReduced?: boolean;
  quickNote: {
    label: string;
    content: string;
  };
  createdAt?: string;
  updatedAt?: string;
}
