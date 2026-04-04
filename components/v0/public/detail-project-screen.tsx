"use client";

import Link from "next/link";
import { useState } from "react";
import type { PostDetailDTO } from "@/lib/contracts/posts";
import type { ReactNode } from "react";

import { sampleProjectContent } from "@/components/v0/fixtures";
import {
  V0DetailContent,
  hasRenderableDetailContent,
} from "@/components/v0/public/detail-content";
import {
  formatDetailMeta,
  formatDetailMetaLine,
} from "@/components/v0/public/mappers";
import { PublicShell } from "@/components/v0/public/public-shell";
import type { V0RuntimeDescriptor } from "@/components/v0/runtime/v0-experience-runtime";
import { useV0ThemeController } from "@/components/v0/use-v0-theme-controller";
import {
  collectBlockDocumentResources,
  normalizeContentResourceUrl,
} from "@/lib/content/post-content";

interface DetailProjectScreenProps {
  isDarkMode?: boolean;
  brandLabel?: string;
  post?: PostDetailDTO;
  backHref?: string;
  footerActions?: ReactNode;
  extraSections?: ReactNode;
}

export function DetailProjectScreen({
  isDarkMode: initialIsDarkMode = true,
  brandLabel = "xistoh.log",
  post,
  backHref = "/projects",
  footerActions,
  extraSections,
}: DetailProjectScreenProps) {
  const { isDarkMode, toggleTheme } = useV0ThemeController(initialIsDarkMode);
  const [actionState, setActionState] = useState<"idle" | "copied" | "shared">(
    "idle",
  );
  const mutedText = isDarkMode ? "text-white/50" : "text-black/50";
  const borderColor = isDarkMode ? "border-white/20" : "border-black/20";
  const hoverBg = isDarkMode ? "hover:bg-white/5" : "hover:bg-black/5";
  const detailMeta = post ? formatDetailMeta(post) : null;
  const detailMetaLine = post ? formatDetailMetaLine(post) : null;
  const shouldRenderContent = post
    ? hasRenderableDetailContent({
        content: post.content,
        fallbackHtml: post.htmlContent,
      })
    : false;
  const runtimeDescriptor: V0RuntimeDescriptor = {
    mode: "dither",
    variant: "detail-project",
  };
  const renderedResources = post
    ? collectBlockDocumentResources(post.content)
    : { linkUrls: [], assetIds: [], assetUrls: [] };
  const visibleLinks = post
    ? post.links.filter(
        (link) =>
          !renderedResources.linkUrls.includes(
            normalizeContentResourceUrl(link.normalizedUrl ?? link.url),
          ),
      )
    : [];
  const summary = post ? post.excerpt?.trim() ?? "" : sampleProjectContent.description

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
          title: post?.title ?? sampleProjectContent.title,
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
              [&larr;] back to projects
            </Link>

            <section className="space-y-6">
              <div className="space-y-3">
                {detailMeta ? (
                  <div className="flex items-center gap-4">
                    <p className={`text-xs ${mutedText}`}>
                      {detailMetaLine}
                    </p>
                    <span
                      className={`text-xs ${isDarkMode ? "text-[#D4FF00]" : "text-[#3F5200]"}`}
                    >
                      [v: {(post?.views ?? 0).toLocaleString()}]
                    </span>
                  </div>
                ) : (
                  <p className={`text-xs ${mutedText}`}>// project</p>
                )}
                <h1 className="text-xl">
                  {post?.title ?? sampleProjectContent.title}
                </h1>
                {summary ? (
                  <p className={`text-sm ${mutedText} leading-relaxed`}>
                    {summary}
                  </p>
                ) : null}
              </div>

              {post?.tags.length ? (
                <div className="space-y-2">
                  <p className={`text-xs ${mutedText}`}>// tech stack</p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-xs px-2 py-1 border ${borderColor}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
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
              )}

              {post && shouldRenderContent ? (
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
              ) : null}

              {(
                post?.links.length
                  ? visibleLinks.length > 0
                  : sampleProjectContent.urls.length > 0
              ) ? (
                <div className="space-y-3">
                  <p className={`text-xs ${mutedText}`}>// links</p>
                  <div className="space-y-3">
                    {(post?.links.length
                      ? visibleLinks.map((link) => ({
                          url: link.url,
                          title: link.title ?? link.label,
                          description: link.description ?? link.url,
                          domain:
                            link.siteName ?? link.normalizedUrl ?? link.url,
                          favicon: link.type.slice(0, 2),
                        }))
                      : sampleProjectContent.urls
                    ).map((urlData, index) => (
                      <a
                        key={index}
                        href={urlData.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block border-y py-3 transition-colors ${borderColor} ${hoverBg}`}
                      >
                        <div className="min-w-0 space-y-1">
                          <div
                            className={`flex flex-wrap items-center gap-3 text-xs ${mutedText}`}
                          >
                            <span>// link</span>
                            <span>[explicit]</span>
                          </div>
                          <p className="break-words text-sm">{urlData.title}</p>
                          <p className={`break-words text-xs ${mutedText}`}>
                            {urlData.description}
                          </p>
                          <p className={`text-xs ${mutedText}`}>
                            {urlData.domain} -&gt;
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className={`pt-8 border-t ${borderColor} space-y-4`}>
                <p className={`text-xs ${mutedText}`}>// end of project</p>
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
