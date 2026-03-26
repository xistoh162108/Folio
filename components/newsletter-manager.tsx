"use client"

import { useState } from "react"

interface Subscriber {
  id: string
  email: string
  topics: string[]
  subscribedAt: string
}

interface NewsletterManagerProps {
  isDarkMode?: boolean
}

const dummySubscribers: Subscriber[] = [
  { id: "1", email: "alice@example.com", topics: ["All Seeds"], subscribedAt: "2024-01-15" },
  { id: "2", email: "bob.dev@techmail.io", topics: ["AI & InfoSec"], subscribedAt: "2024-02-03" },
  { id: "3", email: "carol@startup.co", topics: ["Projects & Logs", "AI & InfoSec"], subscribedAt: "2024-02-10" },
  { id: "4", email: "david.k@university.edu", topics: ["All Seeds"], subscribedAt: "2024-02-18" },
  { id: "5", email: "emma.watson@corp.net", topics: ["AI & InfoSec"], subscribedAt: "2024-03-01" },
  { id: "6", email: "frank@devstudio.app", topics: ["Projects & Logs"], subscribedAt: "2024-03-05" },
  { id: "7", email: "grace.lee@kaist.ac.kr", topics: ["All Seeds"], subscribedAt: "2024-03-12" },
]

type EditorMode = "richtext" | "html"
type ViewMode = "compose" | "subscribers" | "preview"
type PreviewDevice = "desktop" | "mobile"

