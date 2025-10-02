import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Bell, Menu, X, Play, User, Settings, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/auth/AuthModal";

// Navigation component with responsive design and user authentication
export function Navigation() {
  const [location] = useLocation(); // Get current route for active link highlighting
  const [searchQuery, setSearchQuery] = useState(""); // Search input state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false); // Auth modal visibility
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Mobile menu state
  const { user, isAuthenticated, logout, hasRole } = useAuth(); // Authentication context

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to browse page with search query
      window.location.href = `/browse?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  // Handle user logout
  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false); // Close mobile menu
  };

  // Get user initials for avatar fallback
  const getUserInitials = (user: any) => {
    if (user?.displayName) {
      return user.displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase();
    }
    return user?.username?.charAt(0).toUpperCase() || 'U';
  };

  // Navigation link component with active state
  const NavLink = ({ href, children, className = "" }: { href: string; children: React.ReactNode; className?: string }) => {
    const isActive = location === href;
    return (
      <Link href={href}>
        <a 
          className={`transition-smooth ${isActive 
            ? 'text-foreground font-medium' 
            : 'text-muted-foreground hover:text-foreground'
          } ${className}`}
          data-testid={`nav-link-${href.replace('/', '')}`}
        >
          {children}
        </a>
      </Link>
    );
  };

  // Mobile navigation menu
  const MobileNav = () => (
    <div className="flex flex-col space-y-4 p-4">
      <NavLink href="/" className="text-lg">Home</NavLink>
      <NavLink href="/browse" className="text-lg">Browse</NavLink>
      {isAuthenticated && (
        <>
          <NavLink href="/profile" className="text-lg">Profile</NavLink>
          {hasRole("admin") && (
            <NavLink href="/admin" className="text-lg flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Admin Panel
            </NavLink>
          )}
        </>
      )}
      
      {/* Search in mobile menu */}
      <form onSubmit={handleSearch} className="flex space-x-2">
        <Input
          type="text"
          placeholder="Search anime..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
          data-testid="mobile-search-input"
        />
        <Button type="submit" size="icon" data-testid="mobile-search-button">
          <Search className="w-4 h-4" />
        </Button>
      </form>

      {/* Authentication buttons for mobile */}
      {!isAuthenticated && (
        <div className="flex flex-col space-y-2">
          <Button 
            onClick={() => setIsAuthModalOpen(true)} 
            variant="outline"
            data-testid="mobile-login-button"
          >
            Login
          </Button>
          <Button 
            onClick={() => setIsAuthModalOpen(true)}
            data-testid="mobile-register-button"
          >
            Register
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Main navigation header */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo and brand section */}
            <div className="flex items-center space-x-8">
              <Link href="/">
                <a className="flex items-center space-x-2" data-testid="logo-link">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                    <Play className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Ani3Lix
                  </span>
                </a>
              </Link>
              
              {/* Desktop navigation links */}
              <div className="hidden md:flex space-x-6">
                <NavLink href="/">Home</NavLink>
                <NavLink href="/browse">Browse</NavLink>
                {isAuthenticated && <NavLink href="/profile">Profile</NavLink>}
                {hasRole("admin") && (
                  <NavLink href="/admin" className="flex items-center">
                    <Shield className="w-4 h-4 mr-1" />
                    Admin
                  </NavLink>
                )}
              </div>
            </div>
            
            {/* Search bar - desktop only */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4"
                  data-testid="desktop-search-input"
                />
              </form>
            </div>
            
            {/* User actions and mobile menu */}
            <div className="flex items-center space-x-4">
              
              {/* Notification bell (authenticated users only) */}
              {isAuthenticated && (
                <Button variant="ghost" size="icon" className="relative" data-testid="notifications-button">
                  <Bell className="h-5 w-5" />
                  {/* Notification badge - replace with actual count */}
                  <span className="absolute top-0 right-0 w-2 h-2 bg-accent rounded-full"></span>
                </Button>
              )}
              
              {/* User profile dropdown or auth buttons */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-3" data-testid="user-menu-trigger">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user?.avatarUrl} alt={user?.displayName || user?.username} />
                        <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                      </Avatar>
                      <span className="hidden lg:block text-sm font-medium">
                        {user?.displayName || user?.username}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="p-3 border-b border-border">
                      <p className="text-sm font-medium">{user?.displayName || user?.username}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <Badge variant="secondary" className="mt-2">
                        {user?.role}
                      </Badge>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    {hasRole("admin") && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <Shield className="w-4 h-4 mr-2" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive" data-testid="logout-button">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // Authentication buttons for non-authenticated users
                <div className="hidden md:flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsAuthModalOpen(true)}
                    data-testid="desktop-login-button"
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => setIsAuthModalOpen(true)}
                    data-testid="desktop-register-button"
                  >
                    Sign Up
                  </Button>
                </div>
              )}
              
              {/* Mobile menu toggle */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" data-testid="mobile-menu-trigger">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-lg font-semibold">Menu</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-testid="mobile-menu-close"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <MobileNav />
                  
                  {/* User info in mobile menu */}
                  {isAuthenticated && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar>
                          <AvatarImage src={user?.avatarUrl} />
                          <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user?.displayName || user?.username}</p>
                          <Badge variant="secondary">{user?.role}</Badge>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={handleLogout} 
                        className="w-full"
                        data-testid="mobile-logout-button"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </Button>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Authentication modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}

