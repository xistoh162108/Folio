"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    // Explicit server await login using NextAuth bridging
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    })

    if (result?.error) {
      setError("Invalid credentials or server unavailable.")
    } else {
      router.push("/admin/posts")
      router.refresh()
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-black text-[#D4FF00] font-mono">
      <div className="w-full max-w-sm p-8 border border-[#D4FF00]/30 space-y-8 relative">
        <div className="space-y-2">
          <p className="text-xs text-[#D4FF00]/50">// gateway</p>
          <h1 className="text-xl tracking-tight">System Access</h1>
        </div>

        {error && (
          <div className="text-[#FF3333] text-xs">
            [!] SYS_ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <input 
              type="email" 
              placeholder="Identify_" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border-b border-[#D4FF00]/30 outline-none pb-2 text-sm focus:border-[#D4FF00] transition-colors placeholder:text-[#D4FF00]/30" 
              required
            />
            <input 
              type="password" 
              placeholder="Passphrase_" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border-b border-[#D4FF00]/30 outline-none pb-2 text-sm focus:border-[#D4FF00] transition-colors placeholder:text-[#D4FF00]/30" 
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full border border-[#D4FF00]/50 py-2.5 text-xs hover:bg-[#D4FF00]/10 transition-colors uppercase tracking-widest mt-4"
          >
            [ Initiate Override_ ]
          </button>
        </form>
      </div>
    </div>
  )
}
