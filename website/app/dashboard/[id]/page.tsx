"use client"

import { RepositoryGrid } from "@/components/repository-grid"
import { GlobalStats } from "@/components/global-stats"
import { ActivityFeed } from "@/components/activity-feed"
import { Shield, Activity, Terminal, ChevronRight, Search, Bell, Settings, Github, Send, RotateCw, Mail } from "lucide-react"
import LaserFlow from "@/components/laser-flow"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface GitHubRepo {
  id: number
  name: string
  description: string
  language: string
  topics: string[]
  url: string
  stars: number
  forks: number
}

export default function DashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>("")
  const [isLoadingRepos, setIsLoadingRepos] = useState(false)
  const [repos, setRepos] = useState<GitHubRepo[] | undefined>(undefined)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // PR Submission State
  const [prUrl, setPrUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(false)

  const handleSubmitPR = async () => {
    if (!prUrl.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter a valid GitHub PR URL",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/submit-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prUrl,
          email: emailNotificationsEnabled ? userEmail : null
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Submission Error Details:', data)
        const errorMessage = data.details || data.error || 'Failed to submit PR'
        const debugInfo = data.stderr || data.stdout || ''
        throw new Error(`${errorMessage} ${debugInfo ? `(Debug: ${debugInfo.substring(0, 50)}...)` : ''}`)
      }

      toast({
        title: "Analysis Started",
        description: `PR submitted successfully. Analyzing PR... This may take a few seconds.`,
      })

      // Parse PR URL to extract ID
      // Format: https://github.com/owner/repo/pull/number
      try {
        const urlObj = new URL(prUrl);
        const parts = urlObj.pathname.split('/').filter(Boolean); // [owner, repo, pull, number]
        if (parts.length >= 4 && parts[2] === 'pull') {
          const owner = parts[0];
          const repo = parts[1];
          const number = parts[3];
          const auditId = `${owner}%2F${repo}%2F${number}`; // URL encoded slash

          console.log("Redirecting to audit:", auditId);

          // Give the backend time to process before redirecting
          setTimeout(() => {
            router.push(`/audit/${auditId}`);
          }, 2000); // 2 second delay
        } else {
          console.warn("Could not parse PR URL for redirect:", prUrl);
        }
      } catch (e) {
        console.error("URL parsing failed:", e);
      }

      // Clear input
      setPrUrl("")

    } catch (error: any) {
      console.error('Error submitting PR:', error)
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Load user session
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.authenticated && data.user?.email) {
          console.log("Logged in user email:", data.user.email);
          setUserEmail(data.user.email);
        }
      } catch (e) {
        console.error("Failed to fetch session:", e);
      }
    };
    fetchSession();
  }, []);

  // Fetch repositories from GitHub
  const fetchGitHubRepos = async (silent = false) => {
    setIsLoadingRepos(true)
    try {
      // Try to fetch from GitHub App installation first
      const response = await fetch('/api/github/installation/repos')

      if (response.status === 400 || response.status === 401) {
        // No installation found, fall back to OAuth repos
        const oauthResponse = await fetch('/api/github/repos')

        if (oauthResponse.status === 401) {
          // Not connected at all
          if (!silent) {
            toast({
              title: "Not Connected",
              description: "Please connect your GitHub account first.",
              variant: "destructive",
            })
          }
          return
        }

        const data = await oauthResponse.json()

        if (!oauthResponse.ok) {
          if (!silent) {
            toast({
              title: "Error",
              description: data.error || "Failed to fetch repositories",
              variant: "destructive",
            })
          }
          return
        }

        setRepos(data)
        if (!silent) {
          toast({
            title: "Success",
            description: `Loaded ${data.length} repositories from GitHub`,
          })
        }
        console.log('GitHub Repositories (OAuth):', data)
        return
      }

      const data = await response.json()

      if (!response.ok) {
        if (!silent) {
          toast({
            title: "Error",
            description: data.error || "Failed to fetch repositories",
            variant: "destructive",
          })
        }
        return
      }

      setRepos(data)
      if (!silent) {
        toast({
          title: "Success",
          description: `Loaded ${data.length} repositories from GitHub App`,
        })
      }
      console.log('GitHub Repositories (App Installation):', data)

      // Reload from database to get updated data with health scores if needed
      // But we just setRepos, so maybe not strictly needed unless we want DB ID.
      // await loadRepositories() 
    } catch (error) {
      console.error('Error connecting to GitHub:', error)
      if (!silent) {
        toast({
          title: "Connection Error",
          description: "Failed to connect to GitHub. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoadingRepos(false)
    }
  }

  // Load repositories from database
  const loadRepositories = async () => {
    setIsLoadingRepos(true)
    try {
      const response = await fetch('/api/repositories')
      const data = await response.json()

      if (response.ok) {
        setRepos(data)
        console.log(`Loaded ${data.length} repositories from database`)

        if (data.length === 0) {
          // Auto-fetch from GitHub if DB is empty
          await fetchGitHubRepos(true)
        }
      }
    } catch (error) {
      console.error('Error loading repositories:', error)
    } finally {
      setIsLoadingRepos(false)
    }
  }

  useEffect(() => {
    params.then(p => setId(p.id))
    // Load repositories from database on mount
    loadRepositories()
  }, [params])

  const handleConnectGitHub = async () => {
    // Redirect to GitHub App installation/authorization
    window.location.href = '/api/github/install'
  }

  // Check for GitHub connection status from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const githubInstalled = urlParams.get('github_installed')
    const githubConnected = urlParams.get('github_connected')
    const error = urlParams.get('error')

    console.log('Dashboard URL params:', { githubInstalled, githubConnected, error })

    if (githubInstalled === 'true') {
      console.log('GitHub App installed, fetching repositories...')
      toast({
        title: "Success",
        description: "GitHub App installed successfully! Loading your repositories...",
      })
      // Fetch repositories from GitHub and save to database
      fetchGitHubRepos()
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (githubConnected === 'true') {
      toast({
        title: "Success",
        description: "GitHub connected successfully!",
      })
      // Fetch repositories after successful connection
      fetchGitHubRepos()
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    } else if (error) {
      let errorMessage = 'An error occurred with GitHub authorization'
      switch (error) {
        case 'session_expired':
          errorMessage = 'Your session expired. Please log in again.'
          break
        case 'invalid_state':
          errorMessage = 'Invalid authorization state. Please try again.'
          break
        case 'github_auth_failed':
          errorMessage = 'GitHub authorization failed. Please try again.'
          break
        case 'missing_parameters':
          errorMessage = 'Missing authorization parameters. Please try again.'
          break
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#69E300]/30 font-sans">
      <div className="relative h-[750px] w-full overflow-hidden">
        {/* Background Visualization */}
        <div className="absolute inset-0 z-0">
          <LaserFlow
            color="#69E300"
            fogIntensity={1.0}
            wispDensity={2.0}
            flowSpeed={0.5}
            verticalSizing={4.0}
            horizontalSizing={1.2}
            className="scale-125 origin-top"
          />
        </div>

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-transparent to-black" />

        {/* Hero Overlay Content */}
        <div className="absolute inset-0 z-20">
          <div className="container mx-auto px-6 h-full flex flex-col justify-center pt-6">
            <h1 className="text-7xl font-black tracking-tighter mb-6 max-w-3xl font-display leading-[0.9] animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
              Agentic <span className="text-[#69E300]">Observability</span>
            </h1>
            <p className="text-white/50 text-xl max-w-2xl leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              Monitoring real-time heuristic processing nodes for <span className="text-white font-mono">{id}</span>.
              Visualizing the concurrent reasoning streams across your infrastructure.
            </p>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 -mt-32 relative z-30 space-y-12 mb-32 max-w-[1400px]">
        {/* Glass Dashboard Navigation Bar */}
        <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-8 py-4 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="relative flex-1">
            <textarea
              placeholder="Paste GitHub PR URL here..."
              className="bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#69E300]/50 transition-all w-full placeholder:text-white/20 resize-none h-12 leading-relaxed"
              rows={1}
              value={prUrl}
              onChange={(e) => setPrUrl(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="flex items-center gap-3 ml-6">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 text-white/40 hover:text-[#69E300] transition-colors"
              title="Connect GitHub"
              onClick={handleConnectGitHub}
              disabled={isLoadingRepos}
            >
              <Github className={`h-5 w-5 ${isLoadingRepos ? 'animate-spin' : ''}`} />
            </Button>
            <div className="h-10 w-px bg-white/10" />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-12 w-12 transition-colors ${emailNotificationsEnabled ? "text-[#69E300] bg-[#69E300]/10" : "text-white/40 hover:text-[#69E300]"}`}
                  title="Notifications"
                >
                  <Bell className="h-5 w-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-[#171717] border border-white/10 text-white p-4 backdrop-blur-xl">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-[#69E300] uppercase tracking-widest flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Notification Settings
                  </h4>
                  <div className="flex items-center space-x-4 rounded-lg border border-white/5 bg-white/5 p-4">
                    <Mail className="h-5 w-5 text-white/50" />
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="email-notifications" className="text-sm font-medium leading-none text-white">
                        Email Reports
                      </Label>
                      <p className="text-xs text-white/50">
                        Receive detailed audit reports via email.
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={emailNotificationsEnabled}
                      onCheckedChange={setEmailNotificationsEnabled}
                      className="data-[state=checked]:bg-[#69E300]"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 text-white/40 hover:text-[#69E300] transition-colors"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              className="bg-[#69E300] text-black font-bold text-sm px-6 h-12 rounded-lg hover:bg-[#5bc500] transition-all flex items-center gap-2"
              title="Submit PR for Analysis"
              onClick={handleSubmitPR}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <RotateCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Submit
            </Button>
          </div>
        </div>        {/* Global Performance Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-[#69E300]">
            <Activity className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] font-mono">Global Telemetry</span>
          </div>
          <GlobalStats />
        </div>

        {/* Repository Health Section */}
        <div className="space-y-8 pt-4">
          <div className="flex items-end justify-between border-b border-white/5 pb-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tight font-display">Active Repositories</h2>
              <p className="text-white/40 text-sm">Ghostwriter nodes currently analyzing codebase health.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="text-xs border-white/10 bg-white/5 h-9 hover:bg-[#69E300]/10 hover:text-[#69E300]"
                onClick={() => fetchGitHubRepos(false)}
                disabled={isLoadingRepos}
              >
                <RotateCw className={`h-3 w-3 mr-2 ${isLoadingRepos ? 'animate-spin' : ''}`} />
                Sync
              </Button>
              <Button variant="outline" className="text-xs border-white/10 bg-white/5 h-9">
                Filtered: All
              </Button>
              <Button variant="outline" className="text-xs border-white/10 bg-white/5 h-9">
                Export Audit
              </Button>
            </div>
          </div>
          <RepositoryGrid repos={repos} isLoading={isLoadingRepos} />
        </div>

        {/* Activity & Security Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-2 text-[#69E300] mb-2">
              <Terminal className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] font-mono">Real-time Reasoning</span>
            </div>
            <ActivityFeed />
          </div>

          <div className="space-y-10">
            <div className="rounded-3xl border border-[#69E300]/20 bg-gradient-to-br from-[#69E300]/10 to-transparent p-10 relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 p-4 opacity-5 group-hover:opacity-10 transition-all duration-700">
                <Shield className="h-48 w-48 text-[#69E300] rotate-12" />
              </div>
              <div className="relative z-10 space-y-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#69E300] text-black shadow-[0_0_30px_rgba(105,227,0,0.3)]">
                  <Shield className="h-6 w-6" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-white tracking-tight font-display">Neural Isolation</h3>
                  <p className="text-white/50 leading-relaxed">
                    Zero-trust sandbox active. Every reasoning step is verified before execution.
                  </p>
                </div>
                <Button className="w-full bg-white text-black hover:bg-white/90 font-bold py-6 rounded-xl shadow-xl transition-all active:scale-[0.98]">
                  Security Audit Log
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
