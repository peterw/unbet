const domain = process.env.CLERK_DOMAIN!

if (!domain) {
  throw new Error(
    'Missing Clerk Domain. Please set CLERK_DOMAIN in your .env',
  )
}

export default {
  providers: [
    {
      domain:domain,
      applicationID: "convex",
    },
  ]
}