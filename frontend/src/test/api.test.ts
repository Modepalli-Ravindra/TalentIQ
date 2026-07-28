import { describe, it, expect, beforeEach, vi } from 'vitest'
import { jobsApi, aiApi } from '@/lib/api'

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

function mockFetchOk(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  })
}

function mockFetchError(status: number, message: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => message,
  })
}

describe('jobsApi', () => {
  it('list returns paginated results', async () => {
    const mockData = { data: [], count: 0, page: 1, per_page: 20, total_pages: 0 }
    mockFetchOk(mockData)
    const result = await jobsApi.list(1, 20)
    expect(result).toEqual(mockData)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/jobs?page=1&per_page=20'),
      expect.any(Object)
    )
  })

  it('search with keyword', async () => {
    mockFetchOk({ data: [], count: 0 })
    await jobsApi.search({ keyword: 'python' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('keyword=python'),
      expect.any(Object)
    )
  })

  it('getById returns job', async () => {
    mockFetchOk({ id: '1', title: 'Engineer' })
    const result = await jobsApi.getById('1')
    expect(result.id).toBe('1')
  })

  it('sync triggers ETL', async () => {
    mockFetchOk({ status: 'success', imported: 10 })
    const result = await jobsApi.sync(5)
    expect(result.status).toBe('success')
  })

  it('handles API errors', async () => {
    mockFetchError(500, 'Internal Server Error')
    await expect(jobsApi.list()).rejects.toThrow('API error 500')
  })
})

describe('aiApi', () => {
  it('summarize sends correct payload', async () => {
    mockFetchOk({ status: 'success', data: { summary: 'Test' } })
    const result = await aiApi.summarize('A detailed job description for testing purposes.')
    expect(result.data.summary).toBe('Test')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ai/summarize'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('parseResume sends resume text', async () => {
    mockFetchOk({ status: 'success', data: { name: 'John' } })
    await aiApi.parseResume('Resume content here with enough text')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ai/parse-resume'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('extractSkills sends text', async () => {
    mockFetchOk({ status: 'success', data: { skills: ['Python'] } })
    const result = await aiApi.extractSkills('Python JavaScript React developer')
    expect(result.data.skills).toContain('Python')
  })

  it('fitAnalysis sends job and profile', async () => {
    mockFetchOk({ status: 'success', data: { match_score: 85 } })
    const result = await aiApi.fitAnalysis('Job description here', { skills: ['Python'] })
    expect(result.data.match_score).toBe(85)
  })

  it('biasAnalysis sends job text', async () => {
    mockFetchOk({ status: 'success', data: { issues: [] } })
    await aiApi.biasAnalysis('We are looking for a young energetic developer')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/ai/bias-analysis'),
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('generateEmail sends params', async () => {
    mockFetchOk({ status: 'success', data: { subject: 'Hi', body: 'Hello' } })
    const result = await aiApi.generateEmail('interview', 'John', 'Engineer', 'Corp')
    expect(result.data.subject).toBe('Hi')
  })

  it('chat sends prompt', async () => {
    mockFetchOk({ status: 'success', data: { response: 'Hello!' } })
    const result = await aiApi.chat('Hello')
    expect(result.data.response).toBe('Hello!')
  })

  it('handles 429 rate limit', async () => {
    mockFetchError(429, 'Rate limit exceeded')
    await expect(aiApi.chat('test prompt')).rejects.toThrow('API error 429')
  })
})
