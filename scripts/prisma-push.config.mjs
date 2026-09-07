/** Staging/VPS db push — no dotenv (env comes from Docker --env-file). */
export default {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
