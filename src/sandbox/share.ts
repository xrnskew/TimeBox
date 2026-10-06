// Обмен кодом: ссылка с кодом в #hash, файл .json и игра одним файлом .html.
// Всё работает офлайн: ссылка ничего не отправляет на сервер.

export interface CodeFile {
  format: 'timebox-code'
  version: 1
  lesson: string
  variant: string
  tabs: { id: string; code: string }[]
}

export function makeCodeFile(lesson: string, variant: string, ids: string[], codes: string[]): CodeFile {
  return { format: 'timebox-code', version: 1, lesson, variant, tabs: ids.map((id, i) => ({ id, code: codes[i] })) }
}

/** Код из файла или ссылки, разложенный по вкладкам урока; null — если не подходит. */
export function readCodeFile(data: unknown, ids: string[]): string[] | null {
  if (!data || typeof data !== 'object') return null
  const f = data as Partial<CodeFile>
  if (f.format !== 'timebox-code' || !Array.isArray(f.tabs)) return null
  const byId = new Map<string, string>()
  for (const t of f.tabs) {
    if (t && typeof t.id === 'string' && typeof t.code === 'string') byId.set(t.id, t.code)
  }
  if (!ids.every((id) => byId.has(id))) return null
  return ids.map((id) => byId.get(id) as string)
}

function toBase64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

const canCompress = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function'

/** z… — сжатый deflate, j… — просто JSON (если браузер не умеет сжимать). */
export async function encodeShare(file: CodeFile): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(file))
  if (canCompress()) return `z${toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))}`
  return `j${toBase64Url(json)}`
}

export async function decodeShare(token: string): Promise<unknown> {
  try {
    const bytes = fromBase64Url(token.slice(1))
    const json = token[0] === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes
    return JSON.parse(new TextDecoder().decode(json))
  } catch {
    return null
  }
}

export const SHARE_PARAM = 'play'

export function readShareToken(hash: string): string | null {
  const m = new RegExp(`^#${SHARE_PARAM}=([zj][\\w-]+)$`).exec(hash)
  return m ? m[1] : null
}

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
