// Home page component for Ani3Lix platform
// This is the main landing page that users see when visiting the site

// Import Link component from Next.js for client-side navigation
import Link from 'next/link'

// Import Button component from shadcn/ui library
import { Button } from '@/components/ui/button'

// Import icons from lucide-react for visual elements
import { Play, TrendingUp, List, Star } from 'lucide-react'

// Home page component - default export for Next.js App Router
export default function Home() {
  return (
    // Main container with full viewport height and flex layout
    <main className="min-h-screen flex flex-col">
      {/* 
        min-h-screen: Ensures page takes at least full viewport height
        flex: Enables flexbox layout
        flex-col: Stack children vertically
      */}
      
      {/* Header/Navigation section */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        {/* 
          border-b: Bottom border for separation
          border-border: Uses theme border color
          bg-card/50: Semi-transparent card background
          backdrop-blur: Blur effect for glass morphism
          supports-[backdrop-filter]:bg-card/50: Conditional styling if backdrop-filter is supported
        */}
        
        {/* Navigation container with max width and padding */}
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* 
            container: Centers content with max-width
            mx-auto: Center horizontally
            px-4: Horizontal padding
            py-4: Vertical padding
            flex: Flexbox layout
            items-center: Vertically center items
            justify-between: Space items to edges
          */}
          
          {/* Logo/Brand section */}
          <div className="flex items-center space-x-2">
            {/* 
              flex: Flexbox for logo and text
              items-center: Vertically center
              space-x-2: Horizontal spacing between children
            */}
            
            {/* Play icon as logo */}
            <Play className="w-8 h-8 text-primary" />
            {/* 
              w-8 h-8: 32px width and height
              text-primary: Primary brand color
            */}
            
            {/* Brand name */}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {/* 
                text-2xl: Large text size
                font-bold: Bold font weight
                bg-gradient-to-r: Right-facing gradient background
                from-primary to-secondary: Gradient from purple to cyan
                bg-clip-text: Clip background to text
                text-transparent: Make text transparent to show gradient
              */}
              Ani3Lix
            </h1>
          </div>
          
          {/* Navigation links */}
          <div className="flex items-center space-x-4">
            {/* 
              flex: Flexbox layout
              items-center: Vertically center
              space-x-4: Horizontal spacing between links
            */}
            
            {/* Authentication links */}
            <Link href="/login">
              <Button variant="ghost" size="sm" data-testid="link-login">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" data-testid="link-register">
                Sign Up
              </Button>
            </Link>
          </div>
        </nav>
      </header>
      
      {/* Hero section - main content area */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        {/* 
          flex-1: Take remaining vertical space
          flex flex-col: Vertical flexbox layout
          items-center: Horizontally center content
          justify-center: Vertically center content
          px-4: Horizontal padding
          py-20: Large vertical padding
          text-center: Center-align text
        */}
        
        {/* Main headline */}
        <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          {/* 
            text-5xl md:text-6xl: Large text, extra large on medium+ screens
            font-bold: Bold weight
            mb-6: Bottom margin
            bg-gradient-to-r: Horizontal gradient
            from-primary via-accent to-secondary: Purple -> Pink -> Cyan gradient
            bg-clip-text text-transparent: Gradient text effect
          */}
          Welcome to Ani3Lix
        </h2>
        
        {/* Subtitle/description */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl">
          {/* 
            text-xl md:text-2xl: Large text, extra large on medium+ screens
            text-muted-foreground: Subtle text color
            mb-8: Bottom margin
            max-w-2xl: Maximum width constraint
          */}
          Your ultimate anime streaming platform. Discover, watch, and enjoy thousands of anime series and movies.
        </p>
        
        {/* Call-to-action section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          {/* 
            flex: Flexbox layout
            flex-col sm:flex-row: Vertical on mobile, horizontal on small+ screens
            gap-4: Spacing between buttons
            mb-12: Bottom margin
          */}
          
          {/* Primary CTA button */}
          <Link href="/register">
            <Button size="lg" className="gap-2" data-testid="button-start-watching">
              {/* 
                size="lg": Large button size
                gap-2: Space between icon and text
              */}
              <Play className="w-5 h-5" /> {/* Play icon - 20px size */}
              Start Watching
            </Button>
          </Link>
          
          {/* Secondary CTA button */}
          <Link href="/register">
            <Button size="lg" variant="outline" className="gap-2" data-testid="button-browse-trending">
              {/* 
                size="lg": Large button size
                variant="outline": Outlined button style
                gap-2: Space between icon and text
              */}
              <TrendingUp className="w-5 h-5" /> {/* Trending icon - 20px size */}
              Browse Trending
            </Button>
          </Link>
        </div>
        
        {/* Feature highlights grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mt-8">
          {/* 
            grid: CSS Grid layout
            grid-cols-1 md:grid-cols-3: 1 column on mobile, 3 on medium+ screens
            gap-6: Spacing between grid items
            max-w-4xl: Maximum width constraint
            mt-8: Top margin
          */}
          
          {/* Feature card 1 - Trending anime */}
          <div className="bg-card border border-border rounded-lg p-6 transition-smooth hover:border-primary">
            {/* 
              bg-card: Card background color
              border border-border: Border with theme color
              rounded-lg: Large border radius
              p-6: All-around padding
              transition-smooth: Smooth transitions (custom class)
              hover:border-primary: Primary border color on hover
            */}
            
            {/* Feature icon */}
            <TrendingUp className="w-12 h-12 text-primary mb-4 mx-auto" />
            {/* 
              w-12 h-12: 48px size
              text-primary: Primary color
              mb-4: Bottom margin
              mx-auto: Center horizontally
            */}
            
            {/* Feature title */}
            <h3 className="text-lg font-semibold mb-2">Trending Anime</h3>
            {/* 
              text-lg: Large text
              font-semibold: Semi-bold weight
              mb-2: Bottom margin
            */}
            
            {/* Feature description */}
            <p className="text-muted-foreground text-sm">
              {/* 
                text-muted-foreground: Subtle text color
                text-sm: Small text size
              */}
              Discover what's popular and trending in the anime world right now.
            </p>
          </div>
          
          {/* Feature card 2 - Personal watchlist */}
          <div className="bg-card border border-border rounded-lg p-6 transition-smooth hover:border-secondary">
            {/* hover:border-secondary: Secondary border color on hover */}
            
            {/* Feature icon */}
            <List className="w-12 h-12 text-secondary mb-4 mx-auto" />
            {/* text-secondary: Secondary cyan color */}
            
            {/* Feature title */}
            <h3 className="text-lg font-semibold mb-2">Personal Watchlist</h3>
            
            {/* Feature description */}
            <p className="text-muted-foreground text-sm">
              Keep track of anime you want to watch and continue where you left off.
            </p>
          </div>
          
          {/* Feature card 3 - Favorites */}
          <div className="bg-card border border-border rounded-lg p-6 transition-smooth hover:border-accent">
            {/* hover:border-accent: Accent pink border on hover */}
            
            {/* Feature icon */}
            <Star className="w-12 h-12 text-accent mb-4 mx-auto" />
            {/* text-accent: Accent pink color */}
            
            {/* Feature title */}
            <h3 className="text-lg font-semibold mb-2">Favorites</h3>
            
            {/* Feature description */}
            <p className="text-muted-foreground text-sm">
              Save your favorite anime series and get notified about new episodes.
            </p>
          </div>
        </div>
      </section>
      
      {/* Footer section */}
      <footer className="border-t border-border py-8 text-center text-muted-foreground text-sm">
        {/* 
          border-t: Top border
          border-border: Theme border color
          py-8: Vertical padding
          text-center: Center text
          text-muted-foreground: Subtle text color
          text-sm: Small text size
        */}
        
        {/* Copyright notice */}
        <p>© 2025 Ani3Lix. Built with Next.js 14 and Tailwind CSS.</p>
      </footer>
    </main>
  )
}
