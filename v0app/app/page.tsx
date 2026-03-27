"use client"

import { Dithering } from "@paper-design/shaders-react"
import { useState, useCallback } from "react"
import { SubscriptionModule } from "@/components/subscription-module"
import { NewsletterManager } from "@/components/newsletter-manager"
import { DigitalRain } from "@/components/digital-rain"
import { TextScramble } from "@/components/text-scramble"

type ViewMode = "public" | "admin"
type PublicPage = "home" | "notes" | "projects" | "contact" | "post-detail" | "project-detail"
type AdminSection = "overview" | "content" | "manage-posts" | "newsletter" | "settings"
type EditorMode = "richtext" | "markdown" | "html"

// Sample post content for detail view
const samplePostContent = {
  id: "2",
  title: "Neural Network Fundamentals",
  date: "2026-03-15",
  readTime: "8 min read",
  views: 423,
  tags: ["#AI", "#MachineLearning"],
  content: `
## Understanding Neural Networks

Neural networks are the backbone of modern AI systems. In this deep dive, we&apos;ll explore the fundamental concepts that make them work.

The basic building block is the **perceptron**, a simple function that takes weighted inputs and produces an output through an activation function.

> "The key insight of deep learning is that many layers of simple computations can represent incredibly complex functions."
> - Yoshua Bengio

Here&apos;s a simple implementation of a forward pass:

\`\`\`python
import numpy as np

def sigmoid(x):
    return 1 / (1 + np.exp(-x))

def forward_pass(X, W1, W2):
    hidden = sigmoid(np.dot(X, W1))
    output = sigmoid(np.dot(hidden, W2))
    return output
\`\`\`

The beauty of this approach lies in backpropagation - the algorithm that allows us to compute gradients efficiently.
  `
}

// Sample project content for detail view
const sampleProjectContent = {
  id: "1",
  title: "LifeXP",
  description: "A gamified life management app that turns daily tasks into XP and achievements. Built with a focus on habit formation psychology and game design principles.",
  techStack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Tailwind CSS"],
  urls: [
    { url: "https://github.com/jimin/lifexp", title: "LifeXP - GitHub", description: "Source code repository for the LifeXP gamified task manager", domain: "github.com", favicon: "GH" },
    { url: "https://lifexp.app", title: "LifeXP - Live Demo", description: "Try the live version of the gamified productivity app", domain: "lifexp.app", favicon: "LX" },
  ]
}

const experienceData = [
  { id: "1", role: "GDGoC KAIST Lead", period: "2024 -> ....", description: "Leading developer community initiatives" },
  { id: "2", role: "Madcamp Bootcamp", period: "2024", description: "Intensive development bootcamp participant" },
  { id: "3", role: "TEDxKAIST Organizer", period: "2023 -> 2024", description: "Event organization and speaker coordination" },
  { id: "4", role: "NYU Minor Program", period: "2023", description: "International exchange program" },
]

const educationData = [
  { id: "1", institution: "KAIST (Korea Advanced Institute of Science & Technology)", degree: "B.S. in School of Computing", period: "2022 -> Present" },
]

const digitalGardenNotes = [
  { id: "1", title: "Building Secure APIs", tags: ["#AI", "#InfoSec"], status: "seedling", date: "2026-03-20", isProject: false, views: 312 },
  { id: "2", title: "Neural Network Fundamentals", tags: ["#AI"], status: "evergreen", date: "2026-03-15", isProject: false, views: 423 },
  { id: "3", title: "My Dev Environment Setup", tags: ["#Project"], status: "seedling", date: "2026-03-10", isProject: true, views: 156 },
  { id: "4", title: "CTF Writeup: Web Exploitation", tags: ["#InfoSec"], status: "growing", date: "2026-03-05", isProject: false, views: 198 },
  { id: "5", title: "Transformer Architecture Deep Dive", tags: ["#AI"], status: "evergreen", date: "2026-02-28", isProject: false, views: 287 },
  { id: "6", title: "LifeXP - Gamified Task Manager", tags: ["#Project"], status: "growing", date: "2026-02-20", isProject: true, views: 89 },
]

const projectsData = [
  {
    id: "1",
    title: "LifeXP",
    description: "A gamified life management app that turns daily tasks into XP and achievements.",
    urls: [
      { domain: "github.com", path: "/jimin/lifexp" },
      { domain: "lifexp.app", path: "/" },
    ],
  },
  {
    id: "2",
    title: "SecureVault",
    description: "End-to-end encrypted password manager with zero-knowledge architecture.",
    urls: [
      { domain: "github.com", path: "/jimin/securevault" },
    ],
  },
]

const postsData = [
  { id: "1", title: "Building Secure APIs", date: "2026-03-20", status: "published", isProject: false },
  { id: "2", title: "Neural Network Fundamentals", date: "2026-03-15", status: "published", isProject: false },
  { id: "3", title: "My Dev Environment Setup", date: "2026-03-10", status: "draft", isProject: true },
  { id: "4", title: "CTF Writeup: Web Exploitation", date: "2026-03-05", status: "published", isProject: false },
]

const analyticsData = {
  totalVisitors: 1247,
  avgSessionDuration: "2m 34s",
  p95Latency: "120ms",
  topNotes: [
    { rank: 1, title: "Neural Network Fundamentals", views: 423, dwellTime: "4m 12s" },
    { rank: 2, title: "Building Secure APIs", views: 312, dwellTime: "3m 45s" },
    { rank: 3, title: "Transformer Architecture", views: 287, dwellTime: "5m 02s" },
    { rank: 4, title: "CTF Writeup: Web Exploitation", views: 198, dwellTime: "2m 58s" },
    { rank: 5, title: "LifeXP Project Overview", views: 156, dwellTime: "2m 21s" },
  ],
  trafficSources: [
    { source: "Google Search", percentage: 45 },
    { source: "LinkedIn", percentage: 25 },
    { source: "GitHub", percentage: 20 },
    { source: "Everytime", percentage: 10 },
  ],
  browsers: [
    { name: "Chrome", percentage: 58 },
    { name: "Safari", percentage: 24 },
    { name: "Firefox", percentage: 12 },
    { name: "Edge", percentage: 6 },
  ],
  devices: [
    { name: "Desktop", percentage: 62 },
    { name: "Mobile", percentage: 34 },
    { name: "Tablet", percentage: 4 },
  ],
}

