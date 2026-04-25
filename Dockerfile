FROM node:22-alpine

WORKDIR /app

# Static assets
COPY rda-net-kit.html ./
COPY ip-utils.js oui-db.js ./
COPY components/ ./components/

# Proxy server (zero npm deps — Node built-ins only)
COPY scripts/proxy.js ./scripts/

EXPOSE 8080

CMD ["node", "scripts/proxy.js"]
