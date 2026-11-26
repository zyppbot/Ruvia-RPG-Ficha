import type {
  CharacterSheet,
  CharacterSupplement,
  ClassAbility,
  EidosCad,
  EidosFamiliar,
  EidosItemCategory,
  EidosSheetData,
  EidosSpell,
  EidosVehicle,
  Item,
  MiracleGift,
  NovaVehicle,
  NovaVehicleCategory,
  SupplementProtocol,
} from './types';

export interface OrvPayload {
  v?: number;
  p: string;
  c: string;
  s: Record<string, any>;
  f?: {
    name?: string;
    description?: string;
    target?: string;
    meta?: Record<string, any>;
    entry?: Record<string, any>;
  };
}

export const SUPPLEMENT_TO_OFICINA_PAGE: Record<Exclude<CharacterSupplement, 'nave'>, string> = {
  'modulo-basico': 'base',
  'quatro-elementos': 'quatro-elementos',
  'infames-condutores': 'infames-condutores',
  'fading-humans': 'fading-humans',
  'ad-astra': 'ad-astra',
  'nova-ruvia': 'nova-ruvia',
  'portadores-milagres': 'portadores',
  eidos: 'eidos',
};

export const OFICINA_PAGE_TO_SUPPLEMENT: Record<string, Exclude<CharacterSupplement, 'nave'>> = {
  base: 'modulo-basico',
  'quatro-elementos': 'quatro-elementos',
  'infames-condutores': 'infames-condutores',
  'fading-humans': 'fading-humans',
  'ad-astra': 'ad-astra',
  'nova-ruvia': 'nova-ruvia',
  portadores: 'portadores-milagres',
  eidos: 'eidos',
};

const SUPPLEMENT_LABEL: Record<string, string> = {
  'modulo-basico': 'Módulo Básico',
  'quatro-elementos': 'Os Quatro Elementos',
  'infames-condutores': 'Infames Condutores',
  'fading-humans': 'Fading Humans',
  'ad-astra': 'Ad Astra',
  'nova-ruvia': 'Nova Rúvia',
  'portadores-milagres': 'Portadores de Milagres',
  eidos: 'Eidos',
};

const EIDOS_CAT_TO_ID: Record<string, string> = {
  combate: 'com',
  defesa: 'def',
  restauracao: 'res',
  mobilidade: 'mob',
  ambiente: 'amb',
  ilusao: 'ilu',
  controle: 'con',
  aprimoramento: 'apr',
  comunicacao: 'cmu',
  utilitario: 'uti',
};

const EIDOS_ID_TO_CAT: Record<string, string> = {
  com: 'Combate',
  def: 'Defesa',
  res: 'Restauração',
  mob: 'Mobilidade',
  amb: 'Ambiente',
  ilu: 'Ilusão',
  con: 'Controle',
  apr: 'Aprimoramento',
  cmu: 'Comunicação',
  uti: 'Utilitário',
};

const EIDOS_TEMPO_TO_LABEL: Record<string, string> = {
  pri: 'Ação primária',
  com: 'Ação completa',
  sec: 'Ação secundária',
  rea: 'Reação',
  liv: 'Ação livre',
};

const EIDOS_LABEL_TO_TEMPO: Record<string, string> = {
  'acao primaria': 'pri',
  'acao completa': 'com',
  'acao secundaria': 'sec',
  reacao: 'rea',
  'acao livre': 'liv',
};

const AA_ACAO_TO_LABEL: Record<string, string> = {
  pad: 'Ativação padrão',
  rap: 'Ativação Rápida',
  rea: 'Reação',
  liv: 'Ação Livre',
  gat: 'Gatilho Automático',
  pas: 'Passivo',
};

const PM_ACAO_TO_LABEL: Record<string, string> = {
  pri: 'Ação primária',
  sec: 'Ação secundária',
  liv: 'Ação livre',
  rea: 'Reação',
  pas: 'Passivo',
};

const NOVA_VEHICLE_CATEGORIES: NovaVehicleCategory[] = [
  'Bicicleta ou patinete',
  'Moto',
  'Carro',
  'Utilitário',
  'Caminhão',
  'Ônibus',
  'Tanque',
  'Lancha',
  'Barco',
  'Helicóptero',
  'Avião pequeno',
];

