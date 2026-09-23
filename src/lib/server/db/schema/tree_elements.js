import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { elements } from './elements.js'

export const treeElements = sqliteTable('tree_elements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ancestor: text('ancestor').references(() => elements.id, { onDelete: 'cascade' }),
  descendant: text('descendant').references(() => elements.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})
