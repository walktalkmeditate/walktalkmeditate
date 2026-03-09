import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const questions = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/questions' }),
  schema: z.object({
    description: z.string(),
    questions: z.array(
      z.object({
        text: z.string(),
        stage: z.enum(['opening', 'middle', 'closing']),
      })
    ),
  }),
});

export const collections = { questions };
