# 🏥 MedLink Medical Records Platform

A modern medical records management platform built with React, Convex, and AI-powered analysis.

## 🌐 Live Demo

**🚀 [Access Live App](https://medlink-medical-records-platform.vercel.app/#)**

## Features

- Patient and Doctor dashboards
- Medical document upload and storage
- OCR text extraction from images and PDFs
- AI-powered medical report summaries
- Real-time data synchronization
- Secure authentication system

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Convex (real-time database, authentication, file storage)
- **AI**: Cohere API for medical text analysis
- **OCR**: Tesseract.js for document text extraction

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up Convex: `npx convex dev`
4. Start the development server: `npm run dev`

## Environment Variables

Create a `.env.local` file with:
```
VITE_CONVEX_URL=your_convex_deployment_url
```

Set in Convex dashboard:
```
AI_API_KEY=your_cohere_api_key
LLM_PROVIDER=cohere
```

## Deployment

This project is deployed on:
- **Frontend**: Vercel - [Live App](https://medlink-medical-records-platform-bk7yugczu.vercel.app)
- **Backend**: Convex - Real-time database and AI functions

## License

MIT License

## Development Notes

**Important**: After adding new Convex functions, always run:
```bash
npx convex dev
npx convex deploy
```
Otherwise frontend calls will fail with "Could not find public function" errors.

### Environment Configuration

To enable AI-powered report analysis and OCR functionality, you need to set up the following environment variables in your Convex deployment:

#### Required Environment Variables

1. **LLM_PROVIDER**: Set to `cohere` for AI analysis
2. **AI_API_KEY**: Your Cohere API key for AI-powered summaries
3. **OCR_API_KEY**: Your OCR.Space API key for text extraction from images

#### Setting Environment Variables

1. Go to your [Convex Dashboard](https://dashboard.convex.dev/d/notable-okapi-371)
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
LLM_PROVIDER=cohere
AI_API_KEY=your_cohere_api_key_here
OCR_API_KEY=your_ocr_space_api_key_here
```

#### API Key Setup

**Cohere API Key:**
1. Sign up at [Cohere](https://cohere.ai/)
2. Get your API key from the dashboard
3. Use the `command-r` model for analysis

**OCR.Space API Key:**
1. Sign up at [OCR.Space](https://ocr.space/)
2. Get your API key from the dashboard
3. Free tier includes 25,000 requests per month

#### Features Enabled

Once configured, the following features will be available:

- **AI Report Analysis**: Generate patient-friendly and doctor-focused summaries
- **OCR Text Extraction**: Automatically extract text from uploaded medical documents
- **Smart Flagging**: Identify abnormal values and clinical significance
- **Audit Logging**: Track all AI analysis activities
  
## Project structure
  
The frontend code is in the `app` directory and is built with [Vite](https://vitejs.dev/).
  
The backend code is in the `convex` directory.
  
`npm run dev` will start the frontend and backend servers.

## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.
