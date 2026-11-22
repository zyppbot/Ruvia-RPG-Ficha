import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, Atom, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { EIDOS_FAMILIES, EIDOS_INSTITUTES } from './constants';
import type {
  CharacterAttributes,
  CharacterSheet,
  EidosBattery,
  EidosBond,
  EidosCad,
  EidosCircle,
  EidosClub,
  EidosFamiliar,
  EidosNpcLink,
  EidosSheetData,
  EidosSpell,
  EidosSubject,
  EidosVehicle,
  Item,
} from './types';

const ATTRIBUTE_FIELDS: { key: keyof CharacterAttributes; label: string }[] = [
  { key: 'forca', label: 'Força' },
  { key: 'destreza', label: 'Destreza' },
  { key: 'vigor', label: 'Vigor' },
  { key: 'intelecto', label: 'Intelecto' },
  { key: 'expressao', label: 'Expressão' },
  { key: 'carisma', label: 'Carisma' },
];

const SPELL_CATEGORIES = [
  'Combate', 'Defesa', 'Restauração', 'Mobilidade', 'Ambiente',
  'Ilusão', 'Controle', 'Aprimoramento', 'Comunicação', 'Utilitário',
];

const ITEM_CATEGORIES = [
  'Quebrado', 'Comum', 'Bom', 'Superior', 'Profissional', 'Excepcional', 'Obra-prima',
];

const CONDITIONS = ['Esgotamento Mental', 'Interferência', 'Sobrecarga', 'Desvinculado', 'Marcado'];
const SKILLS = [
  'Acrobacia', 'Psiônica', 'Atletismo', 'Atuação', 'Blefe', 'Direção', 'Conhecimento',
  'Cultura', 'Medicina', 'Diplomacia', 'Enganação', 'Fortitude', 'Furtividade', 'Tática',
  'História', 'Iniciativa', 'Intimidação', 'Investigação', 'Intuição', 'Ladinagem', 'Natureza',
  'Política', 'Percepção', 'Pontaria', 'Reflexos', 'Religião', 'Sobrevivência', 'Vontade',
  'Luta', 'Prestidigitação', 'Ciências', 'Burocracia', 'Idiomas', 'Programação',
  'Eletrônica', 'Mecânica', 'Sensitividade', 'Reputação',
];
const SKILL_COLUMNS = [SKILLS.slice(0, 13), SKILLS.slice(13, 26), SKILLS.slice(26)];

const FIELD_CLASS = 'eidos-field w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2';
const LABEL_CLASS = 'eidos-label flex min-w-0 flex-col gap-1.5 text-xs font-semibold';
const PANEL_CLASS = 'eidos-panel rounded-2xl border p-4 sm:p-6';
const TABS = ['Ficha', 'CADs e Magias', 'Equipamento', 'Interlúdio e Vida Acadêmica', 'Relações e Background'] as const;
type EidosTab = typeof TABS[number];

function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  key?: string;
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  placeholder?: string;
}) {
  return (
    <label className={LABEL_CLASS}>
      {label}
      <input type={type} value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} className={FIELD_CLASS} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className={LABEL_CLASS}>
      {label}
      <textarea rows={rows} value={value} onChange={event => onChange(event.target.value)} className={`${FIELD_CLASS} resize-y`} />
    </label>
  );
}

function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#6c4fd1]/15 pb-3">
      <h2 className="font-[family-name:var(--font-eidos-display)] text-xl font-semibold tracking-tight text-[#2a2550] sm:text-2xl">{children}</h2>
      {action}
    </div>
  );
}

function AddButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="eidos-add-button inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2">
      <Plus size={15} /> {children}
    </button>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="eidos-remove-button rounded-md p-2 transition hover:bg-[#a64756]/10 focus-visible:outline-2">
      <Trash2 size={16} />
    </button>
  );
}

function ReferenceNote({ children, warning = false }: { children: ReactNode; warning?: boolean }) {
  return <p className={`text-xs leading-relaxed ${warning ? 'text-[#a14d29]' : 'text-[#5c5681]'}`}>{children}</p>;
}

function CheckField({ label, checked, onChange }: { key?: string; label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="eidos-option-label flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="eidos-checkbox size-4" />
      {label}
    </label>
  );
}

function ResourceMeter({
  label,
  current,
  maximum,
  resource,
  pulseKey = 0,
}: {
  label: string;
  current: number;
  maximum: number;
  resource: 'pv' | 'ps';
  pulseKey?: number;
}) {
  const safeMaximum = Number.isFinite(maximum) ? Math.max(0, maximum) : 0;
  const safeCurrent = Number.isFinite(current) ? current : 0;
  const displayedValue = Math.max(0, Math.min(safeCurrent, safeMaximum));
  const fillRatio = safeMaximum > 0 ? displayedValue / safeMaximum : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.max(1, safeMaximum)}
      aria-valuenow={displayedValue}
      aria-valuetext={`${safeCurrent} / ${maximum}`}
      className="eidos-meter-track"
    >
      <div className={`eidos-meter-fill eidos-${resource}-fill`} style={{ transform: `scaleX(${fillRatio})` }}>
        {resource === 'ps' && (
          <>
            <span className="eidos-ps-idle-glint" aria-hidden="true" />
            {pulseKey > 0 && <span key={pulseKey} className="eidos-ps-change-flash" aria-hidden="true" />}
          </>
        )}
      </div>
    </div>
  );
}

function createCad(): EidosCad {
  return {
    id: crypto.randomUUID(), name: '', format: '', type: 'Geral', slots: 0,
    compilerModel: 1, psiprojectorModel: 1, memoryModel: 1, model: '',
    linked: false, modules: '', notes: '', spellSlots: [],
  };
}

function createSpell(): EidosSpell {
  return {
    id: crypto.randomUUID(), name: '', categories: [], cores: '', castingTime: '',
    duration: '', damageType: '', resistanceSkill: '', pp: '', psCost: '',
    passive: false, spiritual: false, recordedEffect: false, spellSheet: '', description: '',
  };
}

function createVehicle(): EidosVehicle {
  return {
    id: crypto.randomUUID(), name: '', category: 0, currentPV: 0, maxPV: 0,
    defense: 0, movement: 0, armor: 0, seats: 0, security: 0,
    refinements: { engine: 0, armor: 0, wheels: 0, structure: 0, electronics: 0, security: 0 },
    antiMagicInsulation: false, enchantedParts: '', mountedWeapons: [],
  };
}

function patchRow<T extends { id: string }>(rows: T[] | undefined, id: string, updates: Partial<T>) {
  return (rows || []).map(row => row.id === id ? { ...row, ...updates } : row);
}

