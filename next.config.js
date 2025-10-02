/** @type {import('next').NextConfig} */

// Next.js configuration for Ani3Lix platform
// This file configures the Next.js application for the Replit environment
const nextConfig = {
  // Enable React strict mode for better development experience and error detection
  reactStrictMode: true,

  // Configure hostname and port for Replit environment
  // Next.js dev server must bind to 0.0.0.0 (all network interfaces) for Replit proxy to work
  // Port 5000 is the only non-firewalled port in Replit environment
  env: {
    // Set custom port environment variable for server configuration
    PORT: '5000',
    // Hostname must be 0.0.0.0 to accept connections from Replit's proxy
    HOSTNAME: '0.0.0.0',
  },

  // Configure external image domains for anime content
  // This allows Next.js Image component to optimize images from these sources
  images: {
    // Allowed remote patterns for anime images from various sources
    remotePatterns: [
      {
        // AniList CDN - primary anime metadata source
        protocol: 'https',
        hostname: 's4.anilist.co',
        port: '', // Default HTTPS port
        pathname: '/**', // Allow all paths from this domain
      },
      {
        // MyAnimeList CDN - alternative anime image source
        protocol: 'https',
        hostname: 'cdn.myanimelist.net',
        port: '',
        pathname: '/**',
      },
      {
        // Supabase Storage - for user-uploaded content (avatars, etc.)
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/**', // Only allow storage paths
      },
      {
        // TMDB images - for additional anime artwork
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        pathname: '/**',
      },
    ],
    // Enable image optimization for better performance
    unoptimized: false,
  },

  // Webpack configuration customization for additional build optimizations
  webpack: (config, { isServer }) => {
    // Only apply client-side optimizations
    if (!isServer) {
      // Resolve fallback for Node.js modules in client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Exclude Node.js-only modules from client bundle
        fs: false,
        net: false,
        tls: false,
      };
    }
    // Return modified webpack configuration
    return config;
  },

  // TypeScript configuration
  typescript: {
    // During development, continue even with TypeScript errors (strict in production)
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },

  // ESLint configuration  
  eslint: {
    // During development, continue even with ESLint warnings
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
  },

  // Output configuration for production builds
  output: 'standalone', // Create standalone build for easier deployment

  // Experimental features for App Router
  experimental: {
    // Enable server actions for form handling without API routes
    serverActions: {
      allowedOrigins: ['*'], // Allow all origins in development
    },
  },

  // Custom server configuration for Replit environment
  // Note: This runs on the configured hostname and port
  serverRuntimeConfig: {
    // Server-only runtime configuration
    port: process.env.PORT || 5000,
  },

  // Public runtime configuration (available on client and server)
  publicRuntimeConfig: {
    // Base URL for API calls
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  },
};

// Export Next.js configuration using ES module syntax
export default nextConfig;
