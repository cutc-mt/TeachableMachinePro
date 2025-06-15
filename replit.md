# Advanced Teachable Machine - Replit Coding Agent Guide

## Overview

This is an enhanced clone of Google's Teachable Machine built with modern web technologies. The application provides a sophisticated machine learning platform that allows users to train image classification models directly in the browser with an improved user experience featuring Japanese language support, real-time training metrics, and professional UI components.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React hooks with custom state management
- **Data Visualization**: Recharts for training metrics and analytics

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Session Management**: Basic in-memory storage with extensible interface
- **API Structure**: RESTful endpoints with `/api` prefix
- **Development**: Hot module replacement with Vite integration

### Machine Learning Architecture
- **ML Framework**: TensorFlow.js for browser-based machine learning
- **Transfer Learning**: MobileNet v1 as base model for feature extraction
- **Training Strategy**: Custom transfer learning with configurable epochs
- **Inference**: Real-time prediction with webcam integration

## Key Components

### Core ML Components
1. **TensorFlow Integration** (`/client/src/hooks/use-tensorflow.ts`)
   - Manages TensorFlow.js initialization with WebGL/CPU fallback
   - Handles model loading, training, and prediction workflows
   - Provides training progress tracking and error handling

2. **Webcam Management** (`/client/src/hooks/use-webcam.ts`)
   - Browser camera access with permission handling
   - Image capture functionality for training data collection
   - Real-time video feed for prediction testing

3. **ML Utilities** (`/client/src/lib/ml-utils.ts`)
   - MobileNet model loading with fallback strategies
   - Image preprocessing and tensor operations
   - Model export and import functionality

### UI Components
1. **Class Manager** (`/client/src/components/class-manager.tsx`)
   - Drag-and-drop image upload interface
   - Class creation and management
   - Webcam capture integration for training data

2. **Training Controls** (`/client/src/components/training-controls.tsx`)
   - Training configuration (epochs, parameters)
   - Progress visualization with real-time metrics
   - Model export functionality

3. **Prediction Display** (`/client/src/components/prediction-display.tsx`)
   - Live webcam feed for testing
   - Real-time prediction results
   - Confidence score visualization

4. **Metrics Modal** (`/client/src/components/metrics-modal.tsx`)
   - Comprehensive training analytics
   - Interactive charts for loss and accuracy
   - Class distribution visualization

### Tutorial System
- **Tutorial Overlay** (`/client/src/components/tutorial-overlay.tsx`)
- Step-by-step guidance for new users
- Japanese language support throughout the interface

## Data Flow

### Training Workflow
1. User creates classification classes
2. Images are uploaded via drag-and-drop or webcam capture
3. Images are preprocessed and converted to tensors
4. Transfer learning is applied using MobileNet base model
5. Training progress is tracked with real-time metrics
6. Trained model is available for immediate testing

### Prediction Workflow
1. Webcam feed is activated for live input
2. Video frames are captured and preprocessed
3. Trained model generates predictions with confidence scores
4. Results are displayed in real-time with visual feedback

### Data Storage
- **Training Data**: Stored in browser memory as ImageData objects
- **Model State**: Persisted in TensorFlow.js format
- **Session Data**: Basic in-memory storage (extensible to database)

## External Dependencies

### Core Dependencies
- **@tensorflow/tfjs**: Machine learning framework (v4.22.0)
- **React ecosystem**: React, TypeScript, Vite for frontend
- **UI Libraries**: Radix UI, Tailwind CSS, shadcn/ui components
- **Charts**: Recharts for data visualization
- **Utilities**: date-fns, clsx, class-variance-authority

### Development Dependencies
- **Database**: Drizzle ORM with PostgreSQL support (configured but not actively used)
- **Deployment**: Replit-optimized configuration with autoscale deployment

### Browser APIs
- **MediaDevices API**: For webcam access and image capture
- **Canvas API**: For image processing and tensor conversion
- **Web Workers**: Potential for heavy ML computations (not currently implemented)

## Deployment Strategy

### Replit Configuration
- **Runtime**: Node.js 20 with PostgreSQL 16 module
- **Development**: `npm run dev` starts Vite dev server on port 5000
- **Production**: `npm run build` + `npm run start` for optimized deployment
- **Auto-scaling**: Configured for Replit's autoscale deployment target

### Build Process
1. **Frontend Build**: Vite compiles React/TypeScript to optimized bundle
2. **Backend Build**: esbuild bundles Express server for production
3. **Static Assets**: Served from `/dist/public` directory
4. **Environment**: Supports development and production configurations

### Performance Considerations
- **ML Operations**: TensorFlow.js with WebGL acceleration when available
- **Image Processing**: Optimized for browser memory constraints
- **Bundle Size**: Code splitting and tree shaking for optimal loading

## Recent Changes

### June 15, 2025 - Step-by-Step Guide and Color Consistency Update
- Added comprehensive step-by-step workflow interface with visual progress indicators
- Implemented continuous webcam capture functionality without camera restart
- Fixed prediction result color mapping to match training class colors
- Enhanced UI with structured layout from Steps 1-4 for intuitive user experience
- Resolved camera reliability issues and color consistency between training/testing phases

### June 15, 2025 - Initial Setup
- Created advanced Teachable Machine clone with React/TypeScript
- Integrated TensorFlow.js for browser-based machine learning
- Implemented transfer learning with MobileNet base model

## User Preferences

Preferred communication style: Simple, everyday language.