import React from "react";
import { Link } from "wouter";
import { Play } from "lucide-react";

// Footer component with site information and navigation links
export function Footer() {
  // Current year for copyright
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border mt-24 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Main footer content grid */}
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand section */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Play className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Ani3Lix
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your ultimate destination for streaming the latest and greatest anime series. 
              Discover, watch, and discuss your favorite anime with a vibrant community.
            </p>
          </div>
          
          {/* Browse links */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Browse</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/browse?filter=trending">
                  <a className="hover:text-foreground transition-smooth" data-testid="footer-trending-link">
                    Trending
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/browse?filter=new-releases">
                  <a className="hover:text-foreground transition-smooth" data-testid="footer-new-releases-link">
                    New Releases
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/browse?filter=popular">
                  <a className="hover:text-foreground transition-smooth" data-testid="footer-popular-link">
                    Popular
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/browse">
                  <a className="hover:text-foreground transition-smooth" data-testid="footer-all-anime-link">
                    All Anime
                  </a>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Community links */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Community</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/discussions">
                  <a className="hover:text-foreground transition-smooth" data-testid="footer-discussions-link">
                    Discussions
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/reviews">
                  <a className="hover:text-foreground transition-smooth" data-testid="footer-reviews-link">
                    Reviews
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/recommendations">
                  <a className="hover:text-foreground transition-smooth" data-testid="footer-recommendations-link">
                    Recommendations
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/news">
                  <a className="hover:text-foreground transition-smooth" data-testid="footer-news-link">
                    News
                  </a>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Support links */}
          <div>
            <h4 className="font-semibold mb-4 text-foreground">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help">
                  <a className="hover:text-foreground transition-smooth" data-testid="footer-help-link">
                    Help Center
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/contact">
                  <a className="hover:text-foreground transition-smooth" data-testid="footer-contact-link">
                    Contact Us
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/privacy">
                  <a className="hover:text-foreground transition-smooth" data-testid="footer-privacy-link">
                    Privacy Policy
                  </a>
                </Link>
              </li>
              <li>
                <Link href="/terms">
                  <a className="hover:text-foreground transition-smooth" data-testid="footer-terms-link">
                    Terms of Service
                  </a>
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Bottom bar with copyright and social links */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            &copy; {currentYear} Ani3Lix. All rights reserved.
          </p>
          
          {/* Social media links */}
          <div className="flex space-x-6">
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-smooth"
              data-testid="footer-twitter-link"
              aria-label="Follow us on Twitter"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </a>
            
            <a 
              href="https://discord.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-smooth"
              data-testid="footer-discord-link"
              aria-label="Join our Discord server"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/>
              </svg>
            </a>
            
            <a 
              href="https://reddit.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-smooth"
              data-testid="footer-reddit-link"
              aria-label="Join our Reddit community"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
              </svg>
            </a>
            
            <a 
              href="https://instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-smooth"
              data-testid="footer-instagram-link"
              aria-label="Follow us on Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.621 5.367 11.988 11.988 11.988s11.987-5.367 11.987-11.988C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.148-1.191C4.6 15.097 4.11 13.946 4.11 12.649s.49-2.448 1.191-3.148C6.001 8.801 7.152 8.311 8.449 8.311s2.448.49 3.148 1.191c.7.7 1.191 1.851 1.191 3.148s-.49 2.448-1.191 3.148c-.7.7-1.851 1.19-3.148 1.19zm7.718-1.7c-.3.3-.3.787 0 1.087.3.3.787.3 1.087 0 .3-.3.3-.787 0-1.087-.3-.3-.787-.3-1.087 0zm.874-3.975c0-.087-.087-.174-.174-.174H15.78c-.087 0-.174.087-.174.174v1.087c0 .087.087.174.174.174h1.087c.087 0 .174-.087.174-.174v-1.087zm-4.366-1.787c-.7 0-1.4.262-1.926.787-.525.525-.787 1.226-.787 1.926s.262 1.4.787 1.926c.525.525 1.226.787 1.926.787s1.4-.262 1.926-.787c.525-.525.787-1.226.787-1.926s-.262-1.4-.787-1.926c-.525-.525-1.226-.787-1.926-.787z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

