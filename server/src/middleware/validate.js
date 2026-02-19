import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params
    });
    next();
  } catch (error) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: error.errors?.map((e) => ({ path: e.path.join('.'), message: e.message })) || []
    });
  }
};

export const authSchemas = {
  register: z.object({
    body: z.object({
      username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
      password: z
        .string()
        .min(8)
        .max(64)
        .regex(/[A-Z]/, 'Must include an uppercase letter')
        .regex(/[a-z]/, 'Must include a lowercase letter')
        .regex(/[0-9]/, 'Must include a number')
        .regex(/[^A-Za-z0-9]/, 'Must include a special character')
    })
  }),
  login: z.object({
    body: z.object({
      username: z.string().min(3),
      password: z.string().min(8)
    })
  })
};
