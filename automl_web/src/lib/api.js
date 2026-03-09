// src/lib/api.js
const BASE = '/api'

export async function uploadCSV(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error((await res.json()).detail || 'Upload failed')
  return res.json()
}

export async function runPipeline({ filePath, taskType, targetColumn, priority, extendedDocs }) {
  const form = new FormData()
  form.append('file_path', filePath)
  form.append('task_type', taskType)
  if (targetColumn) form.append('target_column', targetColumn)
  form.append('priority', priority)
  form.append('extended_docs', extendedDocs ? 'true' : 'false')
  const res = await fetch(`${BASE}/run`, { method: 'POST', body: form })
  if (!res.ok) throw new Error((await res.json()).detail || 'Failed to start pipeline')
  return res.json() // { job_id }
}

export async function getStatus(jobId) {
  const res = await fetch(`${BASE}/status/${jobId}`)
  if (!res.ok) throw new Error('Failed to fetch status')
  return res.json()
}

export function streamLogs(jobId, onLog, onDone) {
  const es = new EventSource(`${BASE}/stream/${jobId}`)
  es.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (data.type === 'done') { es.close(); onDone(data.status) }
    else onLog(data)
  }
  es.onerror = () => { es.close(); onDone('error') }
  return es
}

export async function checkHealth() {
  try {
    const res = await fetch(`${BASE}/health`)
    return res.ok ? res.json() : null
  } catch { return null }
}
