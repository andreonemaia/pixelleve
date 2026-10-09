export async function esvaziarLeitor<T>(lerLote: () => Promise<readonly T[]>): Promise<T[]> {
  const todos: T[] = []
  for (;;) {
    const lote = await lerLote()
    if (lote.length === 0) return todos
    todos.push(...lote)
  }
}