function skillBase(name: string, attrs: CharacterAttributes) {
  const { forca: F, destreza: D, vigor: V, intelecto: I, expressao: E, carisma: C } = attrs;
  const formulas: Record<string, number> = {
    Acrobacia: Math.floor((2 * D + F) / 3),
    Psiônica: Math.floor((5 * E + 4 * I + 2 * V) / 11),
    Atletismo: Math.floor((2 * F + D) / 3),
    Atuação: Math.floor((3 * C + I) / 4),
    Blefe: Math.floor((I + C) / 2),
    Direção: Math.floor((3 * D + 2 * I + V) / 6),
    Conhecimento: Math.floor((3 * I + 2 * E + C) / 6),
    Cultura: Math.floor((3 * E + 2 * C + I) / 6),
    Medicina: Math.floor((2 * I + D) / 3),
    Diplomacia: Math.floor((C + I) / 2),
    Enganação: Math.floor((2 * C + I) / 3),
    Fortitude: Math.floor((5 * V + F) / 6),
    Furtividade: Math.floor((3 * D + I) / 4),
    Tática: Math.floor((I + 1) / 2),
    História: Math.floor((5 * I + E) / 6),
    Iniciativa: D,
    Intimidação: Math.floor((2 * C + 2 * F + V) / 5),
    Investigação: I,
    Intuição: Math.floor((2 * E + I) / 3),
    Ladinagem: Math.floor((3 * D + I + E) / 5),
    Natureza: Math.floor((3 * I + E + C) / 5),
    Política: Math.floor((4 * C + 2 * I + E) / 7),
    Percepção: Math.floor((5 * I + D) / 6),
    Pontaria: Math.floor((5 * D + I) / 6),
    Reflexos: Math.floor((2 * D + I) / 3),
    Religião: Math.floor((I + E) / 2),
    Sobrevivência: Math.floor((4 * V + F + E) / 6),
    Vontade: Math.floor((3 * E + 2 * I + V) / 6),
    Luta: Math.floor((3 * F + 2 * D + I + E) / 7) - 2,
    Prestidigitação: Math.floor((4 * D + I + E) / 6) - 2,
    Ciências: Math.floor((4 * I + E) / 5),
    Burocracia: Math.floor((3 * I + 2 * C + V) / 6),
    Idiomas: Math.floor((3 * I + 2 * C + E) / 6),
    Programação: Math.floor((4 * I + 3 * E) / 7),
    Eletrônica: Math.floor((3 * I + E) / 4),
    Mecânica: Math.floor((3 * I + E + F) / 5),
    Sensitividade: Math.floor((3 * E + 2 * I) / 5),
    Reputação: Math.floor((7 * C + 2 * E + I) / 10),
  };
  return formulas[name] || 0;
}

