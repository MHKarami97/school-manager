import type { Candidate, Election } from '../types'
import { isoStringToJalaali, formatJalaaliDate } from './jalaali'

export function sortCandidatesByVotes(candidates: Candidate[]): Candidate[] {
  return [...candidates].sort((a, b) => b.voteCount - a.voteCount)
}

export function totalVotesOf(election: Election): number {
  return election.candidates.reduce((sum, candidate) => sum + candidate.voteCount, 0)
}

/** نفرات برتر به تعداد کرسی‌های موردنیاز (بر اساس بیشترین رأی). */
export function winnersOf(election: Election): Candidate[] {
  return sortCandidatesByVotes(election.candidates).slice(0, election.seatsCount)
}

export function isWinner(election: Election, candidateId: string): boolean {
  return winnersOf(election).some((candidate) => candidate.id === candidateId)
}

export function votePercentageOf(candidate: Candidate, totalVotes: number): number {
  if (!totalVotes) return 0
  return Math.round((candidate.voteCount / totalVotes) * 100)
}

/** خواندن فایل عکس به‌صورت data URL برای ذخیره‌ی کاملاً محلی (بدون سرور) در IndexedDB. */
export function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function jalaaliDateLabel(iso: string): string {
  if (!iso) return '—'
  const jalaali = isoStringToJalaali(iso)
  return jalaali ? formatJalaaliDate(jalaali) : iso
}
