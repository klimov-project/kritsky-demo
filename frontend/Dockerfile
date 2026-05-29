FROM node:22.21.1-alpine3.23

WORKDIR /app

RUN apk add --no-cache curl

COPY package*.json ./

RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install


COPY . .

# Удаляем кэш Nuxt и Tailwind (если есть)
RUN rm -rf .nuxt .output node_modules/.vite

RUN chmod +x entrypoint.sh

ENV NUXT_API_BACKEND_BASE=http://backend:8000
ENV NUXT_PUBLIC_API_BASE=/api
ENV NODE_ENV=production

EXPOSE 3000

ENTRYPOINT ["./entrypoint.sh"]