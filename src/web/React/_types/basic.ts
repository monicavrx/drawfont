import { z } from 'zod'

export const FontVersionSchema = z.enum([
    'v0.0.9', 'v1.0.0', 'v1.0.1'
])

export const letterJsonSchema = z.object({
    letter: z.string(),
    imageBase64: z.string()
})
export type LetterJsonModel = z.infer<typeof letterJsonSchema>

export const fontJsonSchema = z.object({
    uid: z.string(),
    userUid: z.string(),
    name: z.string(),
    version: FontVersionSchema,
    characterSpacing: z.number(),
    letters: z.array(letterJsonSchema),
    createdAt: z.string().datetime(),
})
export type FontJsonModel = z.infer<typeof fontJsonSchema>