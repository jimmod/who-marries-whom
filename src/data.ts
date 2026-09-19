import summary from './census-summary.json';

export type Profile = { id: string; gender: string; genderCode: string; occupation: string; fullOccupation: string; noc: string };
export type Estimate = { percent: number; lower: number; upper: number; quality: string };
export type Selection = { rows: (Estimate & { target: string })[]; pooled: Estimate | null; hasUnreportedRemainder: boolean; includedPercent: number; linkedPercent: number };
export type Result = Estimate & { id: string; occupation: string; fullOccupation: string; gender: string };
export const metadata = summary.metadata;
export const profiles: Profile[] = summary.profiles;
export const occupations = profiles.filter(p => p.genderCode === '1');
const selections: Record<string, Selection> = summary.selections;

export function getSelection(gender: string, noc: string) {
  const profile = profiles.find(p => p.genderCode === gender && p.noc === noc);
  if (!profile) throw new Error('Unsupported census category');
  const selection = selections[profile.id];
  const rows: Result[] = selection.rows.map(row => {
    const target = profiles.find(p => p.id === row.target);
    if (!target) throw new Error('Invalid summary category');
    return { ...target, ...row };
  });
  return { profile, selection, rows };
}
