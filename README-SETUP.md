# 🚀 Unified Development Setup

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create environment file:**

   ```bash
   # Create .env file
   echo "ANTHROPIC_API_KEY=your-api-key-here" > .env
   echo "PORT=3001" >> .env
   ```

3. **Get your Anthropic API key:**

   - Go to [console.anthropic.com](https://console.anthropic.com/)
   - Create/sign in to your account
   - Generate an API key (starts with `sk-ant-`)
   - Replace `your-api-key-here` in `.env` with your actual key

4. **Run both servers with one command:**
   ```bash
   npm run dev
   ```

That's it! 🎉

## What happens:

- ✅ Frontend runs on `http://localhost:5173`
- ✅ Backend runs on `http://localhost:3001`
- ✅ Both servers start simultaneously with colored output
- ✅ Auto-reload on file changes for both servers

## Individual Commands (if needed):

- `npm run dev:client` - Frontend only
- `npm run dev:server` - Backend only
- `npm run server` - Production backend

## Troubleshooting:

- Make sure your `.env` file has the correct API key
- Check that ports 3001 and 5173 are available
- Verify you have sufficient credits in your Anthropic account