export default function DigitalGardenPage() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("public")
  const [publicPage, setPublicPage] = useState<PublicPage>("home")
  const [adminSection, setAdminSection] = useState<AdminSection>("overview")
  const [editorMode, setEditorMode] = useState<EditorMode>("markdown")
  const [experience, setExperience] = useState(experienceData)
  const [education, setEducation] = useState(educationData)
  const [posts, setPosts] = useState(postsData)
  const [draggedPost, setDraggedPost] = useState<string | null>(null)
  const [activeTagFilter, setActiveTagFilter] = useState<string>("All")
  const [isProjectToggled, setIsProjectToggled] = useState(false)
  const [projectUrls, setProjectUrls] = useState<string[]>([""])
  const [currentPage, setCurrentPage] = useState(1)
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" })
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<number | null>(null)
  const [isPageLoading, setIsPageLoading] = useState(false)
  const [loadingText, setLoadingText] = useState("")
  const notesPerPage = 5

  // Page transition effect
  const navigateToPage = useCallback((page: PublicPage) => {
    setIsPageLoading(true)
    setLoadingText(`cd /${page}`)
    setTimeout(() => {
      setLoadingText("[LOADING...]")
    }, 150)
    setTimeout(() => {
      setPublicPage(page)
      setIsPageLoading(false)
    }, 400)
  }, [])

  // Admin section transition
  const navigateToAdminSection = useCallback((section: AdminSection) => {
    setIsPageLoading(true)
    setLoadingText(`> ${section}`)
    setTimeout(() => {
      setAdminSection(section)
      setIsPageLoading(false)
    }, 300)
  }, [])

  // Calculate contact form intensity based on input
  const contactIntensity = Math.min(
    1,
    (contactForm.name.length + contactForm.email.length + contactForm.message.length) / 100
  )

  const copyToClipboard = useCallback((code: string, index: number) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(index)
    setTimeout(() => setCopiedCode(null), 2000)
  }, [])

  const openPostDetail = (noteId: string) => {
    setSelectedPostId(noteId)
    setPublicPage("post-detail")
  }

  const openProjectDetail = (projectId: string) => {
    setSelectedProjectId(projectId)
    setPublicPage("project-detail")
  }

  const goBackToNotes = () => {
    setSelectedPostId(null)
    setPublicPage("notes")
  }

  const goBackToProjects = () => {
    setSelectedProjectId(null)
    setPublicPage("projects")
  }

  const bgColor = isDarkMode ? "bg-black" : "bg-white"
  const textColor = isDarkMode ? "text-white" : "text-black"
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const activeBg = isDarkMode ? "bg-white/10" : "bg-black/10"

  const tagFilters = ["All", "#AI", "#InfoSec", "#Project"]

  const filteredNotes = activeTagFilter === "All" 
    ? digitalGardenNotes 
    : digitalGardenNotes.filter(note => note.tags.includes(activeTagFilter))
  
  const totalPages = Math.ceil(filteredNotes.length / notesPerPage)
  const paginatedNotes = filteredNotes.slice(
    (currentPage - 1) * notesPerPage,
    currentPage * notesPerPage
  )

  const getStatusSymbol = (status: string) => {
    switch (status) {
      case "seedling": return "[*]"
      case "growing": return "[+]"
      case "evergreen": return "[>]"
      default: return "[-]"
    }
  }

  const renderProgressBar = (percentage: number, width: number = 20) => {
    const filled = Math.round((percentage / 100) * width)
    const empty = width - filled
    return "[" + "=".repeat(filled) + "-".repeat(empty) + "]"
  }

  const handlePostDragStart = (id: string) => setDraggedPost(id)
  const handlePostDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedPost && draggedPost !== targetId) {
      const newPosts = [...posts]
      const dragIndex = newPosts.findIndex(p => p.id === draggedPost)
      const targetIndex = newPosts.findIndex(p => p.id === targetId)
      const [removed] = newPosts.splice(dragIndex, 1)
      newPosts.splice(targetIndex, 0, removed)
      setPosts(newPosts)
    }
  }
  const handlePostDragEnd = () => setDraggedPost(null)

  const deletePost = (id: string) => setPosts(posts.filter(p => p.id !== id))
  
  const addExperience = () => {
    setExperience([...experience, { 
      id: Date.now().toString(), 
      role: "New Position", 
      period: "20XX -> Present",
      description: "Description here" 
    }])
  }
  
  const deleteExperience = (id: string) => setExperience(experience.filter(e => e.id !== id))
  
  const addEducation = () => {
    setEducation([...education, { 
      id: Date.now().toString(), 
      institution: "Institution", 
      degree: "Degree",
      period: "20XX -> Present" 
    }])
  }
  
  const deleteEducation = (id: string) => setEducation(education.filter(e => e.id !== id))

  const addProjectUrl = () => setProjectUrls([...projectUrls, ""])
  const removeProjectUrl = (index: number) => setProjectUrls(projectUrls.filter((_, i) => i !== index))

  return (
    <div className={`relative h-screen overflow-hidden ${bgColor} ${textColor}`}>
      {/* Top Navigation */}
      <header className={`flex items-center justify-between px-8 py-4 border-b ${borderColor} font-mono relative z-20`}>
        <h1 className="text-sm">jimin.garden</h1>
        
        <div className="flex items-center gap-6">
          {/* View Mode Toggle */}
          <div className={`flex text-xs`}>
            <button
              onClick={() => setViewMode("public")}
              className={`px-3 py-1 border-l border-t border-b ${borderColor} transition-colors ${
                viewMode === "public" ? activeBg : hoverBg
              }`}
            >
              public
            </button>
            <button
              onClick={() => setViewMode("admin")}
              className={`px-3 py-1 border ${borderColor} transition-colors ${
                viewMode === "admin" ? activeBg : hoverBg
              }`}
            >
              admin
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`text-xs ${hoverBg} px-2 py-1 transition-colors`}
            aria-label="Toggle theme"
          >
            {isDarkMode ? "[light]" : "[dark]"}
          </button>
        </div>
      </header>

      {viewMode === "public" ? (
        /* PUBLIC VIEW */
        <div className="font-mono h-[calc(100vh-57px)] flex flex-col">
          {/* Public Navigation */}
          <nav className={`flex items-center gap-1 px-8 py-3 text-xs border-b ${borderColor}`}>
            {(["home", "notes", "projects", "contact"] as PublicPage[]).map((page) => (
              <button
                key={page}
                onClick={() => navigateToPage(page)}
                className={`px-3 py-1 transition-colors ${
                  publicPage === page ? activeBg : hoverBg
                }`}
              >
                /{page}
              </button>
            ))}
            {/* Loading Indicator */}
            {isPageLoading && (
              <span className={`ml-4 ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>
                {loadingText}
              </span>
            )}
          </nav>

          {publicPage === "home" ? (
            /* HOME - Split Panel Layout (No Scroll) */
            <div className="flex-1 flex">
              {/* Left Panel - Text Content */}
              <div className="w-1/2 px-8 py-6 flex flex-col justify-center">
                <div className="space-y-6 max-w-md">
                  {/* Hero */}
                  <section className="space-y-3">
                    <p className={`text-xs ${mutedText}`}>// profile</p>
                    <h2 className="text-xl">Jimin Park</h2>
                    <p className={`text-sm leading-relaxed ${mutedText}`}>
                      Undergraduate at KAIST School of Computing. Exploring the intersections of AI, Information Security, and full-stack development.
                    </p>
                    <div className={`flex flex-wrap gap-4 text-xs ${mutedText}`}>
                      <a href="#" className={`${hoverBg} px-1`}>github -&gt;</a>
                      <a href="#" className={`${hoverBg} px-1`}>linkedin -&gt;</a>
                      <a href="mailto:xistoh162108@kaist.ac.kr" className={`${hoverBg} px-1`}>email -&gt;</a>
                      <a href="/resume.pdf" download className={`${hoverBg} px-1`}>[&darr;] fetch resume.pdf</a>
                    </div>
                  </section>

                  {/* Education - Compact */}
                  <section className="space-y-2">
                    <p className={`text-xs ${mutedText}`}>// education</p>
                    <div className="space-y-0.5">
                      {educationData.map((edu) => (
                        <div key={edu.id} className={`text-xs ${hoverBg} py-0.5 px-1 -mx-1`}>
                          <span className={mutedText}>{edu.period}</span>
                          <span className="mx-1">-</span>
                          <span>{edu.institution}, {edu.degree}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Experience - Compact */}
                  <section className="space-y-2">
                    <p className={`text-xs ${mutedText}`}>// experience</p>
                    <div className="space-y-0.5">
                      {experienceData.slice(0, 3).map((exp) => (
                        <div key={exp.id} className={`text-xs ${hoverBg} py-0.5 px-1 -mx-1`}>
                          <span className={mutedText}>{exp.period}</span>
                          <span className="mx-1">-</span>
                          <span>{exp.role}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Recent Notes - Compact */}
                  <section className="space-y-2">
                    <p className={`text-xs ${mutedText}`}>// recent</p>
                    <div className="space-y-0.5">
                      {digitalGardenNotes.slice(0, 3).map((note) => (
                        <a
                          key={note.id}
                          href="#"
                          className={`block text-xs ${hoverBg} py-0.5 px-1 -mx-1 transition-colors`}
                        >
                          <span className={mutedText}>{note.date}</span>
                          <span className="mx-1">-</span>
                          <span>{note.title}</span>
                          <span className="mx-1">-&gt;</span>
                        </a>
                      ))}
                    </div>
                    <button
                      onClick={() => setPublicPage("notes")}
                      className={`text-xs ${mutedText} ${hoverBg} px-1`}
                    >
                      [+] all notes
                    </button>
                  </section>

                  {/* Subscription - Inline */}
                  <section className="pt-2">
                    <SubscriptionModule isDarkMode={isDarkMode} compact />
                  </section>
                </div>
              </div>

              {/* Right Panel - Dithering Shader */}
              <div className="w-1/2 relative">
                <div className="absolute inset-0">
                  <Dithering
                    style={{ height: "100%", width: "100%" }}
                    colorBack={isDarkMode ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 95%)"}
                    colorFront={isDarkMode ? "#D4FF00" : "#3F5200"}
                    shape="cat"
                    type="4x4"
                    pxSize={2}
                    scale={0.5}
                    speed={0.05}
                  />
                </div>
              </div>
            </div>
          ) : publicPage === "contact" ? (
            /* CONTACT - Split Panel Layout with Digital Rain */
            <div className="flex-1 flex">
              {/* Left Panel - Form */}
              <div className="w-1/2 px-8 py-6 flex flex-col justify-center">
                <div className="space-y-8 max-w-md">
                  <section className="space-y-3">
                    <p className={`text-xs ${mutedText}`}>// contact</p>
                    <h2 className="text-lg">Get in Touch</h2>
                  </section>

                  {/* Availability Status */}
                  <p className={`text-sm ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>
                    [*] Open to new opportunities &amp; collaborations
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className={mutedText}>email:</span>{" "}
                      <a href="mailto:xistoh162108@kaist.ac.kr" className={hoverBg}>
                        xistoh162108@kaist.ac.kr -&gt;
                      </a>
                    </p>
                    <p>
                      <span className={mutedText}>github:</span>{" "}
                      <a href="#" className={hoverBg}>github.com/jimin -&gt;</a>
                    </p>
                    <p>
                      <span className={mutedText}>linkedin:</span>{" "}
                      <a href="#" className={hoverBg}>linkedin.com/in/jimin -&gt;</a>
                    </p>
                  </div>

                  {/* Terminal Contact Form */}
                  <section className="space-y-4">
                    <p className={`text-xs ${mutedText}`}>// direct message</p>
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault()
                        setContactForm({ name: "", email: "", message: "" })
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <input
                          type="text"
                          value={contactForm.name}
                          onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="Name_"
                          className={`w-full bg-transparent border-b ${borderColor} py-2 text-sm outline-none transition-colors ${
                            isDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]/50" : "placeholder:text-black/30 focus:border-[#3F5200]/50"
                          }`}
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="Email_"
                          className={`w-full bg-transparent border-b ${borderColor} py-2 text-sm outline-none transition-colors ${
                            isDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]/50" : "placeholder:text-black/30 focus:border-[#3F5200]/50"
                          }`}
                        />
                      </div>
                      <div className="relative">
                        <textarea
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder="Message_"
                          rows={4}
                          className={`w-full bg-transparent border-b ${borderColor} pb-1 pt-0 text-sm outline-none resize-none transition-colors leading-tight ${
                            isDarkMode ? "placeholder:text-white/30 focus:border-[#D4FF00]/50" : "placeholder:text-black/30 focus:border-[#3F5200]/50"
                          }`}
                        />
                      </div>
                      <button
                        type="submit"
                        className={`text-xs px-3 py-2 border transition-all ${borderColor} ${hoverBg} ${
                          contactIntensity > 0.5 
                            ? (isDarkMode ? "border-[#D4FF00]/50 text-[#D4FF00]" : "border-[#3F5200]/50 text-[#3F5200]")
                            : ""
                        }`}
                      >
                        [ Submit ]
                      </button>
                    </form>
                  </section>
                </div>
              </div>

              {/* Right Panel - Digital Rain with Text Scramble */}
              <div className="w-1/2 relative overflow-hidden">
                <DigitalRain intensity={contactIntensity} isDarkMode={isDarkMode} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <TextScramble 
                    targetText="[CONNECTION_ESTABLISHED]" 
                    duration={1500} 
                    isDarkMode={isDarkMode} 
                  />
                </div>
              </div>
            </div>
          ) : publicPage === "notes" ? (
            /* NOTES - Split Panel Layout */
            <div className="flex-1 flex">
              {/* Left Panel - Notes List */}
              <div className="w-1/2 px-8 py-6 overflow-y-auto pb-32">
                <div className="space-y-6 max-w-lg">
                  <section className="space-y-3">
                    <p className={`text-xs ${mutedText}`}>// digital garden</p>
                    <h2 className="text-lg">Notes &amp; Seeds</h2>
                    <p className={`text-sm ${mutedText}`}>
                      [*] seedling | [+] growing | [&gt;] evergreen
                    </p>
                  </section>

                  {/* Tag Filter UI */}
                  <div className="flex gap-2 text-xs">
                    {tagFilters.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          setActiveTagFilter(tag)
                          setCurrentPage(1)
                        }}
                        className={`px-2 py-1 border ${borderColor} transition-colors ${
                          activeTagFilter === tag ? activeBg : hoverBg
                        }`}
                      >
                        [{tag}]
                      </button>
                    ))}
                  </div>
                  
                  <div className="space-y-1">
                    {paginatedNotes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => note.isProject ? openProjectDetail(note.id) : openPostDetail(note.id)}
                        className={`flex items-baseline gap-3 text-sm ${hoverBg} py-2 px-2 -mx-2 transition-colors w-full text-left`}
                      >
                        <span className={`${mutedText} w-20 shrink-0`}>{note.date}</span>
                        <span className={`${mutedText} w-8 shrink-0`}>{getStatusSymbol(note.status)}</span>
                        <span className="flex-1">{note.title}</span>
                        <span className={`${mutedText} text-xs shrink-0`}>[v: {note.views.toLocaleString()}]</span>
                        <span className={`${mutedText} text-xs`}>{note.tags.join(" ")}</span>
                      </button>
                    ))}
                  </div>

                  {/* Terminal-style Pagination */}
                  {totalPages > 1 && (
                    <div className={`flex items-center justify-center gap-2 text-xs ${mutedText} pt-4`}>
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-2 py-1 ${currentPage === 1 ? "opacity-30" : hoverBg}`}
                      >
                        [&lt;]
                      </button>
                      <span>
                        {(currentPage - 1) * notesPerPage + 1}-{Math.min(currentPage * notesPerPage, filteredNotes.length)} / {filteredNotes.length}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-2 py-1 ${currentPage === totalPages ? "opacity-30" : hoverBg}`}
                      >
                        [&gt;]
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Panel - Dithering Shader */}
              <div className="w-1/2 relative">
                <div className="absolute inset-0">
                  <Dithering
                    style={{ height: "100%", width: "100%" }}
                    colorBack={isDarkMode ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 95%)"}
                    colorFront={isDarkMode ? "#D4FF00" : "#3F5200"}
                    shape="noise"
                    type="4x4"
                    pxSize={2}
                    scale={0.4}
                    speed={0.03}
                  />
                </div>
              </div>
            </div>
          ) : publicPage === "projects" ? (
            /* PROJECTS - Split Panel Layout */
            <div className="flex-1 flex">
              {/* Left Panel - Projects List */}
              <div className="w-1/2 px-8 py-6 overflow-y-auto">
                <div className="space-y-6 max-w-lg">
                  <section className="space-y-3">
                    <p className={`text-xs ${mutedText}`}>// projects</p>
                    <h2 className="text-lg">Featured Work</h2>
                  </section>
                  
                  <div className="space-y-6">
                    {projectsData.map((project) => (
                      <div key={project.id} className="space-y-2">
                        <button 
                          onClick={() => openProjectDetail(project.id)}
                          className={`text-sm ${hoverBg} px-1 -mx-1 text-left`}
                        >
                          {project.title} -&gt;
                        </button>
                        <p className={`text-sm ${mutedText}`}>{project.description}</p>
                        <div className="flex gap-4 text-xs">
                          {project.urls.map((url, i) => (
                            <a key={i} href="#" className={`${hoverBg} px-1`}>
                              {url.domain}{url.path} -&gt;
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Panel - Dithering Shader */}
              <div className="w-1/2 relative">
                <div className="absolute inset-0">
                  <Dithering
                    style={{ height: "100%", width: "100%" }}
                    colorBack={isDarkMode ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 95%)"}
                    colorFront={isDarkMode ? "#D4FF00" : "#3F5200"}
                    shape="warp"
                    type="4x4"
                    pxSize={2}
                    scale={0.35}
                    speed={0.04}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Other Pages - Scrollable (Post/Project Detail) */
            <div className="flex-1 overflow-y-auto">
              <main className="px-8 py-6 max-w-3xl">



                {/* Single Post Detail View */}
                {publicPage === "post-detail" && (
                  <div className="space-y-6 max-w-2xl">
                    <button
                      onClick={goBackToNotes}
                      className={`text-xs ${mutedText} ${hoverBg} px-1`}
                    >
                      [&larr;] back to notes
                    </button>

                    <section className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <p className={`text-xs ${mutedText}`}>// {samplePostContent.date} - {samplePostContent.readTime}</p>
                          <span className={`text-xs ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>[v: {samplePostContent.views.toLocaleString()}]</span>
                        </div>
                        <h1 className="text-xl">{samplePostContent.title}</h1>
                        <div className="flex gap-2 text-xs">
                          {samplePostContent.tags.map((tag) => (
                            <span key={tag} className={mutedText}>{tag}</span>
                          ))}
                        </div>
                      </div>

                      {/* Rendered Markdown Content with Tokyo Night Syntax */}
                      <article className="prose-terminal space-y-4 text-sm leading-relaxed font-[var(--font-jetbrains-mono),monospace]">
                        {samplePostContent.content.trim().split("\n\n").map((block, i) => {
                          if (block.startsWith("## ")) {
                            return <h2 key={i} className="text-base pt-4">{block.replace("## ", "")}</h2>
                          }
                          if (block.startsWith("> ")) {
                            return (
                              <blockquote key={i} className={`border-l-2 ${isDarkMode ? "border-[#D4FF00]/30" : "border-[#3F5200]/30"} pl-4 ${mutedText} italic`}>
                                {block.split("\n").map((line, j) => (
                                  <p key={j}>{line.replace("> ", "")}</p>
                                ))}
                              </blockquote>
                            )
                          }
                          if (block.startsWith("```")) {
                            const lines = block.split("\n")
                            const lang = lines[0].replace("```", "")
                            const code = lines.slice(1, -1).join("\n")
                            
                            // Tokyo Night inspired syntax highlighting
                            const highlightedCode = code
                              .replace(/\b(import|from|def|return|class|if|else|for|while|try|except|with|as|in|and|or|not|True|False|None)\b/g, 
                                `<span class="${isDarkMode ? "text-[#bb9af7]" : "text-purple-700"}">$1</span>`)
                              .replace(/\b(np|numpy|math|os|sys)\b/g, 
                                `<span class="${isDarkMode ? "text-[#7dcfff]" : "text-cyan-700"}">$1</span>`)
                              .replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g, 
                                `<span class="${isDarkMode ? "text-[#7aa2f7]" : "text-blue-700"}">$1</span>`)
                              .replace(/(["'])(.*?)\1/g, 
                                `<span class="${isDarkMode ? "text-[#9ece6a]" : "text-green-700"}">$1$2$1</span>`)
                              .replace(/#.*$/gm, 
                                `<span class="${isDarkMode ? "text-[#565f89]" : "text-gray-500"}">$&</span>`)
                              .replace(/\b(\d+\.?\d*)\b/g, 
                                `<span class="${isDarkMode ? "text-[#ff9e64]" : "text-orange-700"}">$1</span>`)
                            
                            return (
                              <div key={i} className="relative group">
                                <div className={`flex items-center justify-between px-4 py-2 border-t border-x ${borderColor} ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-100"}`}>
                                  <span className={`text-xs ${mutedText}`}>// {lang}</span>
                                  <button 
                                    onClick={() => copyToClipboard(code, i)}
                                    className={`text-xs ${hoverBg} px-2 py-0.5 transition-colors ${
                                      copiedCode === i 
                                        ? (isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]")
                                        : mutedText
                                    }`}
                                  >
                                    {copiedCode === i ? "[copied]" : "[y]"}
                                  </button>
                                </div>
                                <pre className={`p-4 border ${borderColor} overflow-x-auto text-xs ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-50"}`}>
                                  <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                                </pre>
                              </div>
                            )
                          }
                          // Parse inline formatting
                          const formatted = block
                            .replace(/\*\*(.*?)\*\*/g, `<strong class="${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}">$1</strong>`)
                            .replace(/`([^`]+)`/g, `<code class="px-1.5 py-0.5 text-xs ${isDarkMode ? "bg-[#1a1a1a] text-[#7aa2f7]" : "bg-gray-100 text-blue-700"}">$1</code>`)
                          return <p key={i} className={mutedText} dangerouslySetInnerHTML={{ __html: formatted }} />
                        })}
                      </article>

                      {/* Post Footer */}
                      <div className={`pt-8 border-t ${borderColor} space-y-4`}>
                        <p className={`text-xs ${mutedText}`}>// end of note</p>
                        <div className="flex gap-4 text-xs">
                          <button className={`${hoverBg} px-2 py-1`}>[share]</button>
                          <button className={`${hoverBg} px-2 py-1`}>[copy link]</button>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* Single Project Detail View */}
                {publicPage === "project-detail" && (
                  <div className="space-y-6 max-w-2xl">
                    <button
                      onClick={goBackToProjects}
                      className={`text-xs ${mutedText} ${hoverBg} px-1`}
                    >
                      [&larr;] back to projects
                    </button>

                    <section className="space-y-6">
                      <div className="space-y-3">
                        <p className={`text-xs ${mutedText}`}>// project</p>
                        <h1 className="text-xl">{sampleProjectContent.title}</h1>
                        <p className={`text-sm ${mutedText} leading-relaxed`}>
                          {sampleProjectContent.description}
                        </p>
                      </div>

                      {/* Tech Stack */}
                      <div className="space-y-2">
                        <p className={`text-xs ${mutedText}`}>// tech stack</p>
                        <div className="flex flex-wrap gap-2">
                          {sampleProjectContent.techStack.map((tech) => (
                            <span 
                              key={tech} 
                              className={`text-xs px-2 py-1 border ${borderColor}`}
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* URL Preview Cards */}
                      <div className="space-y-3">
                        <p className={`text-xs ${mutedText}`}>// links</p>
                        <div className="space-y-3">
                          {sampleProjectContent.urls.map((urlData, i) => (
                            <a
                              key={i}
                              href={urlData.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`block border ${borderColor} p-4 ${hoverBg} transition-colors`}
                            >
                              <div className="flex items-start gap-4">
                                {/* Favicon placeholder */}
                                <div className={`w-10 h-10 border ${borderColor} flex items-center justify-center text-xs shrink-0`}>
                                  {urlData.favicon}
                                </div>
                                <div className="space-y-1 min-w-0">
                                  <p className="text-sm truncate">{urlData.title}</p>
                                  <p className={`text-xs ${mutedText} line-clamp-2`}>{urlData.description}</p>
                                  <p className={`text-xs ${mutedText}`}>{urlData.domain} -&gt;</p>
                                </div>
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>

                      {/* Project Footer */}
                      <div className={`pt-8 border-t ${borderColor} space-y-4`}>
                        <p className={`text-xs ${mutedText}`}>// end of project</p>
                        <div className="flex gap-4 text-xs">
                          <button className={`${hoverBg} px-2 py-1`}>[share]</button>
                          <button className={`${hoverBg} px-2 py-1`}>[copy link]</button>
                        </div>
                      </div>
                    </section>
                  </div>
                )}
              </main>
            </div>
          )}

          {/* Sticky Subscribe Footer - Only on Notes View (Left Side) */}
          {publicPage === "notes" && (
            <div className={`fixed bottom-0 left-0 w-1/2 ${bgColor} border-t ${borderColor} px-8 py-4 font-mono z-30`}>
              <div className="max-w-lg flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <p className={`text-xs ${mutedText}`}>// stay in the loop</p>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    className={`px-3 py-1.5 text-xs border ${borderColor} bg-transparent outline-none w-40 ${
                      isDarkMode ? "text-white placeholder:text-white/30" : "text-black placeholder:text-black/30"
                    }`}
                  />
                  <button className={`px-3 py-1.5 text-xs border ${borderColor} ${hoverBg}`}>
                    Subscribe
                  </button>
                </div>
                <div className="flex gap-3 text-xs">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <span className={`w-3 h-3 border ${borderColor} flex items-center justify-center text-[10px] ${isDarkMode ? "bg-white/20" : "bg-black/20"}`}>*</span>
                    <span className={mutedText}>All</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <span className={`w-3 h-3 border ${borderColor} flex items-center justify-center text-[10px]`}></span>
                    <span className={mutedText}>AI</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <span className={`w-3 h-3 border ${borderColor} flex items-center justify-center text-[10px]`}></span>
                    <span className={mutedText}>Projects</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ADMIN VIEW */
        <div className="flex font-mono h-[calc(100vh-57px)]">
          {/* Admin Sidebar */}
          <aside className={`w-52 border-r ${borderColor} p-4 space-y-1 shrink-0`}>
            <p className={`text-xs ${mutedText} mb-4`}>// admin</p>
            {[
              { key: "overview", label: "Analytics" },
              { key: "content", label: "[+] New Content" },
              { key: "manage-posts", label: "Manage Posts" },
              { key: "newsletter", label: "Newsletter" },
              { key: "settings", label: "Profile / CV" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => navigateToAdminSection(item.key as AdminSection)}
                className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                  adminSection === item.key ? activeBg : hoverBg
                }`}
              >
                {item.label}
              </button>
            ))}
            {/* Loading Indicator */}
            {isPageLoading && (
              <p className={`text-xs mt-4 ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>
                {loadingText}
              </p>
            )}
          </aside>

          {/* Admin Content - Split Panel for Analytics */}
          {adminSection === "overview" ? (
            <div className="flex-1 flex">
              {/* Left Panel - Analytics Dashboard */}
              <div className="w-1/2 p-6 overflow-y-auto">
                <div className="space-y-6 font-mono">
                <div>
                  <p className={`text-xs ${mutedText}`}>// analytics</p>
                  <h2 className="text-lg mt-1">Terminal Dashboard</h2>
                </div>

                {/* Key Metrics - Stark Text Blocks */}
                <div className={`border ${borderColor} p-4 space-y-3`}>
                  <p className={`text-xs ${mutedText}`}>--- KEY METRICS ---</p>
                  <div className="grid grid-cols-3 gap-6 text-sm">
                    <div>
                      <p className={`text-xs ${mutedText}`}>TOTAL_VISITORS</p>
                      <p className="text-2xl font-bold">{analyticsData.totalVisitors.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${mutedText}`}>AVG_SESSION_DUR</p>
                      <p className="text-2xl font-bold">{analyticsData.avgSessionDuration}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${mutedText}`}>P95_LATENCY</p>
                      <p className="text-2xl font-bold">{analyticsData.p95Latency}</p>
                    </div>
                  </div>
                </div>

                {/* Top Performing Notes - Monospace Table */}
                <div className={`border ${borderColor} p-4 space-y-3`}>
                  <p className={`text-xs ${mutedText}`}>--- TOP PERFORMING NOTES ---</p>
                  <div className="text-xs">
                    <div className={`flex gap-4 py-1 ${mutedText} border-b ${borderColor}`}>
                      <span className="w-8">[#]</span>
                      <span className="flex-1">NOTE_TITLE</span>
                      <span className="w-16 text-right">VIEWS</span>
                      <span className="w-20 text-right">DWELL_TIME</span>
                    </div>
                    {analyticsData.topNotes.map((note) => (
                      <div key={note.rank} className={`flex gap-4 py-1.5 ${hoverBg}`}>
                        <span className={`w-8 ${mutedText}`}>[{note.rank}]</span>
                        <span className="flex-1 truncate">{note.title}</span>
                        <span className="w-16 text-right">{note.views}</span>
                        <span className={`w-20 text-right ${mutedText}`}>{note.dwellTime}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Traffic Sources - UTF-8 Bars */}
                <div className={`border ${borderColor} p-4 space-y-3`}>
                  <p className={`text-xs ${mutedText}`}>--- TRAFFIC SOURCES ---</p>
                  <div className="space-y-2 text-xs">
                    {analyticsData.trafficSources.map((source) => (
                      <div key={source.source} className="flex items-center gap-3">
                        <span className="w-28 truncate">{source.source}</span>
                        <span className={mutedText}>{renderProgressBar(source.percentage)}</span>
                        <span className="w-10 text-right">{source.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Client Environment */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`border ${borderColor} p-4 space-y-3`}>
                    <p className={`text-xs ${mutedText}`}>--- BROWSER STATS ---</p>
                    <div className="space-y-1.5 text-xs">
                      {analyticsData.browsers.map((browser) => (
                        <div key={browser.name} className="flex items-center gap-2">
                          <span className="w-16">{browser.name}</span>
                          <span className={mutedText}>{renderProgressBar(browser.percentage, 12)}</span>
                          <span className="w-8 text-right">{browser.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className={`border ${borderColor} p-4 space-y-3`}>
                    <p className={`text-xs ${mutedText}`}>--- DEVICE TYPES ---</p>
                    <div className="space-y-1.5 text-xs">
                      {analyticsData.devices.map((device) => (
                        <div key={device.name} className="flex items-center gap-2">
                          <span className="w-16">{device.name}</span>
                          <span className={mutedText}>{renderProgressBar(device.percentage, 12)}</span>
                          <span className="w-8 text-right">{device.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

              {/* Right Panel - High-density Dithering */}
              <div className="w-1/2 relative">
                <div className="absolute inset-0">
                  <Dithering
                    style={{ height: "100%", width: "100%" }}
                    colorBack={isDarkMode ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 95%)"}
                    colorFront={isDarkMode ? "#D4FF00" : "#3F5200"}
                    shape="grid"
                    type="2x2"
                    pxSize={1}
                    scale={0.6}
                    speed={0.08}
                  />
                </div>
                {/* System Status Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`text-center ${mutedText}`}>
                    <p className="text-xs">// SYSTEM STATUS</p>
                    <p className={`text-lg mt-2 ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>[OPERATIONAL]</p>
                  </div>
                </div>
              </div>
            </div>
          ) : adminSection === "newsletter" ? (
            /* NEWSLETTER - Split Panel Layout */
            <div className="flex-1 flex">
              {/* Left Panel - Newsletter Manager */}
              <div className="w-1/2 p-6 overflow-y-auto">
                <NewsletterManager isDarkMode={isDarkMode} />
              </div>

              {/* Right Panel - High-density Dithering */}
              <div className="w-1/2 relative">
                <div className="absolute inset-0">
                  <Dithering
                    style={{ height: "100%", width: "100%" }}
                    colorBack={isDarkMode ? "hsl(0, 0%, 0%)" : "hsl(0, 0%, 95%)"}
                    colorFront={isDarkMode ? "#D4FF00" : "#3F5200"}
                    shape="warp"
                    type="2x2"
                    pxSize={1}
                    scale={0.5}
                    speed={0.06}
                  />
                </div>
                {/* System Status Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`text-center ${mutedText}`}>
                    <p className="text-xs">// CAMPAIGN SYSTEM</p>
                    <p className={`text-lg mt-2 ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}>[READY]</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Other Admin Sections */
            <main className="flex-1 p-6 overflow-y-auto">
            {adminSection === "content" && (
              /* UNIFIED CONTENT EDITOR */
              <div className="space-y-6 max-w-3xl">
                <div>
                  <p className={`text-xs ${mutedText}`}>// new content</p>
                  <h2 className="text-lg mt-1">Content Editor</h2>
                </div>

                {/* Title Input */}
                <div>
                  <label className={`text-xs ${mutedText} block mb-2`}>Title</label>
                  <input
                    type="text"
                    placeholder="Enter post title..."
                    className={`w-full px-3 py-2 border ${borderColor} bg-transparent outline-none text-sm`}
                  />
                </div>

                {/* Project Toggle */}
                <div className={`flex items-center gap-3 py-3 px-4 border ${borderColor}`}>
                  <button
                    onClick={() => setIsProjectToggled(!isProjectToggled)}
                    className={`w-10 h-5 border ${borderColor} flex items-center transition-colors ${
                      isProjectToggled ? (isDarkMode ? "bg-white/20" : "bg-black/20") : ""
                    }`}
                  >
                    <span 
                      className={`w-4 h-4 ${isDarkMode ? "bg-white" : "bg-black"} transition-transform ${
                        isProjectToggled ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-sm">Mark as Project</span>
                  <span className={`text-xs ${mutedText}`}>
                    {isProjectToggled ? "(Will show in Projects section)" : "(Regular note/post)"}
                  </span>
                </div>

                {/* Conditional Project Fields */}
                {isProjectToggled && (
                  <div className={`space-y-4 p-4 border ${borderColor} ${isDarkMode ? "bg-white/5" : "bg-black/5"}`}>
                    <p className={`text-xs ${mutedText}`}>// project details</p>
                    
                    {/* Multiple URL Inputs */}
                    <div className="space-y-2">
                      <label className={`text-xs ${mutedText}`}>Project URLs</label>
                      {projectUrls.map((url, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://github.com/..."
                            value={url}
                            onChange={(e) => {
                              const newUrls = [...projectUrls]
                              newUrls[index] = e.target.value
                              setProjectUrls(newUrls)
                            }}
                            className={`flex-1 px-3 py-2 border ${borderColor} bg-transparent outline-none text-sm`}
                          />
                          {projectUrls.length > 1 && (
                            <button
                              onClick={() => removeProjectUrl(index)}
                              className={`px-3 py-2 text-xs border ${borderColor} ${hoverBg}`}
                            >
                              x
                            </button>
                          )}
                        </div>
                      ))}
                      <button 
                        onClick={addProjectUrl}
                        className={`text-xs ${mutedText} ${hoverBg} px-2 py-1`}
                      >
                        [+] Add another URL
                      </button>
                    </div>

                    {/* Preview Card */}
                    <div className="space-y-2">
                      <label className={`text-xs ${mutedText}`}>Preview Card</label>
                      <div className={`border-2 border-dashed ${borderColor} p-6 text-center`}>
                        <p className={`text-sm ${mutedText}`}>Drop preview image here</p>
                        <p className={`text-xs ${mutedText} mt-1`}>or click to upload</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Upload Zone */}
                <div className={`border-2 border-dashed ${borderColor} p-6 text-center`}>
                  <p className={`text-sm ${mutedText}`}>Drag &amp; Drop Image Upload</p>
                  <p className={`text-xs ${mutedText} mt-2`}>or click to browse files</p>
                </div>

                {/* Editor Mode Tabs */}
                <div className={`flex border-b ${borderColor}`}>
                  {(["richtext", "markdown", "html"] as EditorMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setEditorMode(mode)}
                      className={`px-4 py-2 text-xs transition-colors ${
                        editorMode === mode
                          ? `${activeBg} border-b-2 ${isDarkMode ? "border-white" : "border-black"}`
                          : hoverBg
                      }`}
                    >
                      {mode === "richtext" && "Rich Text"}
                      {mode === "markdown" && "Markdown"}
                      {mode === "html" && "Raw HTML"}
                    </button>
                  ))}
                </div>

                {/* Toolbar for Rich Text */}
                {editorMode === "richtext" && (
                  <div className={`flex items-center gap-1 border ${borderColor} p-2`}>
                    {["B", "I", "U", "H1", "H2", "link", "list", "code"].map((btn) => (
                      <button
                        key={btn}
                        className={`px-3 py-1 text-xs ${hoverBg} transition-colors`}
                      >
                        {btn}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  placeholder={
                    editorMode === "markdown"
                      ? "# Title\n\nStart writing in markdown..."
                      : editorMode === "html"
                      ? "<article>\n  <h1>Title</h1>\n  <p>Content...</p>\n</article>"
                      : "Start writing your post..."
                  }
                  className={`w-full h-64 p-4 border ${borderColor} bg-transparent resize-none outline-none text-sm`}
                />

                {/* Tags */}
                <div>
                  <label className={`text-xs ${mutedText} block mb-2`}>Tags</label>
                  <input
                    type="text"
                    placeholder="#AI, #InfoSec, #Project..."
                    className={`w-full px-3 py-2 border ${borderColor} bg-transparent outline-none text-sm`}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button className={`px-4 py-2 text-xs border ${borderColor} ${hoverBg}`}>
                    Save Draft
                  </button>
                  <button className={`px-4 py-2 text-xs ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}>
                    Publish
                  </button>
                </div>
              </div>
            )}

            {adminSection === "manage-posts" && (
              <div className="space-y-6 max-w-3xl">
                <div>
                  <p className={`text-xs ${mutedText}`}>// manage posts</p>
                  <h2 className="text-lg mt-1">All Content</h2>
                </div>

                <div className="space-y-1">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={() => handlePostDragStart(post.id)}
                      onDragOver={(e) => handlePostDragOver(e, post.id)}
                      onDragEnd={handlePostDragEnd}
                      className={`flex items-center gap-4 py-3 px-3 border ${borderColor} ${
                        draggedPost === post.id ? "opacity-50" : ""
                      } ${hoverBg} transition-colors`}
                    >
                      {/* Drag Handle */}
                      <span className={`cursor-grab ${mutedText}`}>
                        =
                      </span>
                      
                      <span className={`text-xs ${mutedText} w-24`}>{post.date}</span>
                      <span className="flex-1 text-sm">{post.title}</span>
                      
                      {/* Type indicator */}
                      <span className={`text-xs px-2 py-0.5 ${mutedText}`}>
                        {post.isProject ? "[project]" : "[note]"}
                      </span>
                      
                      <span className={`text-xs px-2 py-0.5 ${
                        post.status === "published" 
                          ? isDarkMode ? "text-green-400" : "text-green-600"
                          : mutedText
                      }`}>
                        [{post.status}]
                      </span>
                      
                      <div className="flex gap-2 text-xs">
                        <button className={`${hoverBg} px-2 py-1`}>Edit</button>
                        <button className={`${hoverBg} px-2 py-1`}>Date</button>
                        <button 
                          onClick={() => deletePost(post.id)}
                          className={`${hoverBg} px-2 py-1 ${isDarkMode ? "text-red-400" : "text-red-600"}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {adminSection === "settings" && (
              <div className="space-y-8 max-w-3xl">
                <div>
                  <p className={`text-xs ${mutedText}`}>// profile settings</p>
                  <h2 className="text-lg mt-1">Profile &amp; CV Editor</h2>
                </div>
                
                {/* Basic Info */}
                <section className="space-y-4">
                  <h3 className="text-sm">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`text-xs ${mutedText} block mb-2`}>Display Name</label>
                      <input
                        type="text"
                        defaultValue="Jimin Park"
                        className={`w-full px-3 py-2 border ${borderColor} bg-transparent outline-none text-sm`}
                      />
                    </div>
                    <div>
                      <label className={`text-xs ${mutedText} block mb-2`}>Email</label>
                      <input
                        type="email"
                        defaultValue="xistoh162108@kaist.ac.kr"
                        className={`w-full px-3 py-2 border ${borderColor} bg-transparent outline-none text-sm`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`text-xs ${mutedText} block mb-2`}>Bio</label>
                    <textarea
                      defaultValue="Undergraduate at KAIST School of Computing. Exploring the intersections of AI, Information Security, and full-stack development."
                      className={`w-full h-20 px-3 py-2 border ${borderColor} bg-transparent resize-none outline-none text-sm`}
                    />
                  </div>
                </section>

                {/* Experience Timeline Editor */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm">Experience</h3>
                    <button 
                      onClick={addExperience}
                      className={`text-xs ${hoverBg} px-2 py-1`}
                    >
                      [+] Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {experience.map((exp) => (
                      <div key={exp.id} className={`flex items-start gap-3 p-3 border ${borderColor}`}>
                        <span className={`${mutedText} cursor-grab`}>=</span>
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            defaultValue={exp.role}
                            className={`w-full px-2 py-1 border ${borderColor} bg-transparent outline-none text-sm`}
                            placeholder="Role / Position"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              defaultValue={exp.period}
                              className={`w-40 px-2 py-1 border ${borderColor} bg-transparent outline-none text-xs`}
                              placeholder="Period"
                            />
                            <input
                              type="text"
                              defaultValue={exp.description}
                              className={`flex-1 px-2 py-1 border ${borderColor} bg-transparent outline-none text-xs`}
                              placeholder="Description"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteExperience(exp.id)}
                          className={`text-xs ${hoverBg} px-2 py-1 ${isDarkMode ? "text-red-400" : "text-red-600"}`}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Education Editor */}
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm">Education</h3>
                    <button 
                      onClick={addEducation}
                      className={`text-xs ${hoverBg} px-2 py-1`}
                    >
                      [+] Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {education.map((edu) => (
                      <div key={edu.id} className={`flex items-start gap-3 p-3 border ${borderColor}`}>
                        <span className={`${mutedText} cursor-grab`}>=</span>
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            defaultValue={edu.institution}
                            className={`w-full px-2 py-1 border ${borderColor} bg-transparent outline-none text-sm`}
                            placeholder="Institution"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              defaultValue={edu.degree}
                              className={`flex-1 px-2 py-1 border ${borderColor} bg-transparent outline-none text-xs`}
                              placeholder="Degree"
                            />
                            <input
                              type="text"
                              defaultValue={edu.period}
                              className={`w-40 px-2 py-1 border ${borderColor} bg-transparent outline-none text-xs`}
                              placeholder="Period"
                            />
                          </div>
                        </div>
                        <button 
                          onClick={() => deleteEducation(edu.id)}
                          className={`text-xs ${hoverBg} px-2 py-1 ${isDarkMode ? "text-red-400" : "text-red-600"}`}
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <button className={`px-4 py-2 text-xs ${isDarkMode ? "bg-white text-black" : "bg-black text-white"}`}>
                  Save All Changes
                </button>
              </div>
            )}
            </main>
          )}
        </div>
      )}
    </div>
  )
}