export default function EidosSheetEditor({
  character,
  onChange,
  onBack,
  onSave,
  onLoad,
}: {
  character: CharacterSheet;
  onChange: (updates: Partial<CharacterSheet>) => void;
  onBack: () => void;
  onSave: () => void;
  onLoad: () => void;
}) {
  const [activeTab, setActiveTab] = useState<EidosTab>('Ficha');
  const [secretVisible, setSecretVisible] = useState(false);
  const [shareNotice, setShareNotice] = useState(false);
  const data = character.supplementData?.eidos || {};
  const attrs = character.attributes;
  const level = character.level ?? 1;
  const updateData = (updates: Partial<EidosSheetData>) => onChange({
    supplementData: {
      ...character.supplementData,
      eidos: { ...data, ...updates },
    },
  });
  const updateAttribute = (key: keyof CharacterAttributes, value: string) => onChange({
    attributes: { ...attrs, [key]: Number(value) },
  });
  const updateSkillTraining = (name: string, value: string) => onChange({
    skillTraining: { ...character.skillTraining, [name]: Number(value) },
  });
  const attributePoints = Object.values(attrs).reduce((sum, value) => sum + value, 0);
  const availableAttributePoints = 8 + (level - 1);
  const skillPoints = Object.values(character.skillTraining || {}).reduce((sum, value) => sum + value, 0);
  const availableSkillPoints = 10 + (2 * attrs.intelecto) + (2 * (level - 1));
  const skillTotals = Object.fromEntries(SKILLS.map(name => [
    name,
    skillBase(name, attrs) + (character.skillTraining?.[name] || 0) + (name === 'Reputação' ? (data.reputationEvents || 0) : 0),
  ]));
  const psiônica = skillTotals.Psiônica || 0;
  const artificialPV = data.origin === 'Mago Artificial' && (data.artificialBody || 'PV') === 'PV' ? level : 0;
  const artificialPS = data.origin === 'Mago Artificial' && (data.artificialBody || 'PV') === 'PS' ? level : 0;
  const pvMaximum = 5 + (5 * level) + (5 * attrs.vigor) + (3 * attrs.forca) + attrs.expressao + artificialPV + (data.pvBonus || 0);
  const psMaximum = 3 + (2 * level) + (3 * attrs.expressao) + attrs.intelecto + attrs.carisma + artificialPS + (data.psBonus || 0) - (2 * (data.sequelae || 0));
  const currentPS = data.psCurrent ?? psMaximum;
  const [psPulse, setPsPulse] = useState(0);
  const previousPS = useRef(currentPS);
  useEffect(() => {
    if (previousPS.current !== currentPS) {
      previousPS.current = currentPS;
      setPsPulse(sequence => sequence + 1);
    }
  }, [currentPS]);
  const linkedCadCount = (data.cads || []).filter(cad => cad.linked && cad.type !== 'Autônomo').length;
  const linkedCadLimit = level >= 20 ? 3 : level >= 10 ? 2 : 1;
  const familiarGradeTotal = (data.familiars || []).reduce((sum, familiar) => sum + (Number(familiar.grade) || 0), 0);
  const sensitivity = skillTotals.Sensitividade || 0;

  const updateVehicle = (id: string, updates: Partial<EidosVehicle>) => updateData({ vehicles: patchRow(data.vehicles, id, updates) });
  const updateCad = (id: string, updates: Partial<EidosCad>) => updateData({ cads: patchRow(data.cads, id, updates) });
  const updateSpell = (id: string, updates: Partial<EidosSpell>) => updateData({ spells: patchRow(data.spells, id, updates) });
  const updateItem = (id: string, updates: Partial<Item>) => onChange({
    inventory: character.inventory.map(item => item.id === id ? { ...item, ...updates } : item),
  });

  const renderSheetTab = () => (
    <div className="grid gap-5">
      <section className={PANEL_CLASS}>
        <SectionHeading>Identificação</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Field label="Nome" value={character.name} onChange={value => onChange({ name: value })} />
          </div>
          <label className={LABEL_CLASS}>Origem
            <select value={data.origin || ''} onChange={event => updateData({ origin: event.target.value as EidosSheetData['origin'] })} className={FIELD_CLASS}>
              <option value="">Escolher origem...</option>
              <option>Mago de Casta</option><option>Insurgente</option><option>Mago Artificial</option>
            </select>
          </label>
          <Field label="Nível" type="number" value={character.level} onChange={value => onChange({ level: Number(value) })} />
        </div>
        {data.origin === 'Mago de Casta' && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={LABEL_CLASS}>Família
              <select value={data.family || ''} onChange={event => {
                const family = event.target.value;
                const selected = EIDOS_FAMILIES.find(([name]) => name === family);
                updateData({ family, casteCore: selected?.[1] || data.casteCore || '' });
              }} className={FIELD_CLASS}>
                <option value="">Escolher família...</option>
                {EIDOS_FAMILIES.map(([family]) => <option key={family}>{family}</option>)}
                <option>Outra (personalizada)</option>
              </select>
            </label>
            {data.family === 'Outra (personalizada)' && <Field label="Família personalizada" value={data.customFamily || ''} onChange={value => updateData({ customFamily: value })} />}
            <Field label="Núcleo de casta" value={data.casteCore || ''} onChange={value => updateData({ casteCore: value })} />
          </div>
        )}
        {data.origin === 'Mago Artificial' && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className={LABEL_CLASS}>Corpo adaptado
              <select value={data.artificialBody || 'PV'} onChange={event => updateData({ artificialBody: event.target.value as EidosSheetData['artificialBody'] })} className={FIELD_CLASS}>
                <option value="PV">+1 PV por nível</option><option value="PS">+1 PS por nível</option>
              </select>
            </label>
            <label className={LABEL_CLASS}>Origem do personagem
              <select value={data.artificialOrigin || 'Pública'} onChange={event => updateData({ artificialOrigin: event.target.value as EidosSheetData['artificialOrigin'] })} className={FIELD_CLASS}>
                <option>Pública</option><option>Secreta</option>
              </select>
            </label>
          </div>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className={LABEL_CLASS}>Instituto
            <select value={data.institute || ''} onChange={event => updateData({ institute: event.target.value })} className={FIELD_CLASS}>
              <option value="">Escolher instituto...</option>
              {EIDOS_INSTITUTES.map(institute => <option key={institute}>{institute}</option>)}
              <option>Outro</option>
            </select>
          </label>
          {data.institute === 'Outro' && <Field label="Outro instituto" value={data.customInstitute || ''} onChange={value => updateData({ customInstitute: value })} />}
          <Field label="Curso" value={data.course || ''} onChange={value => updateData({ course: value })} />
          <Field label="Ano" type="number" value={data.academicYear ?? 1} onChange={value => updateData({ academicYear: Number(value) })} />
        </div>
        {level < 1 || level > 20 ? <ReferenceNote warning>Nível fora da faixa recomendada pelo sistema (1–20); o valor foi mantido.</ReferenceNote> : null}
        {data.origin && (
          <div className="mt-5 grid gap-3 rounded-xl border border-[#6c4fd1]/15 bg-[#f5f3fa] p-4 text-sm text-[#403b68] sm:grid-cols-2">
            {data.origin === 'Mago de Casta' ? (
              <>
                <span>Dado de recursos: <strong>d6</strong></span>
                <span>Reputação: <strong>+1</strong> no modificador de eventos</span>
              </>
            ) : data.origin === 'Insurgente' ? (
              <>
                <span>Dado de recursos: <strong>d4</strong></span><span><strong>5</strong> ações de interlúdio</span>
                <CheckField label="Teimosia usada neste interlúdio" checked={Boolean(data.stubbornnessUsed)} onChange={checked => updateData({ stubbornnessUsed: checked })} />
              </>
            ) : (
              <>
                <span>Dado de recursos: <strong>d4</strong></span>
                <span>Corpo adaptado: <strong>+1 {data.artificialBody || 'PV'} por nível</strong></span>
                {(data.artificialOrigin || 'Pública') === 'Pública' && <span>Origem pública: <strong>−1</strong> no modificador de eventos da Reputação</span>}
                <CheckField label="Resiliência usada neste interlúdio" checked={Boolean(data.resilienceUsed)} onChange={checked => updateData({ resilienceUsed: checked })} />
              </>
            )}
          </div>
        )}
      </section>

      <section className={PANEL_CLASS}>
        <SectionHeading>Atributos e recursos</SectionHeading>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ATTRIBUTE_FIELDS.map(({ key, label }) => (
                <Field key={key} label={label} type="number" value={attrs[key]} onChange={value => updateAttribute(key, value)} />
              ))}
            </div>
            <p className="mt-4 rounded-lg bg-[#6c4fd1]/[0.06] px-3 py-2 text-sm font-medium text-[#403b68]">
              Pontos de atributo: <strong>{attributePoints} / {availableAttributePoints}</strong>
            </p>
            {(attributePoints > availableAttributePoints || ATTRIBUTE_FIELDS.some(({ key }) => attrs[key] > (level <= 1 ? 5 : 10))) && (
              <ReferenceNote warning>O sistema recomenda 8 pontos na criação, +1 por nível, máximo 5 por atributo na criação e 10 depois. Valores acima foram mantidos e continuam editáveis.</ReferenceNote>
            )}
            <ReferenceNote>Na criação: 8 pontos, máximo 5 por atributo. Depois: +1 ponto por nível, máximo 10 por atributo.</ReferenceNote>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Sequelas" type="number" value={data.sequelae || 0} onChange={value => updateData({ sequelae: Number(value) })} />
              <div className="eidos-option-card"><CheckField label="Ponto de Milagre" checked={Boolean(data.miraclePoint)} onChange={checked => updateData({ miraclePoint: checked })} /></div>
            </div>
          </div>
          <div className="grid content-start gap-4">
            <div className="eidos-resource-card eidos-resource-pv grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="PV atual" type="number" value={data.pvCurrent ?? pvMaximum} onChange={value => updateData({ pvCurrent: Number(value) })} />
                <Field label="PV máximo (bônus manual)" type="number" value={data.pvBonus || 0} onChange={value => updateData({ pvBonus: Number(value) })} />
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#403b68]"><span>Pontos de Vida</span><span>{data.pvCurrent ?? pvMaximum} / {pvMaximum}</span></div>
              <ResourceMeter label="Pontos de Vida" current={data.pvCurrent ?? pvMaximum} maximum={pvMaximum} resource="pv" />
              <ReferenceNote>PV máximo = 5 + (5 × nível) + (5 × Vigor) + (3 × Força) + Expressão.</ReferenceNote>
            </div>
            <div className="eidos-resource-card eidos-resource-ps grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="PS atual" type="number" value={data.psCurrent ?? psMaximum} onChange={value => updateData({ psCurrent: Number(value) })} />
                <Field label="PS máximo (bônus manual)" type="number" value={data.psBonus || 0} onChange={value => updateData({ psBonus: Number(value) })} />
              </div>
              <div className="flex justify-between text-xs font-semibold text-[#403b68]"><span>Pontos de Psion (PS)</span><span>{currentPS} / {psMaximum}</span></div>
              <ResourceMeter label="Pontos de Psion" current={currentPS} maximum={psMaximum} resource="ps" pulseKey={psPulse} />
              <ReferenceNote>PS máximo = 3 + (2 × nível) + (3 × Expressão) + Intelecto + Carisma − (2 × Sequelas).</ReferenceNote>
            </div>
          </div>
        </div>
      </section>

      <section className={PANEL_CLASS}>
        <SectionHeading>Condições</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CONDITIONS.map(condition => <CheckField key={condition} label={condition} checked={Boolean(data.conditions?.[condition])} onChange={checked => updateData({ conditions: { ...data.conditions, [condition]: checked } })} />)}
        </div>
        <div className="mt-4"><TextArea label="Outras condições" value={data.otherConditions || ''} onChange={value => updateData({ otherConditions: value })} /></div>
      </section>

      <section className={PANEL_CLASS}>
        <SectionHeading>Perícias</SectionHeading>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#6c4fd1]/[0.06] px-3 py-2">
          <p className="text-sm font-semibold text-[#403b68]">PT: {skillPoints} / {availableSkillPoints}</p>
          <ReferenceNote>Máximo recomendado por perícia: nível + 2.</ReferenceNote>
        </div>
        {skillPoints > availableSkillPoints && <ReferenceNote warning>O total de PT ultrapassa o recomendado; os valores foram mantidos.</ReferenceNote>}
        <div className="grid gap-3 lg:grid-cols-3">
          {SKILL_COLUMNS.map((column, columnIndex) => (
            <div key={columnIndex} className="grid content-start gap-2">
              {column.map(name => {
                const base = skillBase(name, attrs);
                const points = character.skillTraining?.[name] || 0;
                const total = name === 'Reputação' ? Math.max(0, skillTotals[name]) : skillTotals[name];
                const exceedsRecommendation = points > level + 2;
                return (
                  <div key={name} className="eidos-skill-row">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#403b68]">{name}</p>
                      <p className="font-[family-name:var(--font-eidos-mono)] text-[10px] text-[#514a7d]">Base {base}</p>
                      {name === 'Reputação' && (
                        <label className="eidos-event-control">
                          Eventos
                          <input aria-label="Reputação eventos" type="number" value={data.reputationEvents || 0} onChange={event => updateData({ reputationEvents: Number(event.target.value) })} className={`${FIELD_CLASS} px-2 py-1 text-right`} />
                        </label>
                      )}
                    </div>
                    <label className="eidos-skill-control">
                      PT
                      <input aria-label={`${name} pontos de treinamento`} type="number" value={points} onChange={event => updateSkillTraining(name, event.target.value)} className={`${FIELD_CLASS} px-2 py-1 text-right`} />
                    </label>
                    <div className={`eidos-skill-total ${exceedsRecommendation ? 'is-over' : ''}`}>
                      <span>Total</span>
                      <strong>{total}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {SKILLS.some(name => (character.skillTraining?.[name] || 0) > level + 2) && <ReferenceNote warning>Uma ou mais perícias ultrapassam o máximo recomendado; os valores permanecem editáveis.</ReferenceNote>}
        <p className="mt-4 rounded-lg bg-[#6c4fd1]/[0.06] px-3 py-2 text-sm text-[#403b68]">CD para resistir às suas magias: <strong>10 + Psiônica = {10 + psiônica}</strong></p>
      </section>
    </div>
  );

  const renderMagicTab = () => (
    <div className="grid gap-5">
      <section className={PANEL_CLASS}>
        <SectionHeading action={<AddButton onClick={() => updateData({ cads: [...(data.cads || []), createCad()] })}>Adicionar CAD</AddButton>}>CADs</SectionHeading>
        <ReferenceNote>CADs vinculados permitidos: 1 (níveis 1–9), 2 (níveis 10–19), 3 (nível 20). Autônomos não contam.</ReferenceNote>
        {linkedCadCount > linkedCadLimit && <ReferenceNote warning>Há mais CADs vinculados que o recomendado para o nível; todos foram mantidos.</ReferenceNote>}
        <div className="mt-4 grid gap-3">
          {(data.cads || []).map(cad => (
            <details key={cad.id} className="rounded-xl border border-[#6c4fd1]/15 bg-white/55 p-4">
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 text-sm font-semibold text-[#2a2550]">
                <span>{cad.name || 'CAD sem nome'} <span className="font-normal text-[#6b6590]">· {cad.type} · {cad.slots} slots</span></span>
                <RemoveButton label="Remover CAD" onClick={() => updateData({ cads: (data.cads || []).filter(row => row.id !== cad.id) })} />
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Nome / Fabricante" value={cad.name} onChange={value => updateCad(cad.id, { name: value })} />
                <Field label="Formato" value={cad.format} onChange={value => updateCad(cad.id, { format: value })} />
                <label className={LABEL_CLASS}>Tipo
                  <select value={cad.type} onChange={event => updateCad(cad.id, { type: event.target.value as EidosCad['type'] })} className={FIELD_CLASS}>
                    <option>Geral</option><option>Integrado</option><option>Especializado</option><option>Autônomo</option>
                  </select>
                </label>
                <Field label="Slots" type="number" value={cad.slots} onChange={value => updateCad(cad.id, { slots: Number(value) })} />
                <Field label="Compilador (modelo 1–5)" type="number" value={cad.compilerModel} onChange={value => updateCad(cad.id, { compilerModel: Number(value) })} />
                <Field label="Psiprojetor (modelo 1–5)" type="number" value={cad.psiprojectorModel} onChange={value => updateCad(cad.id, { psiprojectorModel: Number(value) })} />
                <Field label="Memória (modelo 1–5)" type="number" value={cad.memoryModel} onChange={value => updateCad(cad.id, { memoryModel: Number(value) })} />
                {(cad.compilerModel < 1 || cad.compilerModel > 5 || cad.psiprojectorModel < 1 || cad.psiprojectorModel > 5 || cad.memoryModel < 1 || cad.memoryModel > 5) && <div className="sm:col-span-2 lg:col-span-3"><ReferenceNote warning>O sistema indica modelos de peça de 1 a 5; os valores foram mantidos.</ReferenceNote></div>}
                <Field label="Modelo do CAD" value={cad.model} onChange={value => updateCad(cad.id, { model: value })} />
                <CheckField label="Vinculado" checked={cad.linked} onChange={checked => updateCad(cad.id, { linked: checked })} />
                {cad.type === 'Integrado' && <div className="sm:col-span-2"><TextArea label="Módulos" value={cad.modules} onChange={value => updateCad(cad.id, { modules: value })} /></div>}
                <div className="sm:col-span-2 lg:col-span-3"><TextArea label="Observações" value={cad.notes} onChange={value => updateCad(cad.id, { notes: value })} /></div>
              </div>
              <div className="mt-4 border-t border-[#6c4fd1]/10 pt-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-[#403b68]">Magias armazenadas: {cad.spellSlots.length} / {cad.slots}</h3>
                  <AddButton onClick={() => updateCad(cad.id, { spellSlots: [...cad.spellSlots, { id: crypto.randomUUID(), spellId: '' }] })}>Adicionar slot de magia</AddButton>
                </div>
                {cad.spellSlots.length > cad.slots && <ReferenceNote warning>Slots preenchidos acima da capacidade indicada; a seleção permanece livre.</ReferenceNote>}
                <div className="grid gap-2">
                  {cad.spellSlots.map((slot, index) => (
                    <div key={slot.id} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-xs text-[#5c5681]">Slot {index + 1}</span>
                      <select value={slot.spellId} onChange={event => updateCad(cad.id, { spellSlots: cad.spellSlots.map(item => item.id === slot.id ? { ...item, spellId: event.target.value } : item) })} className={FIELD_CLASS}>
                        <option value="">Escolher magia...</option>
                        {(data.spells || []).map(spell => <option key={spell.id} value={spell.id}>{spell.name || 'Magia sem nome'}</option>)}
                      </select>
                      <RemoveButton label={`Remover slot ${index + 1}`} onClick={() => updateCad(cad.id, { spellSlots: cad.spellSlots.filter(item => item.id !== slot.id) })} />
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className={PANEL_CLASS}>
        <SectionHeading action={<AddButton onClick={() => updateData({ spells: [...(data.spells || []), createSpell()] })}>Adicionar magia</AddButton>}>Biblioteca de Magias</SectionHeading>
        <div className="grid gap-3">
          {(data.spells || []).map((spell, index) => (
            <details key={spell.id} className="rounded-xl border border-[#6c4fd1]/15 bg-white/55 p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-[#2a2550]">
                <span>{spell.name || `Magia ${index + 1}`} {spell.categories.length > 0 && <span className="font-normal text-[#6b6590]">· {spell.categories.join(', ')}</span>}</span>
                <RemoveButton label="Remover magia" onClick={() => updateData({ spells: (data.spells || []).filter(item => item.id !== spell.id) })} />
              </summary>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Nome" value={spell.name} onChange={value => updateSpell(spell.id, { name: value })} />
                <Field label="Núcleos" value={spell.cores} onChange={value => updateSpell(spell.id, { cores: value })} />
                <Field label="Tempo de conjuração" value={spell.castingTime} onChange={value => updateSpell(spell.id, { castingTime: value })} />
                <Field label="Duração" value={spell.duration} onChange={value => updateSpell(spell.id, { duration: value })} />
                <Field label="Tipo de dano" value={spell.damageType} onChange={value => updateSpell(spell.id, { damageType: value })} />
                <Field label="Perícia de resistência" value={spell.resistanceSkill} onChange={value => updateSpell(spell.id, { resistanceSkill: value })} />
                <Field label="PP" value={spell.pp} onChange={value => updateSpell(spell.id, { pp: value })} />
                <Field label="Custo em PS" value={spell.psCost} onChange={value => updateSpell(spell.id, { psCost: value })} />
                <div className="flex flex-wrap gap-4 sm:col-span-2 lg:col-span-3">
                  <CheckField label="Passiva" checked={spell.passive} onChange={checked => updateSpell(spell.id, { passive: checked })} />
                  <CheckField label="Espiritual" checked={spell.spiritual} onChange={checked => updateSpell(spell.id, { spiritual: checked })} />
                  <CheckField label="Efeito gravado" checked={spell.recordedEffect} onChange={checked => updateSpell(spell.id, { recordedEffect: checked })} />
                </div>
                <fieldset className="grid gap-2 sm:col-span-2 lg:col-span-3">
                  <legend className="mb-2 text-xs font-semibold text-[#403b68]">Categorias</legend>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                    {SPELL_CATEGORIES.map(category => <CheckField key={category} label={category} checked={spell.categories.includes(category)} onChange={checked => updateSpell(spell.id, { categories: checked ? [...spell.categories, category] : spell.categories.filter(item => item !== category) })} />)}
                  </div>
                </fieldset>
                <div className="sm:col-span-2 lg:col-span-3"><TextArea label="Ficha da magia" value={spell.spellSheet} onChange={value => updateSpell(spell.id, { spellSheet: value })} rows={5} /></div>
                <div className="sm:col-span-2 lg:col-span-3"><TextArea label="Descrição" value={spell.description} onChange={value => updateSpell(spell.id, { description: value })} /></div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className={PANEL_CLASS}>
        <SectionHeading action={<AddButton onClick={() => {
          const circle: EidosCircle = { id: crypto.randomUUID(), name: '', materials: '', description: '' };
          updateData({ circles: [...(data.circles || []), circle] });
        }}>Adicionar círculo</AddButton>}>Círculos Mágicos</SectionHeading>
        <div className="grid gap-3">
          {(data.circles || []).map(circle => (
            <article key={circle.id} className="grid gap-3 rounded-xl border border-[#6c4fd1]/15 bg-white/55 p-4 sm:grid-cols-[1fr_1fr_auto]">
              <Field label="Nome" value={circle.name} onChange={value => updateData({ circles: patchRow(data.circles, circle.id, { name: value }) })} />
              <Field label="Materiais" value={circle.materials} onChange={value => updateData({ circles: patchRow(data.circles, circle.id, { materials: value }) })} />
              <RemoveButton label="Remover círculo mágico" onClick={() => updateData({ circles: (data.circles || []).filter(item => item.id !== circle.id) })} />
              <div className="sm:col-span-2"><TextArea label="Descrição" value={circle.description} onChange={value => updateData({ circles: patchRow(data.circles, circle.id, { description: value }) })} /></div>
            </article>
          ))}
        </div>
      </section>

      <section className={PANEL_CLASS}>
        <SectionHeading action={<AddButton onClick={() => {
          const familiar: EidosFamiliar = { id: crypto.randomUUID(), name: '', grade: 0, desire: '', taboo: '', bondLevel: 1, core: '', defiant: false };
          updateData({ familiars: [...(data.familiars || []), familiar] });
        }}>Adicionar familiar</AddButton>}>Familiares</SectionHeading>
        <ReferenceNote warning={familiarGradeTotal > sensitivity}>A soma dos graus dos familiares não deve passar da Sensitividade ({familiarGradeTotal} / {sensitivity}). Os valores não são limitados.</ReferenceNote>
        <div className="mt-4 grid gap-3">
          {(data.familiars || []).map(familiar => (
            <article key={familiar.id} className="rounded-xl border border-[#6c4fd1]/15 bg-white/55 p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Nome" value={familiar.name} onChange={value => updateData({ familiars: patchRow(data.familiars, familiar.id, { name: value }) })} />
                <Field label="Grau" type="number" value={familiar.grade} onChange={value => updateData({ familiars: patchRow(data.familiars, familiar.id, { grade: Number(value) }) })} />
                <Field label="Desejo" value={familiar.desire} onChange={value => updateData({ familiars: patchRow(data.familiars, familiar.id, { desire: value }) })} />
                <Field label="Tabu" value={familiar.taboo} onChange={value => updateData({ familiars: patchRow(data.familiars, familiar.id, { taboo: value }) })} />
                <Field label="Nível de vínculo (referência 1–5)" type="number" value={familiar.bondLevel} onChange={value => updateData({ familiars: patchRow(data.familiars, familiar.id, { bondLevel: Number(value) }) })} />
                {(familiar.bondLevel < 1 || familiar.bondLevel > 5) && <ReferenceNote warning>Nível fora da faixa indicada pelo sistema; o valor foi mantido.</ReferenceNote>}
                <div className="sm:col-span-2"><TextArea label="Núcleo do familiar" value={familiar.core} onChange={value => updateData({ familiars: patchRow(data.familiars, familiar.id, { core: value }) })} /></div>
                <CheckField label="Contrariado" checked={familiar.defiant} onChange={checked => updateData({ familiars: patchRow(data.familiars, familiar.id, { defiant: checked }) })} />
                <RemoveButton label="Remover familiar" onClick={() => updateData({ familiars: (data.familiars || []).filter(item => item.id !== familiar.id) })} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderEquipmentTab = () => (
    <div className="grid gap-5">
      <section className={PANEL_CLASS}>
        <SectionHeading>Equipamento</SectionHeading>
        <Field label="Euros (€)" type="number" value={data.euros || 0} onChange={value => updateData({ euros: Number(value) })} />
        <div className="mt-5">
          <SectionHeading action={<AddButton onClick={() => onChange({ inventory: [...character.inventory, { id: crypto.randomUUID(), name: '', description: '', category: 0 }] })}>Adicionar item</AddButton>}>Inventário</SectionHeading>
          <div className="grid gap-3">
            {character.inventory.map(item => (
              <article key={item.id} className="grid gap-3 rounded-xl border border-[#6c4fd1]/15 bg-white/55 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <Field label="Nome" value={item.name} onChange={value => updateItem(item.id, { name: value })} />
                <Field label="Descrição" value={item.description} onChange={value => updateItem(item.id, { description: value })} />
                <label className={LABEL_CLASS}>Categoria
                  <select value={item.category ?? 0} onChange={event => updateItem(item.id, { category: Number(event.target.value) as Item['category'] })} className={FIELD_CLASS}>
                    {ITEM_CATEGORIES.map((category, index) => <option key={category} value={index}>{index} · {category}</option>)}
                  </select>
                </label>
                <RemoveButton label="Remover item" onClick={() => onChange({ inventory: character.inventory.filter(row => row.id !== item.id) })} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={PANEL_CLASS}>
        <SectionHeading action={<AddButton onClick={() => {
          const battery: EidosBattery = { id: crypto.randomUUID(), model: '', currentPS: 0, capacity: 0 };
          updateData({ batteries: [...(data.batteries || []), battery] });
        }}>Adicionar bateria</AddButton>}>Baterias de Psions</SectionHeading>
        <div className="grid gap-3">
          {(data.batteries || []).map(battery => (
            <article key={battery.id} className="grid gap-3 rounded-xl border border-[#6c4fd1]/15 bg-white/55 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Field label="Modelo" value={battery.model} onChange={value => updateData({ batteries: patchRow(data.batteries, battery.id, { model: value }) })} />
              <Field label="PS atual" type="number" value={battery.currentPS} onChange={value => updateData({ batteries: patchRow(data.batteries, battery.id, { currentPS: Number(value) }) })} />
              <Field label="Capacidade" type="number" value={battery.capacity} onChange={value => updateData({ batteries: patchRow(data.batteries, battery.id, { capacity: Number(value) }) })} />
              <RemoveButton label="Remover bateria" onClick={() => updateData({ batteries: (data.batteries || []).filter(item => item.id !== battery.id) })} />
            </article>
          ))}
        </div>
      </section>

      <section className={PANEL_CLASS}>
        <SectionHeading action={<AddButton onClick={() => updateData({ vehicles: [...(data.vehicles || []), createVehicle()] })}>Adicionar veículo</AddButton>}>Veículos</SectionHeading>
        <div className="grid gap-4">
          {(data.vehicles || []).map(vehicle => (
            <article key={vehicle.id} className="rounded-xl border border-[#6c4fd1]/15 bg-white/55 p-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Nome / Modelo" value={vehicle.name} onChange={value => updateVehicle(vehicle.id, { name: value })} />
                <label className={LABEL_CLASS}>Categoria
                  <select value={vehicle.category} onChange={event => updateVehicle(vehicle.id, { category: Number(event.target.value) as EidosVehicle['category'] })} className={FIELD_CLASS}>
                    {ITEM_CATEGORIES.map((category, index) => <option key={category} value={index}>{index} · {category}</option>)}
                  </select>
                </label>
                {([
                  ['currentPV', 'PV atual'], ['maxPV', 'PV máximo'], ['defense', 'Defesa'],
                  ['movement', 'Deslocamento'], ['armor', 'Blindagem'], ['seats', 'Assentos'], ['security', 'Segurança'],
                ] as const).map(([key, label]) => <Field key={key} label={label} type="number" value={vehicle[key]} onChange={value => updateVehicle(vehicle.id, { [key]: Number(value) })} />)}
                <RemoveButton label="Remover veículo" onClick={() => updateData({ vehicles: (data.vehicles || []).filter(item => item.id !== vehicle.id) })} />
              </div>
                <div className="mt-4 rounded-lg bg-[#6c4fd1]/[0.04] p-3 text-xs font-medium text-[#403b68]">
                  Integridade: {vehicle.currentPV} / {vehicle.maxPV}
                  <progress max={Math.max(vehicle.maxPV, 1)} value={Math.max(0, Math.min(vehicle.currentPV, vehicle.maxPV))} className="mt-2 h-2.5 w-full accent-[#c8553d]" />
                </div>
              <div className="mt-4 border-t border-[#6c4fd1]/10 pt-4">
                <h3 className="mb-3 text-sm font-semibold text-[#403b68]">Refinos</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {([
                    ['engine', 'Motor'], ['armor', 'Blindagem'], ['wheels', 'Pneus e Rodas'],
                    ['structure', 'Reforço Estrutural'], ['electronics', 'Eletrônica'], ['security', 'Segurança'],
                  ] as const).map(([key, label]) => (
                    <Field key={key} label={label} type="number" value={vehicle.refinements[key]} onChange={value => updateVehicle(vehicle.id, { refinements: { ...vehicle.refinements, [key]: Number(value) } })} />
                  ))}
                </div>
                <CheckField label="Isolamento antimágico" checked={vehicle.antiMagicInsulation} onChange={checked => updateVehicle(vehicle.id, { antiMagicInsulation: checked })} />
                <div className="mt-3"><TextArea label="Peças Encantadas" value={vehicle.enchantedParts} onChange={value => updateVehicle(vehicle.id, { enchantedParts: value })} /></div>
                <div className="mt-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#403b68]">Armas Montadas</h3>
                    <AddButton onClick={() => updateVehicle(vehicle.id, { mountedWeapons: [...vehicle.mountedWeapons, { id: crypto.randomUUID(), name: '', description: '' }] })}>Adicionar arma</AddButton>
                  </div>
                  <div className="grid gap-2">
                    {vehicle.mountedWeapons.map(weapon => (
                      <div key={weapon.id} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                        <Field label="Nome da arma" value={weapon.name} onChange={value => updateVehicle(vehicle.id, { mountedWeapons: vehicle.mountedWeapons.map(item => item.id === weapon.id ? { ...item, name: value } : item) })} />
                        <Field label="Descrição" value={weapon.description} onChange={value => updateVehicle(vehicle.id, { mountedWeapons: vehicle.mountedWeapons.map(item => item.id === weapon.id ? { ...item, description: value } : item) })} />
                        <RemoveButton label="Remover arma" onClick={() => updateVehicle(vehicle.id, { mountedWeapons: vehicle.mountedWeapons.filter(item => item.id !== weapon.id) })} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderInterludeTab = () => (
    <div className="grid gap-5">
      <section className={PANEL_CLASS}>
        <SectionHeading>Interlúdio e Vida Acadêmica</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Recursos" type="number" value={data.resources || 0} onChange={value => updateData({ resources: Number(value) })} />
          <Field label="Ações de interlúdio" type="number" value={data.interludeActions ?? (data.origin === 'Insurgente' ? 5 : 4)} onChange={value => updateData({ interludeActions: Number(value) })} />
          {data.interludeActions !== undefined && data.interludeActions !== (data.origin === 'Insurgente' ? 5 : 4) && <ReferenceNote warning>O sistema indica {data.origin === 'Insurgente' ? 5 : 4} ações para esta origem; o valor personalizado foi mantido.</ReferenceNote>}
          <div className="sm:col-span-2"><TextArea label="Bônus de estudo ativos" value={data.studyBonuses || ''} onChange={value => updateData({ studyBonuses: value })} /></div>
        </div>
      </section>
      <section className={PANEL_CLASS}>
        <SectionHeading action={<AddButton onClick={() => {
          const subject: EidosSubject = { id: crypto.randomUUID(), name: '', studies: 0 };
          updateData({ subjects: [...(data.subjects || []), subject] });
        }}>Adicionar matéria</AddButton>}>Matérias do semestre</SectionHeading>
        <div className="grid gap-3">
          {(data.subjects || []).map(subject => (
            <article key={subject.id} className="grid gap-3 rounded-xl border border-[#6c4fd1]/15 bg-white/55 p-4 sm:grid-cols-[1fr_1fr_auto]">
              <Field label="Nome da matéria" value={subject.name} onChange={value => updateData({ subjects: patchRow(data.subjects, subject.id, { name: value }) })} />
              <div>
                <Field label="Estudos (referência 0–5)" type="number" value={subject.studies} onChange={value => updateData({ subjects: patchRow(data.subjects, subject.id, { studies: Number(value) }) })} />
                {subject.studies >= 5 && <ReferenceNote>Pronta para a prova.</ReferenceNote>}
                {subject.studies > 5 && <ReferenceNote warning>O sistema indica até 5 estudos; o valor continua editável.</ReferenceNote>}
              </div>
              <RemoveButton label="Remover matéria" onClick={() => updateData({ subjects: (data.subjects || []).filter(item => item.id !== subject.id) })} />
            </article>
          ))}
        </div>
      </section>
      <section className={PANEL_CLASS}>
        <SectionHeading action={<AddButton onClick={() => {
          const club: EidosClub = { id: crypto.randomUUID(), name: '', description: '' };
          updateData({ clubs: [...(data.clubs || []), club] });
        }}>Adicionar entrada</AddButton>}>Clubes e Estágios</SectionHeading>
        <div className="grid gap-3">
          {(data.clubs || []).map(club => (
            <article key={club.id} className="grid gap-3 rounded-xl border border-[#6c4fd1]/15 bg-white/55 p-4 sm:grid-cols-[1fr_2fr_auto]">
              <Field label="Nome" value={club.name} onChange={value => updateData({ clubs: patchRow(data.clubs, club.id, { name: value }) })} />
              <TextArea label="Descrição" value={club.description} onChange={value => updateData({ clubs: patchRow(data.clubs, club.id, { description: value }) })} />
              <RemoveButton label="Remover clube ou estágio" onClick={() => updateData({ clubs: (data.clubs || []).filter(item => item.id !== club.id) })} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );

  const renderRelationshipsTab = () => (
    <div className="grid gap-5">
      <section className={PANEL_CLASS}>
        <SectionHeading action={<AddButton onClick={() => {
          const bond: EidosBond = { id: crypto.randomUUID(), characterName: '', type: 'Cumplicidade', degree: 1 };
          updateData({ bonds: [...(data.bonds || []), bond] });
        }}>Adicionar laço</AddButton>}>Laços</SectionHeading>
        <div className="grid gap-3">
          {(data.bonds || []).map(bond => (
            <article key={bond.id} className="grid gap-3 rounded-xl border border-[#6c4fd1]/15 bg-white/55 p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Field label="Outro personagem" value={bond.characterName} onChange={value => updateData({ bonds: patchRow(data.bonds, bond.id, { characterName: value }) })} />
              <label className={LABEL_CLASS}>Tipo
                <select value={bond.type} onChange={event => updateData({ bonds: patchRow(data.bonds, bond.id, { type: event.target.value as EidosBond['type'] }) })} className={FIELD_CLASS}>
                  <option>Cumplicidade</option><option>Rivalidade</option>
                </select>
              </label>
              <Field label="Grau (referência 1–3)" type="number" value={bond.degree} onChange={value => updateData({ bonds: patchRow(data.bonds, bond.id, { degree: Number(value) }) })} />
              {(bond.degree < 1 || bond.degree > 3) && <ReferenceNote warning>Grau fora da faixa indicada pelo sistema; o valor foi mantido.</ReferenceNote>}
              <RemoveButton label="Remover laço" onClick={() => updateData({ bonds: (data.bonds || []).filter(item => item.id !== bond.id) })} />
            </article>
          ))}
        </div>
      </section>
      <section className={PANEL_CLASS}>
        <SectionHeading action={<AddButton onClick={() => {
          const link: EidosNpcLink = { id: crypto.randomUUID(), npcName: '', level: 1, affinityPoints: 0 };
          updateData({ npcLinks: [...(data.npcLinks || []), link] });
        }}>Adicionar vínculo</AddButton>}>Vínculos com NPCs</SectionHeading>
        <div className="grid gap-3">
          {(data.npcLinks || []).map(link => (
            <article key={link.id} className="grid gap-3 rounded-xl border border-[#6c4fd1]/15 bg-white/55 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">
              <Field label="Nome do NPC" value={link.npcName} onChange={value => updateData({ npcLinks: patchRow(data.npcLinks, link.id, { npcName: value }) })} />
              <div>
                <Field label="Nível (referência 1–5)" type="number" value={link.level} onChange={value => updateData({ npcLinks: patchRow(data.npcLinks, link.id, { level: Number(value) }) })} />
                <ReferenceNote>{['', 'Conhecido', 'Colega', 'Próximo', 'Confidente', 'Inseparável'][link.level] || 'Personalizado'}</ReferenceNote>
                {(link.level < 1 || link.level > 5) && <ReferenceNote warning>Nível fora da faixa indicada; o valor foi mantido.</ReferenceNote>}
              </div>
              <Field label="Pontos de afinidade" type="number" value={link.affinityPoints} onChange={value => updateData({ npcLinks: patchRow(data.npcLinks, link.id, { affinityPoints: Number(value) }) })} />
              <RemoveButton label="Remover vínculo com NPC" onClick={() => updateData({ npcLinks: (data.npcLinks || []).filter(item => item.id !== link.id) })} />
            </article>
          ))}
        </div>
      </section>
      <section className={PANEL_CLASS}>
        <SectionHeading>Background</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextArea label="Família e posição na família" value={data.familyBackground || ''} onChange={value => updateData({ familyBackground: value })} />
          <TextArea label="Como descobriu a magia" value={data.magicDiscovery || ''} onChange={value => updateData({ magicDiscovery: value })} />
          <TextArea label="Aparência do CAD" value={data.cadAppearance || ''} onChange={value => updateData({ cadAppearance: value })} />
          <TextArea label="Motivação" value={data.motivation || ''} onChange={value => updateData({ motivation: value })} />
          <div className="sm:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#403b68]">Segredo</span>
              <button type="button" aria-label={secretVisible ? 'Ocultar segredo' : 'Mostrar segredo'} onClick={() => setSecretVisible(value => !value)} className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold text-[#5143a0] hover:bg-[#6c4fd1]/[0.06]">
                {secretVisible ? <EyeOff size={15} /> : <Eye size={15} />}{secretVisible ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            <textarea aria-label="Segredo" rows={4} value={data.secret || ''} onChange={event => updateData({ secret: event.target.value })} className={`${FIELD_CLASS} ${secretVisible ? '' : 'blur-[5px]'} transition-[filter]`} />
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <main data-supplement="eidos" className="eidos-sheet min-h-screen px-3 py-4 text-[#2a2550] sm:px-6 sm:py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#6c4fd1]/20 pb-5">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} aria-label="Voltar às fichas" className="rounded-lg border border-[#6c4fd1]/20 bg-white/70 p-2.5 text-[#5143a0] transition hover:bg-[#6c4fd1]/[0.08]">
              <ArrowLeft size={18} />
            </button>
            <span className="grid size-12 place-items-center rounded-xl border border-[#6c4fd1]/20 bg-white/70 text-[#6c4fd1]">
              <Atom size={25} strokeWidth={1.6} />
            </span>
            <div>
              <h1 className="font-[family-name:var(--font-eidos-display)] text-3xl font-semibold tracking-tight text-[#2a2550] sm:text-4xl">Eidos</h1>
              <p className="text-xs text-[#625b89]">Caderno arcano · ficha acadêmica</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={onSave} className="rounded-lg border border-[#6c4fd1]/20 bg-white/70 px-3 py-2 text-xs font-semibold text-[#5143a0] hover:bg-[#6c4fd1]/[0.08]">Salvar backup</button>
            <button type="button" onClick={onLoad} className="rounded-lg border border-[#6c4fd1]/20 bg-white/70 px-3 py-2 text-xs font-semibold text-[#5143a0] hover:bg-[#6c4fd1]/[0.08]">Carregar backup</button>
            <button type="button" onClick={() => setShareNotice(true)} className="rounded-lg border border-[#6c4fd1]/20 bg-white/70 px-3 py-2 text-xs font-semibold text-[#5143a0] hover:bg-[#6c4fd1]/[0.08]">Compartilhar (em breve)</button>
          </div>
        </header>

        {shareNotice && (
          <div role="status" aria-live="polite" className="rounded-lg border border-[#6c4fd1]/20 bg-white/60 p-3 text-xs text-[#5143a0]">
            O compartilhamento simultâneo por link está em desenvolvimento e ainda não está disponível.
          </div>
        )}

        <nav aria-label="Seções da ficha" className="-mx-3 flex gap-1 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {TABS.map(tab => (
            <button key={tab} type="button" aria-current={activeTab === tab ? 'page' : undefined} onClick={() => setActiveTab(tab)} className={`shrink-0 rounded-lg px-3 py-2.5 text-xs font-semibold transition sm:px-4 ${activeTab === tab ? 'bg-[#6c4fd1] text-white shadow-[0_5px_14px_rgba(76,56,159,0.2)]' : 'border border-[#6c4fd1]/15 bg-white/60 text-[#514a7d] hover:bg-[#6c4fd1]/[0.06]'}`}>
              {tab}
            </button>
          ))}
        </nav>

        {activeTab === 'Ficha' && renderSheetTab()}
        {activeTab === 'CADs e Magias' && renderMagicTab()}
        {activeTab === 'Equipamento' && renderEquipmentTab()}
        {activeTab === 'Interlúdio e Vida Acadêmica' && renderInterludeTab()}
        {activeTab === 'Relações e Background' && renderRelationshipsTab()}
      </div>
    </main>
  );
}