export function NewsletterManager({ isDarkMode = true }: NewsletterManagerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("compose")
  const [editorMode, setEditorMode] = useState<EditorMode>("richtext")
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop")
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["All Seeds"])
  const [subject, setSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [htmlBody, setHtmlBody] = useState(`<div style="font-family: monospace; padding: 20px;">
  <h1>Newsletter Title</h1>
  <p>Your content here...</p>
</div>`)
  const [isSending, setIsSending] = useState(false)
  const [sendProgress, setSendProgress] = useState(0)
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [testSent, setTestSent] = useState(false)

  // Calculate target audience
  const targetSubscribers = selectedTopics.includes("All Seeds")
    ? dummySubscribers
    : dummySubscribers.filter((s) => 
        s.topics.includes("All Seeds") || 
        s.topics.some((t) => selectedTopics.includes(t))
      )

  const borderColor = isDarkMode ? "border-white/20" : "border-black/20"
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50"
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5"
  const activeBg = isDarkMode ? "bg-white/10" : "bg-black/10"
  const accentColor = isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"
  const accentBorder = isDarkMode ? "border-[#D4FF00]" : "border-[#3F5200]"

  const toggleTopic = (topic: string) => {
    if (topic === "All Seeds") {
      setSelectedTopics(["All Seeds"])
    } else {
      setSelectedTopics((prev) => {
        const filtered = prev.filter((t) => t !== "All Seeds")
        if (filtered.includes(topic)) {
          const result = filtered.filter((t) => t !== topic)
          return result.length === 0 ? ["All Seeds"] : result
        }
        return [...filtered, topic]
      })
    }
  }

  const sendTestEmail = () => {
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  const sendCampaign = () => {
    setIsSending(true)
    setSendStatus("sending")
    setSendProgress(0)

    const interval = setInterval(() => {
      setSendProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setSendStatus("success")
          setIsSending(false)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 200)
  }

  // Generate progress bar
  const generateProgressBar = (progress: number) => {
    const filled = Math.floor(progress / 10)
    const empty = 10 - filled
    return `[${"█".repeat(filled)}${"░".repeat(empty)}]`
  }

  // Syntax highlight HTML
  const highlightHtml = (html: string) => {
    return html
      .replace(/(&lt;|<)(\/?)([a-zA-Z0-9]+)/g, 
        `<span class="${isDarkMode ? "text-[#bb9af7]" : "text-purple-700"}">$1$2$3</span>`)
      .replace(/([a-zA-Z-]+)=/g, 
        `<span class="${isDarkMode ? "text-[#7aa2f7]" : "text-blue-700"}">$1</span>=`)
      .replace(/"([^"]*)"/g, 
        `<span class="${isDarkMode ? "text-[#9ece6a]" : "text-green-700"}">"$1"</span>`)
  }

  return (
    <div className="space-y-6 font-mono h-full overflow-y-auto">
      {/* Header */}
      <div>
        <p className={`text-xs ${mutedText}`}>// newsletter campaign</p>
        <h2 className="text-lg mt-1">Email Campaign Manager</h2>
      </div>

      {/* View Mode Tabs */}
      <div className={`flex border-b ${borderColor}`}>
        {(["compose", "subscribers", "preview"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={`px-4 py-2 text-xs transition-colors ${
              viewMode === mode
                ? `${activeBg} border-b-2 ${isDarkMode ? "border-white" : "border-black"}`
                : hoverBg
            }`}
          >
            {mode === "compose" && "[+] Compose"}
            {mode === "subscribers" && "Subscribers"}
            {mode === "preview" && "Preview"}
          </button>
        ))}
      </div>

      {/* COMPOSE VIEW */}
      {viewMode === "compose" && (
        <div className="space-y-6">
          {/* Recipients Selector */}
          <section className="space-y-3">
            <p className={`text-xs ${mutedText}`}>// recipients</p>
            <div className="flex flex-wrap gap-2">
              {["All Seeds", "AI & InfoSec", "Projects & Logs"].map((topic) => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-1.5 text-xs border transition-colors ${
                    selectedTopics.includes(topic) || (topic === "All Seeds" && selectedTopics.includes("All Seeds"))
                      ? `${accentBorder} ${accentColor}`
                      : `${borderColor} ${mutedText}`
                  }`}
                >
                  [{topic}]
                </button>
              ))}
            </div>
            <p className={`text-xs ${accentColor}`}>
              Target: {targetSubscribers.length} users
            </p>
          </section>

          {/* Subject Line */}
          <section className="space-y-2">
            <p className={`text-xs ${mutedText}`}>// subject</p>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject: Your newsletter title..."
              className={`w-full px-4 py-3 border ${borderColor} bg-transparent outline-none text-sm font-mono transition-colors focus:${accentBorder}`}
            />
          </section>

          {/* Editor Mode Toggle */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className={`text-xs ${mutedText}`}>// body</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setEditorMode("richtext")}
                  className={`px-3 py-1 text-xs border transition-colors ${
                    editorMode === "richtext" ? `${accentBorder} ${accentColor}` : `${borderColor} ${mutedText}`
                  }`}
                >
                  Rich Text
                </button>
                <button
                  onClick={() => setEditorMode("html")}
                  className={`px-3 py-1 text-xs border transition-colors ${
                    editorMode === "html" ? `${accentBorder} ${accentColor}` : `${borderColor} ${mutedText}`
                  }`}
                >
                  Raw HTML
                </button>
              </div>
            </div>

            {/* Rich Text Editor */}
            {editorMode === "richtext" && (
              <div className="space-y-2">
                {/* Toolbar */}
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
                <textarea
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="Start composing your email content..."
                  className={`w-full h-48 p-4 border ${borderColor} bg-transparent resize-none outline-none text-sm`}
                />
              </div>
            )}

            {/* HTML Editor with Syntax Highlighting */}
            {editorMode === "html" && (
              <div className="relative">
                <div className={`flex items-center justify-between px-4 py-2 border-t border-x ${borderColor} ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-100"}`}>
                  <span className={`text-xs ${mutedText}`}>// html</span>
                  <span className={`text-xs ${mutedText}`}>{htmlBody.length} chars</span>
                </div>
                <textarea
                  value={htmlBody}
                  onChange={(e) => setHtmlBody(e.target.value)}
                  spellCheck={false}
                  className={`w-full h-48 p-4 border ${borderColor} resize-none outline-none text-xs font-mono ${
                    isDarkMode ? "bg-[#1a1a1a] text-[#c0caf5]" : "bg-gray-50 text-gray-800"
                  }`}
                  style={{ tabSize: 2 }}
                />
              </div>
            )}
          </section>

          {/* Actions */}
          <section className="space-y-4">
            {/* Test & Send */}
            <div className="flex items-center gap-3">
              <button
                onClick={sendTestEmail}
                disabled={testSent}
                className={`px-4 py-2 text-xs border ${borderColor} ${hoverBg} transition-colors ${
                  testSent ? accentColor : ""
                }`}
              >
                {testSent ? "[*] Test Sent" : "[ Send Test to Self ]"}
              </button>
              <button
                onClick={sendCampaign}
                disabled={isSending || !subject}
                className={`px-4 py-2 text-xs transition-colors ${
                  isSending || !subject
                    ? `border ${borderColor} ${mutedText} cursor-not-allowed`
                    : `${isDarkMode ? "bg-[#D4FF00] text-black" : "bg-[#3F5200] text-white"}`
                }`}
              >
                {isSending ? "Sending..." : `Launch Campaign (${targetSubscribers.length})`}
              </button>
            </div>

            {/* Progress Bar */}
            {sendStatus === "sending" && (
              <div className={`p-4 border ${borderColor} ${isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-50"}`}>
                <p className={`text-xs ${accentColor}`}>
                  Sending: {generateProgressBar(sendProgress)} {Math.floor(sendProgress)}%
                </p>
              </div>
            )}

            {/* Success Message */}
            {sendStatus === "success" && (
              <div className={`p-4 border ${accentBorder} ${isDarkMode ? "bg-[#D4FF00]/10" : "bg-[#3F5200]/10"}`}>
                <p className={`text-xs ${accentColor}`}>
                  [SUCCESS] // {targetSubscribers.length} emails dispatched via Resend
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {/* SUBSCRIBERS VIEW */}
      {viewMode === "subscribers" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className={`border ${borderColor} p-4`}>
              <p className={`text-xs ${mutedText}`}>Total</p>
              <p className="text-xl mt-1">{dummySubscribers.length}</p>
            </div>
            <div className={`border ${borderColor} p-4`}>
              <p className={`text-xs ${mutedText}`}>AI &amp; InfoSec</p>
              <p className="text-xl mt-1">
                {dummySubscribers.filter((s) => s.topics.includes("AI & InfoSec") || s.topics.includes("All Seeds")).length}
              </p>
            </div>
            <div className={`border ${borderColor} p-4`}>
              <p className={`text-xs ${mutedText}`}>Projects &amp; Logs</p>
              <p className="text-xl mt-1">
                {dummySubscribers.filter((s) => s.topics.includes("Projects & Logs") || s.topics.includes("All Seeds")).length}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className={`border ${borderColor}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${borderColor}`}>
                  <th className={`p-3 text-left text-xs ${mutedText}`}>Email</th>
                  <th className={`p-3 text-left text-xs ${mutedText}`}>Topics</th>
                  <th className={`p-3 text-left text-xs ${mutedText}`}>Date</th>
                </tr>
              </thead>
              <tbody>
                {dummySubscribers.map((subscriber) => (
                  <tr
                    key={subscriber.id}
                    className={`border-b ${borderColor} ${hoverBg} transition-colors`}
                  >
                    <td className="p-3 text-xs">{subscriber.email}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {subscriber.topics.map((topic) => (
                          <span key={topic} className={`text-xs ${mutedText}`}>
                            [{topic}]
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={`p-3 text-xs ${mutedText}`}>{subscriber.subscribedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PREVIEW VIEW */}
      {viewMode === "preview" && (
        <div className="space-y-4">
          {/* Device Toggle */}
          <div className="flex items-center justify-between">
            <p className={`text-xs ${mutedText}`}>// preview</p>
            <div className="flex gap-1">
              <button
                onClick={() => setPreviewDevice("desktop")}
                className={`px-3 py-1 text-xs border transition-colors ${
                  previewDevice === "desktop" ? `${accentBorder} ${accentColor}` : `${borderColor} ${mutedText}`
                }`}
              >
                Desktop
              </button>
              <button
                onClick={() => setPreviewDevice("mobile")}
                className={`px-3 py-1 text-xs border transition-colors ${
                  previewDevice === "mobile" ? `${accentBorder} ${accentColor}` : `${borderColor} ${mutedText}`
                }`}
              >
                Mobile
              </button>
            </div>
          </div>

          {/* Preview Frame */}
          <div className={`border ${borderColor} ${isDarkMode ? "bg-[#1a1a1a]" : "bg-white"} overflow-hidden`}>
            {/* Email Header Bar */}
            <div className={`flex items-center gap-2 px-4 py-2 border-b ${borderColor} ${isDarkMode ? "bg-[#0d0d0d]" : "bg-gray-100"}`}>
              <span className={`text-xs ${mutedText}`}>From:</span>
              <span className="text-xs">jimin@kaist.ac.kr</span>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 border-b ${borderColor} ${isDarkMode ? "bg-[#0d0d0d]" : "bg-gray-100"}`}>
              <span className={`text-xs ${mutedText}`}>Subject:</span>
              <span className="text-xs">{subject || "(No subject)"}</span>
            </div>
            
            {/* Email Body Preview */}
            <div 
              className={`mx-auto p-6 ${
                previewDevice === "mobile" ? "max-w-[375px]" : "w-full"
              }`}
            >
              {editorMode === "html" ? (
                <div 
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: htmlBody }}
                />
              ) : (
                <div className="text-sm whitespace-pre-wrap">
                  {emailBody || "Your email content will appear here..."}
                </div>
              )}
            </div>
          </div>

          {/* Preview Info */}
          <p className={`text-xs ${mutedText}`}>
            // {previewDevice === "mobile" ? "375px width" : "full width"} preview
          </p>
        </div>
      )}
    </div>
  )
}
