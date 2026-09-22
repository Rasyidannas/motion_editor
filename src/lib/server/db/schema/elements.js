import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { frames } from './frames.js'

export const elements = sqliteTable('elements', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  value: text('value', { mode: 'json' }).notNull(),
  type: text('type').notNull(),
  frameId: text('frame_id').references(() => frames.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})
