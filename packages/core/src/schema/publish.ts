import { z } from 'zod'

export const PublishStageSchema = z.enum(['prepare', 'upload', 'commit', 'build'])
export type PublishStage = z.infer<typeof PublishStageSchema>

export const PublishStatusSchema = z.enum(['queued', 'building', 'success', 'failed'])
export type PublishStatus = z.infer<typeof PublishStatusSchema>

export const PublishJobSchema = z.object({
  id: z.string().uuid(),
  articleId: z.string().uuid(),
  articleSlug: z.string(),
  status: PublishStatusSchema,
  stage: PublishStageSchema,
  commitSha: z.string().nullable().default(null),
  runId: z.number().nullable().default(null),
  runUrl: z.string().nullable().default(null),
  errorCode: z.string().nullable().default(null),
  errorMessage: z.string().nullable().default(null),
  fingerprint: z.string().nullable().default(null),
  checkedAt: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type PublishJob = z.infer<typeof PublishJobSchema>

export const GitHubConnectionSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  branch: z.string().min(1).default('main'),
  token: z.string().min(1),
  connectedAt: z.string(),
  lastVerifiedAt: z.string(),
})

export type GitHubConnection = z.infer<typeof GitHubConnectionSchema>

export const PublishErrorCodeSchema = z.enum([
  'token_invalid',
  'forbidden',
  'repo_not_found',
  'branch_not_found',
  'conflict',
  'network',
  'image_upload_failed',
  'commit_failed',
  'build_failed',
  'unknown',
])

export type PublishErrorCode = z.infer<typeof PublishErrorCodeSchema>