function norm(value: string): string {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function b64EncodeUtf8(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

function b64DecodeUtf8(str: string): string {
  return decodeURIComponent(escape(atob(str)));
}

export function encodeOrvCode(payload: OrvPayload): string {
  return 'ORV1:' + b64EncodeUtf8(JSON.stringify(payload));
}

export function parseOrvCode(raw: string): OrvPayload | null {
  try {
    const trimmed = String(raw || '').trim();
    const match = trimmed.match(/ORV1:([A-Za-z0-9+/=]+)/);
    const token = match ? match[1] : trimmed.replace(/^.*?ORV1:/, '');
    if (!token) return null;
    const parsed = JSON.parse(b64DecodeUtf8(token));
    if (!parsed || typeof parsed !== 'object' || !parsed.p || !parsed.c || !parsed.s) {
      return null;
    }
    return parsed as OrvPayload;
  } catch {
    return null;
  }
}

function inferPageFromCalc(calc: string): string {
  if (calc.startsWith('base-')) return 'base';
  if (calc.startsWith('q4-')) return 'quatro-elementos';
  if (calc.startsWith('ic-')) return 'infames-condutores';
  if (calc.startsWith('fh-')) return 'fading-humans';
  if (calc.startsWith('aa-')) return 'ad-astra';
  if (calc.startsWith('nr-')) return 'nova-ruvia';
  if (calc.startsWith('pm-')) return 'portadores';
  if (calc.startsWith('ei-')) return 'eidos';
  return '';
}

function fallbackDescription(payload: OrvPayload): string {
  const s = payload.s || {};
  if (payload.f?.description) return payload.f.description;
  const parts: string[] = [];
  if (s.tipo) parts.push(`Tipo: ${s.tipo}`);
  if (s.esp) parts.push(`Especialização: ${s.esp}`);
  if (s.tema) parts.push(`Tema: ${s.tema}`);
  if (s.desc) parts.push(String(s.desc));
  return parts.join('\n') || 'Importado da Oficina Ruvia.';
}

function mapNovaVehicleCategory(rawCategory: string): NovaVehicleCategory {
  const normalized = norm(rawCategory);
  if (normalized.startsWith('utilitario')) return 'Utilitário';
  const exact = NOVA_VEHICLE_CATEGORIES.find(c => norm(c) === normalized);
  return exact || 'Carro';
}

export type ImportOrvResult =
  | { ok: true; updates: Partial<CharacterSheet>; message: string }
  | { ok: false; error: string };

export function importOrvCodeIntoCharacter(character: CharacterSheet, rawCode: string): ImportOrvResult {
  const payload = parseOrvCode(rawCode);
  if (!payload) {
    return { ok: false, error: 'Código inválido. Cole um código começando com ORV1:.' };
  }
  const cleanCode = encodeOrvCode(payload);
  const currentSupp = character.supplement || 'modulo-basico';
  if (currentSupp === 'nave') {
    return { ok: false, error: 'Fichas de Nave não recebem códigos de personagens.' };
  }
  const codePage = payload.p || inferPageFromCalc(payload.c);
  const codeSupp = OFICINA_PAGE_TO_SUPPLEMENT[codePage];
  if (!codeSupp) {
    return { ok: false, error: 'Suplemento do código não reconhecido.' };
  }
  if (codeSupp !== currentSupp) {
    return {
      ok: false,
      error: `Este código é de ${SUPPLEMENT_LABEL[codeSupp] || codeSupp}, mas a ficha atual é de ${SUPPLEMENT_LABEL[currentSupp] || currentSupp}.`,
    };
  }

  const s = payload.s || {};
  const f = payload.f || {};
  const entry = f.entry || {};
  const meta = f.meta || {};
  const name = String(entry.name || f.name || s.nome || 'Criação da Oficina');
  const description = fallbackDescription(payload);

  // Eidos
  if (currentSupp === 'eidos') {
    const eidos: EidosSheetData = character.supplementData?.eidos || {};
    if (payload.c === 'ei-mag') {
      const cats: string[] = Array.isArray(entry.categories)
        ? entry.categories
        : Array.isArray(s.cats)
          ? s.cats.map((id: string) => EIDOS_ID_TO_CAT[id] || id).filter(Boolean)
          : [];
      const spell: EidosSpell = {
        id: crypto.randomUUID(),
        name,
        categories: cats,
        cores: String(entry.cores || (Array.isArray(s.nucs) ? s.nucs.join(', ') : '')),
        castingTime: String(entry.castingTime || EIDOS_TEMPO_TO_LABEL[s.f?.tempo] || 'Ação primária'),
        duration: String(entry.duration || meta.dur || ''),
        damageType: String(entry.damageType || ''),
        resistanceSkill: String(entry.resistanceSkill || ''),
        pp: String(entry.pp || (meta.pp != null ? `${meta.pp} / ${meta.disp ?? ''}` : '')),
        psCost: String(entry.psCost || meta.ps || ''),
        passive: Boolean(entry.passive ?? s.f?.passiva),
        spiritual: Boolean(entry.spiritual),
        recordedEffect: Boolean(entry.recordedEffect),
        spellSheet: String(entry.spellSheet || description),
        description: String(entry.description || ''),
        orvCode: cleanCode,
      };
      return {
        ok: true,
        updates: {
          supplementData: {
            ...character.supplementData,
            eidos: { ...eidos, spells: [...(eidos.spells || []), spell] },
          },
        },
        message: `Magia "${spell.name}" adicionada à Biblioteca de Magias.`,
      };
    }

    if (payload.c === 'ei-cad') {
      const comp = Number(entry.compilerModel ?? s.comp) || 1;
      const psi = Number(entry.psiprojectorModel ?? s.psi) || 1;
      const mem = Number(entry.memoryModel ?? s.mem) || 1;
      const cad: EidosCad = {
        id: crypto.randomUUID(),
        name,
        format: String(entry.format ?? s.carc ?? ''),
        type: (entry.type || s.tipo || 'Geral') as EidosCad['type'],
        slots: Number(entry.slots ?? meta.slots ?? (s.tipo === 'Integrado' ? 5 : s.tipo === 'Especializado' ? 3 : s.tipo === 'Autônomo' ? 1 : 10)),
        compilerModel: comp,
        psiprojectorModel: psi,
        memoryModel: mem,
        model: String(entry.model ?? meta.modelo ?? Math.min(comp, psi, mem)),
        linked: Boolean(entry.linked ?? false),
        modules: String(entry.modules ?? ''),
        notes: String(entry.notes ?? description),
        spellSlots: [],
        orvCode: cleanCode,
      };
      return {
        ok: true,
        updates: {
          supplementData: {
            ...character.supplementData,
            eidos: { ...eidos, cads: [...(eidos.cads || []), cad] },
          },
        },
        message: `CAD "${cad.name}" adicionado em CADs e Magias.`,
      };
    }

    if (payload.c === 'ei-fam') {
      const familiar: EidosFamiliar = {
        id: crypto.randomUUID(),
        name,
        grade: Number(entry.grade ?? s.grau ?? 1),
        desire: String(entry.desire ?? s.desejo ?? ''),
        taboo: String(entry.taboo ?? s.tabu ?? ''),
        bondLevel: Number(entry.bondLevel ?? s.vinc ?? 1),
        core: String(
          entry.core ??
            `${s.d || 1}d${s.f || 4} · ${s.a || 6} m · ${s.ar || 1} cél. · ${s.c || 20}% · ${s.du || 1} rod. · ${s.t || 'Etéreo'}${s.forma ? ` (${s.forma})` : ''}`
        ),
        defiant: false,
        orvCode: cleanCode,
      };
      return {
        ok: true,
        updates: {
          supplementData: {
            ...character.supplementData,
            eidos: { ...eidos, familiars: [...(eidos.familiars || []), familiar] },
          },
        },
        message: `Familiar "${familiar.name}" adicionado em CADs e Magias.`,
      };
    }

    if (payload.c === 'ei-veic') {
      const maxPV = Number(entry.maxPV ?? meta.pv ?? 25);
      const vehicle: EidosVehicle = {
        id: crypto.randomUUID(),
        name,
        category: Math.max(0, Math.min(6, Number(entry.category ?? s.estr ?? 1))) as EidosItemCategory,
        currentPV: maxPV,
        maxPV,
        defense: Number(entry.defense ?? meta.def ?? 12),
        movement: Number(entry.movement ?? 18),
        armor: Number(entry.armor ?? meta.bl ?? 0),
        seats: Number(entry.seats ?? 4),
        security: Number(entry.security ?? 17),
        refinements: entry.refinements || {
          engine: Number(s.motor ?? 1),
          armor: Number(s.blind ?? 1),
          wheels: Number(s.ctrl ?? 1),
          structure: Number(s.estr ?? 1),
          electronics: Number(s.elet ?? 1),
          security: Math.max(0, Number(s.ap ?? 0)),
        },
        antiMagicInsulation: false,
        enchantedParts: String(entry.enchantedParts ?? description),
        mountedWeapons: [],
        orvCode: cleanCode,
      };
      return {
        ok: true,
        updates: {
          supplementData: {
            ...character.supplementData,
            eidos: { ...eidos, vehicles: [...(eidos.vehicles || []), vehicle] },
          },
        },
        message: `Veículo "${vehicle.name}" adicionado em Equipamento.`,
      };
    }

    const category = Math.max(0, Math.min(6, Number(entry.category ?? s.cat ?? meta.cat ?? 1))) as EidosItemCategory;
    const item: Item = {
      id: crypto.randomUUID(),
      name,
      description,
      category,
      price: entry.price ?? meta.preco,
      type: 'Item',
      orvCode: cleanCode,
    };
    return {
      ok: true,
      updates: { inventory: [...character.inventory, item] },
      message: `Item "${item.name}" (categoria ${category}) adicionado ao Inventário.`,
    };
  }

  // Ad Astra
  if (currentSupp === 'ad-astra') {
    const sd = character.supplementData || {};
    if (payload.c === 'aa-prot') {
      const protocol: SupplementProtocol = {
        id: crypto.randomUUID(),
        name,
        description,
        actionType: String(entry.actionType || AA_ACAO_TO_LABEL[s.acao] || 'Ativação padrão'),
        energyCost: Number(entry.energyCost ?? meta.pe ?? 1),
        matrixPoints: Number(entry.matrixPoints ?? meta.spent ?? 0),
        snippets: Array.isArray(entry.snippets) ? entry.snippets.slice(0, 2) : [],
        orvCode: cleanCode,
      };
      return {
        ok: true,
        updates: {
          supplementData: {
            ...sd,
            matrixChoice: sd.matrixChoice === 'Sem Matriz' || !sd.matrixChoice ? 'Portador' : sd.matrixChoice,
            protocols: [...(sd.protocols || []), protocol],
          },
        },
        message: `Protocolo "${protocol.name}" adicionado à Biblioteca de Protocolos.`,
      };
    }
    if (payload.c === 'aa-snip') {
      const snippetText = entry.snippetText || (s.efeito ? `${name}: ${s.efeito}` : name);
      return {
        ok: true,
        updates: {
          supplementData: { ...sd, snippets: [...(sd.snippets || []), snippetText] },
        },
        message: `Snippet "${name}" adicionado em Snippets disponíveis.`,
      };
    }
    if (payload.c === 'aa-tema') {
      const nextNotes = character.notes ? `${character.notes}\n\n${description}` : description;
      return {
        ok: true,
        updates: {
          supplementData: { ...sd, matrixTheme: name, matrixChoice: 'Portador' },
          notes: nextNotes,
        },
        message: `Tema da Matriz "${name}" aplicado à ficha.`,
      };
    }
    if (payload.c === 'aa-load') {
      const nextNotes = character.notes ? `${character.notes}\n\n${description}` : description;
      return {
        ok: true,
        updates: { notes: nextNotes },
        message: `Resumo de Loadout "${name}" adicionado às Notas.`,
      };
    }
    // aa-imp -> inventory
    const item: Item = {
      id: crypto.randomUUID(),
      name,
      description,
      type: 'Implante',
      orvCode: cleanCode,
    };
    return {
      ok: true,
      updates: { inventory: [...character.inventory, item] },
      message: `Implante "${item.name}" adicionado ao Inventário.`,
    };
  }

  // Portadores de Milagres
  if (currentSupp === 'portadores-milagres') {
    const sd = character.supplementData || {};
    if (payload.c === 'pm-dom') {
      const gift: MiracleGift = {
        id: crypto.randomUUID(),
        name,
        description,
        actionType: String(entry.actionType || PM_ACAO_TO_LABEL[s.acao] || 'Ação primária'),
        impetusCost: Number(entry.impetusCost ?? meta.imp ?? 0),
        attackForm: (entry.attackForm || s.forma || 'Afinidade') as MiracleGift['attackForm'],
        combinable: Boolean(entry.combinable ?? s.comb),
        equipped: false,
        orvCode: cleanCode,
      };
      return {
        ok: true,
        updates: {
          supplementData: { ...sd, miracleGifts: [...(sd.miracleGifts || []), gift] },
        },
        message: `Dom "${gift.name}" adicionado à Biblioteca de Dons.`,
      };
    }
    if (payload.c === 'pm-tema') {
      const nextBenefits = sd.bondBenefits ? `${sd.bondBenefits}\n${description}` : description;
      return {
        ok: true,
        updates: {
          supplementData: {
            ...sd,
            miracleTheme: name,
            milagreTheme: name,
            bondBenefits: nextBenefits,
          } as CharacterSheet['supplementData'],
        },
        message: `Tema do Milagre "${name}" aplicado à ficha.`,
      };
    }
    if (payload.c === 'pm-vinc') {
      const nextRank = Number(entry.bondRank ?? meta.grau ?? sd.bondRank ?? 1);
      const nextSlots = Number(entry.giftSlots ?? meta.slots ?? sd.giftSlots ?? 3);
      return {
        ok: true,
        updates: {
          supplementData: { ...sd, bondRank: nextRank, giftSlots: nextSlots },
        },
        message: `Vínculo (grau ${nextRank}, ${nextSlots} slots) atualizado na ficha.`,
      };
    }
    if (payload.c === 'pm-comb') {
      const ability: ClassAbility = {
        name,
        description,
        category: 'Talentos Heroicos',
        orvCode: cleanCode,
      };
      return {
        ok: true,
        updates: { abilities: [...character.abilities, ability] },
        message: `Combinação "${name}" adicionada em Talentos Heroicos.`,
      };
    }
    // pm-veic -> inventory
    const item: Item = {
      id: crypto.randomUUID(),
      name,
      description,
      type: 'Veículo',
      orvCode: cleanCode,
    };
    return {
      ok: true,
      updates: { inventory: [...character.inventory, item] },
      message: `Veículo "${item.name}" adicionado ao Inventário.`,
    };
  }

  // Nova Rúvia
  if (currentSupp === 'nova-ruvia') {
    const sd = character.supplementData || {};
    if (payload.c === 'nr-feit') {
      const ability: ClassAbility = {
        name,
        description,
        category: 'Habilidades',
        orvCode: cleanCode,
      };
      return {
        ok: true,
        updates: { abilities: [...character.abilities, ability] },
        message: `Feitiço "${name}" adicionado em Habilidades.`,
      };
    }
    if (payload.c === 'nr-veic') {
      const maxPV = Number(entry.maxPV ?? meta.pv ?? 25);
      const vehicle: NovaVehicle = {
        id: crypto.randomUUID(),
        name,
        category: mapNovaVehicleCategory(String(entry.category ?? s.tipo ?? 'Carro')),
        currentPV: maxPV,
        maxPV,
        defense: Number(entry.defense ?? meta.def ?? 12),
        movement: Number(entry.movement ?? 18),
        armor: Number(entry.armor ?? meta.bl ?? 17),
        seats: Number(entry.seats ?? 5),
        security: Number(entry.security ?? 15),
        refinements: entry.refinements || {
          engine: Number(s.r_motor ?? 0),
          armor: Number(s.r_blind ?? 0),
          wheels: Number(s.r_pneus ?? 0),
          structure: Number(s.r_ref ?? 0),
          electronics: Number(s.r_elet ?? 0),
          security: Number(s.r_elet ?? 0),
        },
        antiMagicInsulation: Boolean(entry.antiMagicInsulation ?? s.iso),
        enchantedParts: String(entry.enchantedParts ?? description),
        mountedWeapons: [],
        orvCode: cleanCode,
      };
      return {
        ok: true,
        updates: { supplementData: { ...sd, vehicles: [...(sd.vehicles || []), vehicle] } },
        message: `Veículo "${vehicle.name}" adicionado à Garagem.`,
      };
    }
  }

  // Default: Módulo Básico, Quatro Elementos, Infames Condutores, Fading Humans, Nova Rúvia (nr-enc) -> Inventory
  const itemType =
    entry.type ||
    (payload.c === 'ic-disp'
      ? 'Dispositivo'
      : payload.c === 'ic-veic' || payload.c === 'fh-veic'
        ? 'Veículo'
        : payload.c === 'fh-gad'
          ? 'Gadget'
          : payload.c === 'q4-eng' || payload.c === 'ic-eng'
            ? 'Engenhoca'
            : 'Encantamento');

  const item: Item = {
    id: crypto.randomUUID(),
    name,
    description,
    type: itemType,
    orvCode: cleanCode,
  };
  return {
    ok: true,
    updates: { inventory: [...character.inventory, item] },
    message: `"${item.name}" adicionado ao Inventário.`,
  };
}

// ---------- Export helpers (Ficha -> Oficina ORV1:) ----------

function mergeExistingCode(existingCode: string | undefined, patch: Partial<OrvPayload> & { sPatch?: Record<string, any> }): OrvPayload | null {
  if (!existingCode) return null;
  const parsed = parseOrvCode(existingCode);
  if (!parsed) return null;
  return {
    ...parsed,
    v: 2,
    s: { ...(parsed.s || {}), ...(patch.sPatch || {}) },
    f: { ...(parsed.f || {}), ...(patch.f || {}) },
  };
}

export function encodeInventoryItemToOrvCode(supplement: CharacterSupplement | undefined, item: Item): string {
  const supp = supplement && supplement !== 'nave' ? supplement : 'modulo-basico';
  const page = SUPPLEMENT_TO_OFICINA_PAGE[supp] || 'base';
  let defaultCalc = 'base-enc';
  if (supp === 'quatro-elementos') defaultCalc = 'q4-eng';
  else if (supp === 'infames-condutores') defaultCalc = item.type === 'Dispositivo' ? 'ic-disp' : item.type === 'Veículo' ? 'ic-veic' : 'ic-eng';
  else if (supp === 'fading-humans') defaultCalc = item.type === 'Veículo' ? 'fh-veic' : 'fh-gad';
  else if (supp === 'ad-astra') defaultCalc = 'aa-imp';
  else if (supp === 'nova-ruvia') defaultCalc = 'nr-enc';
  else if (supp === 'portadores-milagres') defaultCalc = 'pm-veic';
  else if (supp === 'eidos') defaultCalc = 'ei-item';

  const merged = mergeExistingCode(item.orvCode, {
    sPatch: {
      nome: item.name,
      desc: item.description,
      ...(supp === 'eidos' ? { cat: item.category ?? 1, ...(item.price != null ? { preco: item.price } : {}) } : {}),
    },
    f: { name: item.name, description: item.description },
  });
  if (merged) return encodeOrvCode(merged);

  const s: Record<string, any> = { nome: item.name, desc: item.description };
  if (defaultCalc === 'ei-item') {
    s.cat = item.category ?? 1;
    s.preco = item.price ?? 30;
  } else if (defaultCalc === 'nr-enc') {
    s.item = item.name;
  }
  return encodeOrvCode({
    v: 2,
    p: page,
    c: defaultCalc,
    s,
    f: { name: item.name, description: item.description, entry: { type: item.type, category: item.category, price: item.price } },
  });
}

export function encodeAbilityToOrvCode(supplement: CharacterSupplement | undefined, ability: ClassAbility): string {
  const supp = supplement && supplement !== 'nave' ? supplement : 'modulo-basico';
  const page = SUPPLEMENT_TO_OFICINA_PAGE[supp] || 'base';
  const defaultCalc = supp === 'nova-ruvia' ? 'nr-feit' : supp === 'portadores-milagres' ? 'pm-comb' : 'base-enc';

  const merged = mergeExistingCode(ability.orvCode, {
    sPatch: { nome: ability.name, desc: ability.description },
    f: { name: ability.name, description: ability.description },
  });
  if (merged) return encodeOrvCode(merged);

  return encodeOrvCode({
    v: 2,
    p: page,
    c: defaultCalc,
    s: { nome: ability.name, desc: ability.description },
    f: { name: ability.name, description: ability.description },
  });
}

export function encodeProtocolToOrvCode(protocol: SupplementProtocol): string {
  const actNorm = norm(protocol.actionType);
  const acao = actNorm.includes('rapida')
    ? 'rap'
    : actNorm.includes('reacao')
      ? 'rea'
      : actNorm.includes('livre')
        ? 'liv'
        : actNorm.includes('gatilho')
          ? 'gat'
          : actNorm.includes('passiv')
            ? 'pas'
            : 'pad';

  const merged = mergeExistingCode(protocol.orvCode, {
    sPatch: { nome: protocol.name, desc: protocol.description, acao },
    f: { name: protocol.name, description: protocol.description },
  });
  if (merged) return encodeOrvCode(merged);

  return encodeOrvCode({
    v: 2,
    p: 'ad-astra',
    c: 'aa-prot',
    s: { nome: protocol.name, desc: protocol.description, acao },
    f: {
      name: protocol.name,
      description: protocol.description,
      entry: {
        actionType: protocol.actionType,
        energyCost: protocol.energyCost,
        matrixPoints: protocol.matrixPoints,
        snippets: protocol.snippets,
      },
    },
  });
}

export function encodeNovaVehicleToOrvCode(vehicle: NovaVehicle): string {
  const tipo = vehicle.category === 'Utilitário' ? 'Utilitário (van, SUV)' : vehicle.category;
  const sPatch = {
    nome: vehicle.name,
    tipo,
    r_motor: vehicle.refinements.engine,
    r_blind: vehicle.refinements.armor,
    r_pneus: vehicle.refinements.wheels,
    r_ref: vehicle.refinements.structure,
    r_elet: vehicle.refinements.electronics,
    iso: vehicle.antiMagicInsulation,
    armas: vehicle.mountedWeapons.length,
    desc: vehicle.enchantedParts,
  };
  const merged = mergeExistingCode(vehicle.orvCode, {
    sPatch,
    f: { name: vehicle.name, description: vehicle.enchantedParts },
  });
  if (merged) return encodeOrvCode(merged);

  return encodeOrvCode({
    v: 2,
    p: 'nova-ruvia',
    c: 'nr-veic',
    s: sPatch,
    f: { name: vehicle.name, description: vehicle.enchantedParts },
  });
}

export function encodeMiracleGiftToOrvCode(gift: MiracleGift): string {
  const actNorm = norm(gift.actionType);
  const acao = actNorm.includes('secund')
    ? 'sec'
    : actNorm.includes('livre')
      ? 'liv'
      : actNorm.includes('reac')
        ? 'rea'
        : actNorm.includes('passiv')
          ? 'pas'
          : 'pri';
  const forma = gift.attackForm === 'Nenhuma' ? 'Afinidade' : gift.attackForm;
  const sPatch = {
    nome: gift.name,
    forma,
    comb: gift.combinable,
    acao,
    desc: gift.description,
  };
  const merged = mergeExistingCode(gift.orvCode, {
    sPatch,
    f: { name: gift.name, description: gift.description },
  });
  if (merged) return encodeOrvCode(merged);

  return encodeOrvCode({
    v: 2,
    p: 'portadores',
    c: 'pm-dom',
    s: sPatch,
    f: {
      name: gift.name,
      description: gift.description,
      entry: { actionType: gift.actionType, impetusCost: gift.impetusCost, attackForm: gift.attackForm, combinable: gift.combinable },
    },
  });
}

export function encodeEidosSpellToOrvCode(spell: EidosSpell): string {
  const cats = (spell.categories || [])
    .map(c => EIDOS_CAT_TO_ID[norm(c)] || c)
    .filter(c => Boolean(EIDOS_ID_TO_CAT[c]));
  const nucs = String(spell.cores || '')
    .split(/[,;/]+/)
    .map(x => x.trim())
    .filter(Boolean);
  const tempo = EIDOS_LABEL_TO_TEMPO[norm(spell.castingTime)] || 'pri';

  const existing = spell.orvCode ? parseOrvCode(spell.orvCode) : null;
  if (existing) {
    const merged: OrvPayload = {
      ...existing,
      v: 2,
      s: {
        ...(existing.s || {}),
        nome: spell.name,
        ...(cats.length ? { cats } : {}),
        ...(nucs.length ? { nucs } : {}),
        f: {
          ...((existing.s && existing.s.f) || {}),
          tempo,
          passiva: spell.passive,
        },
      },
      f: {
        ...(existing.f || {}),
        name: spell.name,
        description: spell.spellSheet || spell.description,
      },
    };
    return encodeOrvCode(merged);
  }

  return encodeOrvCode({
    v: 2,
    p: 'eidos',
    c: 'ei-mag',
    s: {
      nome: spell.name,
      cats: cats.length ? cats : ['com'],
      nucs: nucs.length ? nucs : ['Fogo'],
      f: { tempo, passiva: spell.passive },
    },
    f: {
      name: spell.name,
      description: spell.spellSheet || spell.description,
      entry: {
        categories: spell.categories,
        cores: spell.cores,
        castingTime: spell.castingTime,
        duration: spell.duration,
        damageType: spell.damageType,
        resistanceSkill: spell.resistanceSkill,
        pp: spell.pp,
        psCost: spell.psCost,
        passive: spell.passive,
        spiritual: spell.spiritual,
        recordedEffect: spell.recordedEffect,
        spellSheet: spell.spellSheet,
        description: spell.description,
      },
    },
  });
}

export function encodeEidosCadToOrvCode(cad: EidosCad): string {
  const sPatch = {
    nome: cad.name,
    tipo: cad.type,
    carc: cad.format,
    comp: cad.compilerModel,
    psi: cad.psiprojectorModel,
    mem: cad.memoryModel,
    desc: cad.notes,
    _modNames: cad.modules,
  };
  const merged = mergeExistingCode(cad.orvCode, {
    sPatch,
    f: { name: cad.name, description: cad.notes },
  });
  if (merged) return encodeOrvCode(merged);

  return encodeOrvCode({
    v: 2,
    p: 'eidos',
    c: 'ei-cad',
    s: sPatch,
    f: {
      name: cad.name,
      description: cad.notes,
      entry: {
        format: cad.format,
        type: cad.type,
        slots: cad.slots,
        compilerModel: cad.compilerModel,
        psiprojectorModel: cad.psiprojectorModel,
        memoryModel: cad.memoryModel,
        model: cad.model,
        linked: cad.linked,
        modules: cad.modules,
        notes: cad.notes,
      },
    },
  });
}

export function encodeEidosFamiliarToOrvCode(familiar: EidosFamiliar): string {
  const coreMatch = String(familiar.core || '').match(
    /(\d+)\s*d\s*(\d+).*?(\d+)\s*m.*?(\d+)\s*c[eé]l.*?(\d+)\s*%.*?(\d+)\s*rod/i
  );
  const sPatch: Record<string, any> = {
    nome: familiar.name,
    grau: familiar.grade,
    vinc: familiar.bondLevel,
    desejo: familiar.desire,
    tabu: familiar.taboo,
  };
  if (coreMatch) {
    sPatch.d = Number(coreMatch[1]);
    sPatch.f = Number(coreMatch[2]);
    sPatch.a = Number(coreMatch[3]);
    sPatch.ar = Number(coreMatch[4]);
    sPatch.c = Number(coreMatch[5]);
    sPatch.du = Number(coreMatch[6]);
  }
  const merged = mergeExistingCode(familiar.orvCode, {
    sPatch,
    f: { name: familiar.name, description: familiar.core },
  });
  if (merged) return encodeOrvCode(merged);

  return encodeOrvCode({
    v: 2,
    p: 'eidos',
    c: 'ei-fam',
    s: sPatch,
    f: { name: familiar.name, description: familiar.core },
  });
}

export function encodeEidosVehicleToOrvCode(vehicle: EidosVehicle): string {
  const sPatch = {
    nome: vehicle.name,
    motor: vehicle.refinements.engine,
    estr: vehicle.refinements.structure,
    blind: vehicle.refinements.armor,
    ctrl: vehicle.refinements.wheels,
    elet: vehicle.refinements.electronics,
    desc: vehicle.enchantedParts,
  };
  const merged = mergeExistingCode(vehicle.orvCode, {
    sPatch,
    f: { name: vehicle.name, description: vehicle.enchantedParts },
  });
  if (merged) return encodeOrvCode(merged);

  return encodeOrvCode({
    v: 2,
    p: 'eidos',
    c: 'ei-veic',
    s: sPatch,
    f: { name: vehicle.name, description: vehicle.enchantedParts },
  });
}

export async function copyOrvCodeToClipboard(code: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(code);
      return true;
    }
  } catch {
    // fallback below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = code;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
