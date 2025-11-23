# [ProductKit](https://productkit.liftgate.io)
An agentic platform to automatically generate product listings for user-facing pages, Shopify integrations, and FAQ/documentation.

# Getting Started

## Public Instance
Visit our public instance: [ProductKit](https://productkit.liftgate.io)

## Local
- run `bun install` in `frontend`
- configure your frontend API server in a `.env` file in the `frontend` dir
```properties
NEXT_PUBLIC_API_URL=https://prod-api-pkit.liftgate.io
NEXT_PUBLIC_WS_URL=wss://prod-api-pkit.liftgate.io
```
- if running fully local, ensure you have a mongodb instance running locally
- start the ktor backend in `backend` with the following `.env`
```properties
# fal.ai
FAL_KEY=my:key

# DigitalOcean Spaces
DO_SPACES_KEY=MYKEY
DO_SPACES_SECRET=my/secret
DO_SPACES_BUCKET=productkit
DO_SPACES_ENDPOINT=https://sfo3.digitaloceanspaces.com

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-my-key
```
