"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";

import type { PostDetailDTO } from "@/lib/contracts/posts";

import { samplePostContent } from "@/components/v0/fixtures";
import { V0DetailContent } from "@/components/v0/public/detail-content";
import { formatDetailMeta } from "@/components/v0/public/mappers";
import { PublicShell } from "@/components/v0/public/public-shell";
import type { V0RuntimeDescriptor } from "@/components/v0/runtime/v0-experience-runtime";
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller";

interface DetailNoteScreenProps {
  isDarkMode?: boolean;
  brandLabel?: string;
  post?: PostDetailDTO;
  backHref?: string;
  footerActions?: ReactNode;
  extraSections?: ReactNode;
}

export function DetailNoteScreen({
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
  post,
  backHref = "/notes",
  footerActions,
  extraSections,
}: DetailNoteScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode);
  const [copiedCode, setCopiedCode] = useState<number | null>(null);
  const [actionState, setActionState] = useState<"idle" | "copied" | "shared">(
    "idle",
  );

  const mutedText = isDarkMode ? "text-white/50" : "text-black/50";
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20";
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5";
  const detailMeta = post ? formatDetailMeta(post) : null;
  const runtimeDescriptor: V0RuntimeDescriptor = {
    mode: "dither",
    variant: "detail-note",
  };

  const copyToClipboard = async (code: string, index: number) => {
    if (!navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(index);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {}
  };

  const handleCopyLink = async () => {
    if (!navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      setActionState("copied");
      setTimeout(() => setActionState("idle"), 2000);
    } catch {}
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: post?.title ?? samplePostContent.title,
          url: window.location.href,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        return;
      }

      setActionState("shared");
      setTimeout(() => setActionState("idle"), 2000);
    } catch {}
  };

  return (
    <PublicShell
      currentPage={null}
      isDarkMode={isDarkMode}
      brandLabel={brandLabel}
      onToggleTheme={toggleTheme}
      runtimeDescriptor={runtimeDescriptor}
    >
      <div className="min-h-full md:h-full">
        <main className="w-full max-w-3xl px-4 py-6 sm:px-6 md:px-8">
          <div className="w-full max-w-2xl space-y-6">
            <Link
              href={backHref}
              className={`inline-block text-xs ${mutedText} ${hoverBg} px-1`}
            >
              [&larr;] back to notes
            </Link>

            <section className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <p className={`text-xs ${mutedText}`}>
                    // {detailMeta?.date ?? samplePostContent.date} -{" "}
                    {detailMeta?.readTime ?? samplePostContent.readTime}
                  </p>
                  <span
                    className={`text-xs ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}
                  >
                    [v:{" "}
                    {(post?.views ?? samplePostContent.views).toLocaleString()}]
                  </span>
                </div>
                <h1 className="text-xl">
                  {post?.title ?? samplePostContent.title}
                </h1>
                <div className="flex gap-2 text-xs">
                  {(detailMeta?.tags ?? samplePostContent.tags).map((tag) => (
                    <span key={tag} className={mutedText}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {post ? (
                <V0DetailContent
                  content={post.content}
                  fallbackHtml={post.htmlContent}
                  isDarkMode={isDarkMode}
                  borderColor={borderColor}
                  hoverBg={hoverBg}
                  mutedText={mutedText}
                  links={post.links}
                  assets={post.assets}
                />
              ) : (
                <article className="prose-terminal space-y-4 text-sm leading-relaxed font-[var(--font-jetbrains-mono),monospace]">
                  {samplePostContent.content
                    .trim()
                    .split("\n\n")
                    .map((block, index) => {
                      if (block.startsWith("## ")) {
                        return (
                          <h2 key={index} className="text-base pt-4">
                            {block.replace("## ", "")}
                          </h2>
                        );
                      }

                      if (block.startsWith("> ")) {
                        return (
                          <blockquote
                            key={index}
                            className={`border-l-2 ${isDarkMode ? "border-[#D4FF00]/30" : "border-[#3F5200]/30"} pl-4 ${mutedText} italic`}
                          >
                            {block.split("\n").map((line, quoteIndex) => (
                              <p key={quoteIndex}>{line.replace("> ", "")}</p>
                            ))}
                          </blockquote>
                        );
                      }

                      if (block.startsWith("```")) {
                        const lines = block.split("\n");
                        const lang = lines[0].replace("```", "");
                        const code = lines.slice(1, -1).join("\n");
                        const accentClass = isDarkMode
                          ? "text-[#D4FF00]"
                          : "text-[#3F5200]";
                        const commentClass = isDarkMode
                          ? "text-white/35"
                          : "text-black/40";
                        const highlightedCode = code
                          .replace(
                            /\b(import|from|def|return|class|if|else|for|while|try|except|with|as|in|and|or|not|True|False|None)\b/g,
                            `<span class="${accentClass}">$1</span>`,
                          )
                          .replace(
                            /\b(np|numpy|math|os|sys)\b/g,
                            `<span class="${accentClass}">$1</span>`,
                          )
                          .replace(
                            /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g,
                            `<span class="${accentClass}">$1</span>`,
                          )
                          .replace(
                            /(["'])(.*?)\1/g,
                            `<span class="${accentClass}">$1$2$1</span>`,
                          )
                          .replace(
                            /#.*$/gm,
                            `<span class="${commentClass}">$&</span>`,
                          )
                          .replace(
                            /\b(\d+\.?\d*)\b/g,
                            `<span class="${accentClass}">$1</span>`,
                          );

                        return (
                          <div key={index} className="relative group">
                            <div
                              className={`flex items-center justify-between px-4 py-2 border-t border-x ${borderColor} ${
                                isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-100"
                              }`}
                            >
                              <span className={`text-xs ${mutedText}`}>
                                // {lang}
                              </span>
                              <button
                                onClick={() => copyToClipboard(code, index)}
                                className={`text-xs ${hoverBg} px-2 py-0.5 transition-colors ${
                                  copiedCode === index
                                    ? isDarkMode
                                      ? "text-[#D4FF00]"
                                      : "text-[#3F5200]"
                                    : mutedText
                                }`}
                              >
                                {copiedCode === index ? "[copied]" : "[y]"}
                              </button>
                            </div>
                            <pre
                              className={`p-4 border ${borderColor} overflow-x-auto text-xs ${
                                isDarkMode ? "bg-[#1a1a1a]" : "bg-gray-50"
                              }`}
                            >
                              <code
                                dangerouslySetInnerHTML={{
                                  __html: highlightedCode,
                                }}
                              />
                            </pre>
                          </div>
                        );
                      }

                      const formatted = block
                        .replace(
                          /\*\*(.*?)\*\*/g,
                          `<strong class="${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}">$1</strong>`,
                        )
                        .replace(
                          /`([^`]+)`/g,
                          `<code class="px-1.5 py-0.5 text-xs ${
                            isDarkMode
                              ? "bg-[#1a1a1a] text-[#7aa2f7]"
                              : "bg-gray-100 text-blue-700"
                          }">$1</code>`,
                        );

                      return (
                        <p
                          key={index}
                          className={mutedText}
                          dangerouslySetInnerHTML={{ __html: formatted }}
                        />
                      );
                    })}
                </article>
              )}

              <div className={`pt-8 border-t ${borderColor} space-y-4`}>
                <p className={`text-xs ${mutedText}`}>// end of note</p>
                <div className="flex flex-wrap gap-4 text-xs">
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    className={`${hoverBg} px-2 py-1`}
                  >
                    {actionState === "shared" ? "[shared]" : "[share]"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCopyLink()}
                    className={`${hoverBg} px-2 py-1`}
                  >
                    {actionState === "copied" ? "[copied]" : "[copy link]"}
                  </button>
                  {footerActions}
                </div>
              </div>

              {extraSections}
            </section>
          </div>
        </main>
      </div>
    </PublicShell>
  );
}
