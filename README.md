# MedLink Medical Records Platform
  
A secure digital health records platform that connects patients and healthcare providers through encrypted medical record sharing. Built with [Chef](https://chef.convex.dev) using [Convex](https://convex.dev) as its backend.

## Features

- **Professional Landing Page**: Modern, responsive homepage with clear value proposition
- **Secure Authentication**: Patient and doctor account management with role-based access
- **Medical Record Management**: Upload, organize, and share medical records securely
- **Access Control**: Patients can grant and revoke access permissions to healthcare providers
- **Real-time Updates**: Instant synchronization of medical records across the platform
- **Mobile Responsive**: Optimized for all device sizes

## Getting Started

This project is connected to the Convex deployment named [`notable-okapi-371`](https://dashboard.convex.dev/d/notable-okapi-371).

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
