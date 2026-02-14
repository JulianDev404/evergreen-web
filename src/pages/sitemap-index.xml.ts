// apps/web/src/pages/sitemap-index.xml.ts
import type { APIRoute } from "astro";

const SITE_URL = import.meta.env.SITE_URL || "https://evergreenplumbingri.com";
const API_URL = import.meta.env.PUBLIC_API_URL;

interface Service {
  slug: string;
  updatedAt: string;
}

interface Post {
  slug: string;
  updatedAt: string;
}

interface Job {
  slug: string;
  updatedAt: string;
}

const staticPages = [
  { url: "/", priority: "1.0", changefreq: "weekly" },
  { url: "/about-us", priority: "0.8", changefreq: "monthly" },
  { url: "/contact-us", priority: "0.9", changefreq: "monthly" },
  { url: "/customer-service", priority: "0.8", changefreq: "monthly" },
  { url: "/24-7-emergency-services", priority: "0.9", changefreq: "monthly" },
  { url: "/financing-options-plans", priority: "0.8", changefreq: "monthly" },
  { url: "/maintenance-plan", priority: "0.8", changefreq: "monthly" },
  { url: "/careers", priority: "0.7", changefreq: "weekly" },
  { url: "/our-guarantees", priority: "0.7", changefreq: "monthly" },
  { url: "/service-area", priority: "0.8", changefreq: "monthly" },
  { url: "/blog", priority: "0.8", changefreq: "daily" },
  { url: "/all-offers", priority: "0.8", changefreq: "weekly" },
  { url: "/privacy-policy", priority: "0.3", changefreq: "yearly" },
];

async function fetchServices(): Promise<Service[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/services?where[active][equals]=true&where[hasPage][equals]=true&limit=1000&depth=0`,
    );
    if (res.ok) {
      const data = await res.json();
      return data.docs || [];
    }
  } catch (error) {
    console.error("Error fetching services:", error);
  }
  return [];
}

async function fetchPosts(): Promise<Post[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/posts?where[_status][equals]=published&limit=1000&depth=0`,
    );
    if (res.ok) {
      const data = await res.json();
      return data.docs || [];
    }
  } catch (error) {
    console.error("Error fetching posts:", error);
  }
  return [];
}

async function fetchJobs(): Promise<Job[]> {
  try {
    const res = await fetch(
      `${API_URL}/api/jobs?where[active][equals]=true&limit=1000&depth=0`,
    );
    if (res.ok) {
      const data = await res.json();
      return data.docs || [];
    }
  } catch (error) {
    console.error("Error fetching jobs:", error);
  }
  return [];
}

export const GET: APIRoute = async () => {
  const now = new Date().toISOString();

  const [services, posts, jobs] = await Promise.all([
    fetchServices(),
    fetchPosts(),
    fetchJobs(),
  ]);

  const urls: string[] = [];

  // Static pages
  for (const page of staticPages) {
    urls.push(`  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`);
  }

  // Services
  for (const service of services.filter((s) => s.slug)) {
    urls.push(`  <url>
    <loc>${SITE_URL}/plumbing-services/${service.slug}</loc>
    <lastmod>${service.updatedAt || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`);
  }

  // Blog posts
  for (const post of posts.filter((p) => p.slug)) {
    urls.push(`  <url>
    <loc>${SITE_URL}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt || now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`);
  }

  // Jobs
  for (const job of jobs.filter((j) => j.slug)) {
    urls.push(`  <url>
    <loc>${SITE_URL}/job/${job.slug}</loc>
    <lastmod>${job.updatedAt || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`);
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
