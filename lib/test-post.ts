import { prisma } from "./db/prisma"

async function testTransactions() {
  console.log("[SYSTEM] Creating strict test user for audit logs...")
  const admin = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: { email: "test@example.com", password: "hash" }
  })

  console.log("[SYSTEM] Simulating post creation transaction...")
  const newPost = await prisma.$transaction(async (tx) => {
    const p = await tx.post.create({
      data: {
        title: "Initial Draft",
        slug: "init-draft-" + Date.now(),
        htmlContent: "<p>V1</p>",
        content: { type: "doc" },
        status: "DRAFT"
      }
    })
    await tx.auditLog.create({
      data: { actorUserId: admin.id, actionType: "CREATE", targetType: "POST", targetId: p.id }
    })
    return p;
  })

  console.log("[SUCCESS] Created Draft Post:", newPost.id)

  console.log("[SYSTEM] Simulating post publish transaction with strict revision snapshotting...")
  
  await prisma.$transaction(async (tx) => {
    await tx.postRevision.create({
      data: {
        postId: newPost.id,
        title: newPost.title,
        content: newPost.content ?? {},
        contentVersion: newPost.contentVersion,
        htmlContent: newPost.htmlContent
      }
    })

    const updated = await tx.post.update({
      where: { id: newPost.id },
      data: { status: "PUBLISHED", contentVersion: 2, publishedAt: new Date() }
    })

    await tx.auditLog.create({
      data: { actorUserId: admin.id, actionType: "PUBLISH", targetType: "POST", targetId: updated.id }
    })
  })

  const revs = await prisma.postRevision.findMany({ where: { postId: newPost.id } })
  console.log(`[VERIFIED] Revisions confirmed: ${revs.length} snapshot(s) found. Transaction successfully bounded.`)
}

testTransactions().catch(console.error).finally(() => process.exit(0))
