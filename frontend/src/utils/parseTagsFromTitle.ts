export function parseTagsFromTitle(raw: string): { title: string; tags: string[] } {
  const tagRegex = /#(\w+)/g
  const tags: string[] = []
  let match: RegExpExecArray | null

  while ((match = tagRegex.exec(raw)) !== null) {
    tags.push(match[1].toLowerCase())
  }

  const title = raw.replace(/#\w+/g, '').replace(/\s+/g, ' ').trim()

  const uniqueTags = [...new Set(tags)].filter(t => t.length > 0)

  return { title, tags: uniqueTags }
}
