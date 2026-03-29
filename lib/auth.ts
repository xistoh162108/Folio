import { getServerSession, NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { cache } from "react"
import { prisma } from "./db/prisma"
import { env } from "./env"

export const authOptions: NextAuthOptions = {
  secret: env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Terminal Access",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isValid) return null

        return { id: user.id, email: user.email }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
      }
      return token
    },
    session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: token.email as string,
      }
      return session
    },
  },
  pages: { signIn: "/admin/login" },
}

const getCachedServerSession = cache(async () => getServerSession(authOptions))

export async function getSession() {
  return getCachedServerSession()
}

export async function requireUser() {
  const session = await getSession()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  return session.user
}
