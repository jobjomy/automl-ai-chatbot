// src/lib/download.js — TXT and PDF only (DOCX removed)

// ── TXT ───────────────────────────────────────────────────────────
export function downloadTxt(content, filename = 'automl_report.txt') {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  triggerDownload(blob, filename)
}

// ── PDF ───────────────────────────────────────────────────────────
export async function downloadPdf(markdownContent, filename = 'automl_report.pdf') {
  if (!window.jspdf) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
  }
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const mL = 50, mR = 50, mT = 60, mB = 55, maxW = pageW - mL - mR
  let y = mT

  const PURPLE  = [109, 40, 217]
  const CYAN    = [6, 182, 212]
  const BODY    = [50, 50, 65]
  const GRAY    = [130, 130, 150]
  const CODE_BG = [22, 22, 35]
  const CODE_FG = [160, 220, 255]
  const CODE_CM = [100, 160, 100]  // comment color

  const addFooter = () => {
    const pg = doc.internal.getCurrentPageInfo().pageNumber
    doc.setFontSize(8).setTextColor(...GRAY).setFont('Helvetica', 'normal')
    doc.text(`AutoML Agent Report  ·  Page ${pg}`, mL, pageH - 22)
    doc.setDrawColor(...GRAY).setLineWidth(0.3)
    doc.line(mL, pageH - 32, mL + maxW, pageH - 32)
  }

  const newPage = () => { addFooter(); doc.addPage(); y = mT }
  const checkY  = (need) => { if (y + need > pageH - mB) newPage() }
  const strip   = (t) => t.replace(/\*\*(.*?)\*\*/g,'$1').replace(/\*(.*?)\*/g,'$1').replace(/`(.*?)`/g,'$1').replace(/\[(.*?)\]\(.*?\)/g,'$1')

  let inCode = false, codeLines = [], codeLang = ''

  const flushCode = () => {
    if (!codeLines.length) { inCode = false; codeLines = []; codeLang = ''; return }
    const lH = 12.5, padV = 10, padH = 8
    const totalH = codeLines.length * lH + padV * 2 + 20
    checkY(Math.min(totalH, pageH - mT - mB))

    // Code block background
    const boxH = Math.min(totalH, pageH - mB - y)
    doc.setFillColor(...CODE_BG)
    doc.roundedRect(mL - 4, y - 4, maxW + 8, boxH, 4, 4, 'F')
    doc.setDrawColor(50, 50, 70).setLineWidth(0.5)
    doc.roundedRect(mL - 4, y - 4, maxW + 8, boxH, 4, 4, 'S')

    // Language badge
    if (codeLang) {
      doc.setFontSize(7).setTextColor(...GRAY).setFont('Courier', 'normal')
      doc.text(codeLang, mL + padH, y + padV - 2)
    }
    y += padV + 2

    doc.setFontSize(8.5).setFont('Courier', 'normal')
    for (const cl of codeLines) {
      checkY(lH + 4)
      const trimCl = cl.trim()
      // Color: comments green-gray, rest cyan
      if (trimCl.startsWith('#')) doc.setTextColor(...CODE_CM)
      else if (trimCl.startsWith('import') || trimCl.startsWith('from')) doc.setTextColor(180, 140, 255)
      else doc.setTextColor(...CODE_FG)
      const wrapped = doc.splitTextToSize(cl.length ? cl : ' ', maxW - padH * 2)
      doc.text(wrapped, mL + padH, y)
      y += wrapped.length * lH
    }

    y += padV + 8
    doc.setFont('Helvetica', 'normal')
    inCode = false; codeLines = []; codeLang = ''
  }

  const lines = markdownContent.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i], t = raw.trim()

    if (t.startsWith('```')) {
      if (!inCode) { inCode = true; codeLang = t.slice(3).trim() }
      else flushCode()
      continue
    }
    if (inCode) { codeLines.push(raw); continue }
    if (!t) { y += 5; continue }

    // H1
    if (/^# (?!#)/.test(t)) {
      checkY(55); y += 10
      doc.setFontSize(20).setFont('Helvetica','bold').setTextColor(...PURPLE)
      const w = doc.splitTextToSize(t.replace(/^# /,''), maxW)
      doc.text(w, mL, y); y += w.length * 24 + 6
      doc.setDrawColor(...PURPLE).setLineWidth(1).line(mL, y, mL + maxW, y)
      y += 14
    }
    // H2
    else if (/^## (?!#)/.test(t)) {
      checkY(40); y += 10
      doc.setFontSize(14).setFont('Helvetica','bold').setTextColor(...PURPLE)
      const w = doc.splitTextToSize(t.replace(/^## /,''), maxW)
      doc.text(w, mL, y); y += w.length * 18 + 5
    }
    // H3
    else if (/^### /.test(t)) {
      checkY(30); y += 6
      doc.setFontSize(11).setFont('Helvetica','bold').setTextColor(...CYAN)
      const w = doc.splitTextToSize(t.replace(/^### /,''), maxW)
      doc.text(w, mL, y); y += w.length * 15 + 4
    }
    // Bullet
    else if (/^[-*] /.test(t)) {
      checkY(16)
      doc.setFontSize(9.5).setFont('Helvetica','normal').setTextColor(...BODY)
      const w = doc.splitTextToSize('• ' + strip(t.replace(/^[-*] /,'')), maxW - 14)
      doc.text(w, mL + 10, y); y += w.length * 13 + 3
    }
    // Numbered
    else if (/^\d+\. /.test(t)) {
      checkY(16)
      const num = t.match(/^(\d+)\./)[1]
      doc.setFontSize(9.5).setFont('Helvetica','normal').setTextColor(...BODY)
      const w = doc.splitTextToSize(`${num}. ${strip(t.replace(/^\d+\. /,''))}`, maxW - 12)
      doc.text(w, mL + 6, y); y += w.length * 13 + 3
    }
    // HR
    else if (/^---+$/.test(t)) {
      checkY(12)
      doc.setDrawColor(...GRAY).setLineWidth(0.4).line(mL, y, mL + maxW, y)
      y += 10
    }
    // Paragraph
    else {
      checkY(14)
      doc.setFontSize(9.5).setFont('Helvetica','normal').setTextColor(...BODY)
      const w = doc.splitTextToSize(strip(t), maxW)
      doc.text(w, mL, y); y += w.length * 13.5 + 3
    }
  }

  if (inCode && codeLines.length) flushCode()
  addFooter()
  doc.save(filename)
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return }
    const s = document.createElement('script')
    s.src = src; s.onload = resolve; s.onerror = reject
    document.head.appendChild(s)
  })
}

// ── Extract all Python code blocks from markdown ──────────────────
export function extractPythonCode(markdownContent) {
  const blocks = []
  const regex = /```(?:python)?\n([\s\S]*?)```/g
  let match
  while ((match = regex.exec(markdownContent)) !== null) {
    const code = match[1].trim()
    if (code.length > 20) blocks.push(code)
  }
  if (!blocks.length) return null

  const header = `# AutoML Pipeline — Generated Code\n# Generated by AutoML Agent\n# https://automl-agent.app\n\n`
  return header + blocks.join('\n\n# ' + '─'.repeat(60) + '\n\n')
}

// ── Download as .py ───────────────────────────────────────────────
export function downloadPy(markdownContent, filename = 'automl_pipeline.py') {
  const code = extractPythonCode(markdownContent)
  if (!code) { alert('No Python code found in the report.'); return }
  const blob = new Blob([code], { type: 'text/x-python;charset=utf-8' })
  triggerDownload(blob, filename)
}

// ── Download as .ipynb (Jupyter Notebook) ────────────────────────
export function downloadIpynb(markdownContent, reportContent, filename = 'automl_pipeline.ipynb') {
  const codeBlocks = []
  const regex = /```(?:python)?\n([\s\S]*?)```/g
  let match
  while ((match = regex.exec(markdownContent)) !== null) {
    const code = match[1].trim()
    if (code.length > 20) codeBlocks.push(code)
  }

  if (!codeBlocks.length) { alert('No Python code found in the report.'); return }

  // Build notebook cells
  const cells = []

  // Title markdown cell
  cells.push({
    cell_type: 'markdown',
    metadata: {},
    source: ['# AutoML Pipeline — Generated Notebook\n', '> Generated by **AutoML Agent**\n\n', '---\n']
  })

  // Install deps cell
  cells.push({
    cell_type: 'code',
    execution_count: null,
    metadata: {},
    outputs: [],
    source: [
      '# Install required packages\n',
      '# !pip install pandas scikit-learn xgboost lightgbm catboost joblib matplotlib seaborn\n',
    ]
  })

  // Extract section headings from report to use as cell comments
  const sectionMap = {
    'preprocess': '## 1. Data Preprocessing',
    'import':     '## 1. Imports & Setup',
    'train':      '## 2. Model Training',
    'evaluat':    '## 3. Evaluation & Metrics',
    'predict':    '## 4. Predictions',
    'save':       '## 5. Save Model',
    'feature':    '## 6. Feature Importance',
  }

  codeBlocks.forEach((code, i) => {
    // Try to find a relevant heading
    const lower = code.toLowerCase()
    let heading = `## Code Block ${i + 1}`
    for (const [key, val] of Object.entries(sectionMap)) {
      if (lower.includes(key)) { heading = val; break }
    }

    // Markdown heading cell
    cells.push({
      cell_type: 'markdown',
      metadata: {},
      source: [heading + '\n']
    })

    // Code cell — split into lines as notebook format requires
    cells.push({
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: code.split('\n').map((line, idx, arr) =>
        idx < arr.length - 1 ? line + '\n' : line
      )
    })
  })

  // Final markdown cell
  cells.push({
    cell_type: 'markdown',
    metadata: {},
    source: [
      '---\n',
      '## ✅ Pipeline Complete\n',
      'Generated by **AutoML Agent** · Modify and re-run any cell above.\n'
    ]
  })

  const notebook = {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' },
      language_info: { name: 'python', version: '3.10.0' }
    },
    cells
  }

  const blob = new Blob([JSON.stringify(notebook, null, 2)], { type: 'application/json' })
  triggerDownload(blob, filename)
}
