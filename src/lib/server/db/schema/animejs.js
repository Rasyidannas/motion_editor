import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
import { elements } from './elements.js'

export const animejs = sqliteTable('animejs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  elementId: text('element_id').references(() => elements.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  typeValue: text('type_value', { mode: 'json' }),
  util: text('util'),
  utilValue: text('util_value', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
})
