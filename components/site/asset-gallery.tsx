import type { PostAssetDTO } from "@/lib/contracts/posts"

export function AssetGallery({
  assets,
  coverImageUrl,
}: {
  assets: PostAssetDTO[]
  coverImageUrl: string | null
}) {
  const images = assets.filter((asset) => asset.kind === "IMAGE" && asset.url && asset.url !== coverImageUrl)

  if (images.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-[0.22em] text-[#D4FF00]">Gallery</p>
        <h2 className="text-2xl font-semibold text-white">Images</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {images.map((asset) => (
          <div key={asset.id} className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-950/60">
            <img src={asset.url} alt={asset.originalName} className="h-72 w-full object-cover" />
            <div className="px-4 py-3 text-sm text-zinc-400">{asset.originalName}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
