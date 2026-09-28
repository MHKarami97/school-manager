import type { Candidate, CandidateType, Election, ElectionStatus, ElectionType } from '../types'

export const ELECTION_TYPE_LABELS: Record<ElectionType, string> = {
  'student-council': 'شورای دانش‌آموزی',
  'parent-association': 'انجمن اولیا و مربیان',
}

export const ELECTION_TYPES: ElectionType[] = ['student-council', 'parent-association']

export const ELECTION_STATUS_LABELS: Record<ElectionStatus, string> = {
  candidacy: 'ثبت‌نام نامزدها',
  voting: 'در حال رأی‌گیری',
  counting: 'شمارش آرا',
  completed: 'نتایج نهایی',
}

export const ELECTION_STATUS_BADGE_CLASSES: Record<ElectionStatus, string> = {
  candidacy: 'bg-ink-100 text-ink-600 dark:bg-ink-800 dark:text-ink-300',
  voting: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  counting: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
}

export const ELECTION_STATUSES: ElectionStatus[] = ['candidacy', 'voting', 'counting', 'completed']

export const CANDIDATE_TYPE_LABELS: Record<CandidateType, string> = {
  student: 'دانش‌آموز',
  parent: 'والد',
}

export function candidateTypeOfElection(electionType: ElectionType): CandidateType {
  return electionType === 'student-council' ? 'student' : 'parent'
}

export function createEmptyCandidate(electionId: string, type: CandidateType): Candidate {
  return {
    id: crypto.randomUUID(),
    electionId,
    name: '',
    type,
    gradeOrClass: '',
    statement: '',
    photoDataUrl: null,
    voteCount: 0,
  }
}

export function createEmptyElection(): Election {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    title: '',
    type: 'student-council',
    academicYear: '',
    votingStartDate: '',
    votingEndDate: '',
    status: 'candidacy',
    seatsCount: 5,
    candidates: [],
    createdAt: now,
    updatedAt: now,
  }
}

/** ترتیب منطقی مراحل انتخابات برای دکمه‌های «مرحله بعد / قبل». */
export const ELECTION_STATUS_ORDER: ElectionStatus[] = ['candidacy', 'voting', 'counting', 'completed']
