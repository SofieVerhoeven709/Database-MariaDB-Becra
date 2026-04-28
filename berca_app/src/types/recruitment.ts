export type RecruitmentContactType = 'email' | 'phone'
export type RecruitmentContractType = 'permanent' | 'temporary'
export type RecruitmentWorkRegime = 'fulltime' | 'parttime'

export interface RecruitmentApplicant {
  id: string
  candidateName: string
  profile: string | null
  contactDate: string | null
  interviewDate: string | null
  contactType: RecruitmentContactType
  description: string | null
  cvPath: string | null
  potential: boolean
  retained: boolean
  createdAt: string
  createdBy: string
  createdByName: string | null
  updatedAt: string | null
  deleted: boolean
}

export interface RecruitmentVacancy {
  id: string
  title: string
  description: string | null
  department: string
  contractType: RecruitmentContractType
  workRegime: RecruitmentWorkRegime
  salaryMin: number | null
  salaryMax: number | null
  publishWebsite: boolean
  publishVdab: boolean
  publishOther: boolean
  publishLinkedIn: boolean
  publishTempAgencies: boolean
  publishRecruitmentAgencies: boolean
  otherPublication: string | null
  createdAt: string
  createdBy: string
  createdByName: string | null
  updatedAt: string | null
  deleted: boolean
}
