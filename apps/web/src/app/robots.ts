import type { MetadataRoute } from "next";

/**
 * This deployment is still a private staging build. Keep crawlers out until
 * the launch-readiness evidence has been reviewed and public launch is approved.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/"
    }
  };
}
