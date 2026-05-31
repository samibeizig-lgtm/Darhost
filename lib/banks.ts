export interface TunisianBank {
  name: string;
  code: string;
}

export const TUNISIAN_BANKS: TunisianBank[] = [
  { name: 'ABC – Arab Banking Corporation Tunisie',              code: '17' },
  { name: 'Amen Bank',                                           code: '07' },
  { name: 'ATB – Arab Tunisian Bank',                            code: '14' },
  { name: 'Attijari Bank',                                       code: '04' },
  { name: 'BFPME – Banque de Financement des PME',               code: '31' },
  { name: 'BFT – Banque Franco-Tunisienne',                      code: '09' },
  { name: 'BH Bank – Banque de l\'Habitat',                      code: '05' },
  { name: 'BIAT – Banque Internationale Arabe de Tunisie',       code: '08' },
  { name: 'BNA – Banque Nationale Agricole',                     code: '03' },
  { name: 'BTE – Banque de Tunisie et des Emirats',              code: '21' },
  { name: 'BTK – Banque Tuniso-Koweïtienne',                     code: '26' },
  { name: 'BTS – Banque Tunisienne de Solidarité',               code: '25' },
  { name: 'Citi Bank Tunisie',                                   code: '24' },
  { name: 'La Poste Tunisienne – CCP',                           code: '30' },
  { name: 'NAIB – North Africa International Bank',              code: '28' },
  { name: 'QNB Tunisie – Qatar National Bank',                   code: '27' },
  { name: 'STB – Société Tunisienne de Banque',                  code: '10' },
  { name: 'TSB – Tunisian Saudi Bank',                           code: '20' },
  { name: 'UBCI – Union Bancaire pour le Commerce et l\'Industrie', code: '13' },
  { name: 'UIB – Union Internationale de Banques',               code: '06' },
  { name: 'Wifak Bank',                                          code: '22' },
  { name: 'Zitouna Bank',                                        code: '23' },
];

export function validateRib(digits: string, bankCode: string): string | null {
  if (!/^\d{20}$/.test(digits)) return 'Le RIB doit contenir exactement 20 chiffres';
  if (digits.slice(0, 2) !== bankCode) {
    return `Code banque incorrect : attendu ${bankCode}, saisi ${digits.slice(0, 2)}`;
  }
  try {
    if (BigInt(digits) % BigInt(97) !== BigInt(0)) return 'Clé RIB invalide (vérification modulo 97 échouée)';
  } catch {
    return 'RIB invalide';
  }
  return null;
}

export function formatRibDisplay(digits: string): string {
  // BB GGG AAAAAAAAAAAAA CC
  const d = digits.replace(/\D/g, '');
  const parts = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 18), d.slice(18, 20)];
  return parts.filter(Boolean).join(' ');
}
