FROM mcr.microsoft.com/playwright:v1.64.1-noble

WORKDIR /app

# Install backend deps (includes playwright driver; browsers already in image)
COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

# App code (data/ is created at runtime; disk mount covers it in prod)
COPY backend ./backend
COPY frontend ./frontend
COPY package.json ./

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "backend/src/run.js"]
