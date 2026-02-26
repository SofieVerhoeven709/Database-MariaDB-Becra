import {z} from 'zod/v4'

export const dateSchema = z.preprocess(
  val => (val === '' || val === null || val === undefined ? null : new Date(val as string)),
  z.date().nullable(),
)

export const requiredDateSchema = z.preprocess(
  val => (typeof val === 'string' || val instanceof Date ? new Date(val) : val),
  z.date(),
)
