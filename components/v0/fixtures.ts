export type V0NoteStatus = "seedling" | "growing" | "evergreen"

export interface V0NoteItem {
  id: string
  title: string
  tags: string[]
  status: V0NoteStatus
  date: string
  isProject: boolean
  views: number
}

export interface V0ProjectListItem {
  id: string
  title: string
  description: string
  urls: Array<{
    domain: string
    path: string
  }>
}

export interface V0ManagePostItem {
  id: string
  title: string
  date: string
  status: "published" | "draft"
  isProject: boolean
}

export interface V0AnalyticsSourceRow {
  source: string
  percentage: number
}

export interface V0AnalyticsBreakdownRow {
  name: string
  percentage: number
}

export interface V0AnalyticsTopNote {
  rank: number
  title: string
  views: number
  dwellTime: string
}

export const samplePostContent = {
  id: "2",
  title: "Neural Network Fundamentals",
  date: "2026-03-15",
  readTime: "8 min read",
  views: 423,
  tags: ["#AI", "#MachineLearning"],
  content: `
## Understanding Neural Networks

Neural networks are the backbone of modern AI systems. In this deep dive, we'll explore the fundamental concepts that make them work.

The basic building block is the **perceptron**, a simple function that takes weighted inputs and produces an output through an activation function.

> "The key insight of deep learning is that many layers of simple computations can represent incredibly complex functions."
> - Yoshua Bengio

Here's a simple implementation of a forward pass:

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
`,
}

export const sampleProjectContent = {
  id: "1",
  title: "LifeXP",
  description:
    "A gamified life management app that turns daily tasks into XP and achievements. Built with a focus on habit formation psychology and game design principles.",
  techStack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Tailwind CSS"],
  urls: [
    {
      url: "https://github.com/jimin/lifexp",
      title: "LifeXP - GitHub",
      description: "Source code repository for the LifeXP gamified task manager",
      domain: "github.com",
      favicon: "GH",
    },
    {
      url: "https://lifexp.app",
      title: "LifeXP - Live Demo",
      description: "Try the live version of the gamified productivity app",
      domain: "lifexp.app",
      favicon: "LX",
    },
  ],
}

export const experienceData = [
  { id: "1", label: "GDGoC KAIST Lead", role: "GDGoC KAIST Lead", period: "2024 -> ....", description: "Leading developer community initiatives" },
  { id: "2", label: "Madcamp Bootcamp", role: "Madcamp Bootcamp", period: "2024", description: "Intensive development bootcamp participant" },
  { id: "3", label: "TEDxKAIST Organizer", role: "TEDxKAIST Organizer", period: "2023 -> 2024", description: "Event organization and speaker coordination" },
  { id: "4", label: "NYU Minor Program", role: "NYU Minor Program", period: "2023", description: "International exchange program" },
]

export const educationData = [
  {
    id: "1",
    institution: "KAIST (Korea Advanced Institute of Science & Technology)",
    degree: "B.S. in School of Computing",
    period: "2022 -> Present",
  },
]

export const digitalGardenNotes: V0NoteItem[] = [
  { id: "1", title: "Building Secure APIs", tags: ["#AI", "#InfoSec"], status: "seedling", date: "2026-03-20", isProject: false, views: 312 },
  { id: "2", title: "Neural Network Fundamentals", tags: ["#AI"], status: "evergreen", date: "2026-03-15", isProject: false, views: 423 },
  { id: "3", title: "My Dev Environment Setup", tags: ["#Project"], status: "seedling", date: "2026-03-10", isProject: true, views: 156 },
  { id: "4", title: "CTF Writeup: Web Exploitation", tags: ["#InfoSec"], status: "growing", date: "2026-03-05", isProject: false, views: 198 },
  { id: "5", title: "Transformer Architecture Deep Dive", tags: ["#AI"], status: "evergreen", date: "2026-02-28", isProject: false, views: 287 },
  { id: "6", title: "LifeXP - Gamified Task Manager", tags: ["#Project"], status: "growing", date: "2026-02-20", isProject: true, views: 89 },
]

export const projectsData: V0ProjectListItem[] = [
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
    urls: [{ domain: "github.com", path: "/jimin/securevault" }],
  },
]

export const postsData: V0ManagePostItem[] = [
  { id: "1", title: "Building Secure APIs", date: "2026-03-20", status: "published", isProject: false },
  { id: "2", title: "Neural Network Fundamentals", date: "2026-03-15", status: "published", isProject: false },
  { id: "3", title: "My Dev Environment Setup", date: "2026-03-10", status: "draft", isProject: true },
  { id: "4", title: "CTF Writeup: Web Exploitation", date: "2026-03-05", status: "published", isProject: false },
]

export const analyticsData: {
  totalVisitors: number
  avgSessionDuration: string
  p95Latency: string
  topNotes: V0AnalyticsTopNote[]
  trafficSources: V0AnalyticsSourceRow[]
  browsers: V0AnalyticsBreakdownRow[]
  devices: V0AnalyticsBreakdownRow[]
} = {
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

export const tagFilters = ["All", "#AI", "#InfoSec", "#Project"] as const

export function getStatusSymbol(status: V0NoteStatus) {
  switch (status) {
    case "seedling":
      return "[*]"
    case "growing":
      return "[+]"
    case "evergreen":
      return "[>]"
    default:
      return "[-]"
  }
}

export function renderProgressBar(percentage: number, width = 20) {
  const filled = Math.round((percentage / 100) * width)
  const empty = width - filled
  return "[" + "=".repeat(filled) + "-".repeat(empty) + "]"
}
