// Import global CSS styles for Tailwind and custom styles
// This file contains all base styles, CSS variables, and utility classes
import './globals.css'

// Import Next.js Metadata type for SEO configuration
import type { Metadata } from 'next'

// Import Inter font from Next.js font optimization system
// This provides automatic font optimization and prevents layout shift
import { Inter } from 'next/font/google'

// Configure Inter font with Latin subset for optimal loading
// Variable font provides all weights (300-900) in a single file
const inter = Inter({ 
  subsets: ['latin'],           // Load only Latin characters for smaller file size
  display: 'swap',              // Use fallback font until Inter loads (prevents invisible text)
  variable: '--font-sans',      // CSS variable name for use in Tailwind config
  weight: ['300', '400', '500', '600', '700', '800', '900'], // All available weights
})

// Metadata configuration for SEO and social media sharing
// This object defines how the site appears in search results and when shared
export const metadata: Metadata = {
  // Page title - appears in browser tab and search results
  title: 'Ani3Lix - Your Ultimate Anime Streaming Platform',
  
  // Meta description - appears in search results under the title
  // Should be 150-160 characters for optimal display
  description: 'Stream your favorite anime series and movies on Ani3Lix. Discover trending shows, manage your watchlist, and join our anime community.',
  
  // Additional metadata for better SEO
  keywords: [
    'anime streaming',          // Primary keyword
    'watch anime online',       // Secondary keyword
    'anime platform',           // Tertiary keyword
    'anime community',          // Community feature
    'trending anime',           // Discovery feature
  ],
  
  // Authors metadata for content attribution
  authors: [{ name: 'Ani3Lix Team' }],
  
  // Site creator information
  creator: 'Ani3Lix',
  
  // Publisher information (can be same as creator)
  publisher: 'Ani3Lix',
  
  // Open Graph metadata for social media sharing (Facebook, LinkedIn, etc.)
  openGraph: {
    type: 'website',            // Type of content (website, article, video, etc.)
    locale: 'en_US',            // Primary language and region
    url: 'https://ani3lix.com', // Canonical URL of the site
    siteName: 'Ani3Lix',       // Name of the site for social sharing
    title: 'Ani3Lix - Your Ultimate Anime Streaming Platform', // OG title (can differ from page title)
    description: 'Stream your favorite anime series and movies on Ani3Lix. Discover trending shows, manage your watchlist, and join our anime community.', // OG description
    images: [
      {
        url: '/og-image.png',   // Path to Open Graph image (1200x630px recommended)
        width: 1200,            // Image width in pixels
        height: 630,            // Image height in pixels
        alt: 'Ani3Lix Platform Preview', // Alt text for accessibility
      },
    ],
  },
  
  // Twitter Card metadata for Twitter sharing
  twitter: {
    card: 'summary_large_image', // Card type - large image shows preview image
    title: 'Ani3Lix - Your Ultimate Anime Streaming Platform', // Twitter title
    description: 'Stream your favorite anime series and movies on Ani3Lix. Discover trending shows, manage your watchlist, and join our anime community.', // Twitter description
    images: ['/twitter-image.png'], // Twitter-specific image (can be same as OG)
    creator: '@ani3lix',        // Twitter handle of content creator
  },
  
  // Robots meta tag configuration for search engine crawling
  robots: {
    index: true,                // Allow search engines to index this page
    follow: true,               // Allow search engines to follow links on this page
    googleBot: {
      index: true,              // Specifically allow Google to index
      follow: true,             // Specifically allow Google to follow links
      'max-video-preview': -1,  // No limit on video preview length
      'max-image-preview': 'large', // Allow large image previews in search results
      'max-snippet': -1,        // No limit on text snippet length
    },
  },
  
  // Verification tokens for search console and analytics
  verification: {
    google: 'your-google-verification-code',  // Google Search Console verification
    // yandex: 'your-yandex-verification-code', // Uncomment for Yandex
    // bing: 'your-bing-verification-code',     // Uncomment for Bing
  },
}

// Root layout component - wraps all pages in the application
// This component defines the HTML structure and global providers
export default function RootLayout({
  children, // Page content passed as children prop
}: {
  children: React.ReactNode // Type definition for children prop
}) {
  return (
    // HTML root element with language attribute for accessibility and SEO
    <html lang="en" suppressHydrationWarning>
      {/* 
        suppressHydrationWarning prevents React hydration warnings 
        when using dark mode class manipulation on the html element
      */}
      
      {/* Head element - Next.js automatically manages head tags from metadata */}
      <head />
      
      {/* Body element with Inter font class and custom styling */}
      <body 
        className={inter.className} // Apply Inter font to entire app
        suppressHydrationWarning     // Prevent hydration warnings for theme changes
      >
        {/* Main content wrapper with minimum viewport height */}
        <div className="min-h-screen bg-background text-foreground">
          {/* 
            min-h-screen: Ensures content takes at least full viewport height
            bg-background: Uses CSS variable for theme-aware background color
            text-foreground: Uses CSS variable for theme-aware text color
          */}
          
          {/* Render page content */}
          {children}
        </div>
        
        {/* 
          Future enhancements to add here:
          - Toast notifications container
          - Modal portal container
          - Analytics scripts
          - Theme provider for dark mode toggle
        */}
      </body>
    </html>
  )
}
