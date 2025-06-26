FROM node:23

COPY /.output /nuxt/.output
COPY ./config /nuxt/config
COPY ./i18n /nuxt/i18n
COPY ./templates /nuxt/templates

ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=4000

EXPOSE 4000

ENV NODE_ENV=production

CMD ["node", "/nuxt/.output/server/index.mjs"]
