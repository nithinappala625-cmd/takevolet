import { Metadata } from 'next';
import { ARTICLES } from '@/data/articles';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Tag, ArrowRight } from 'lucide-react';

const APP_URL = 'https://takevolet.online';

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find(a => a.slug === slug);

  if (!article) return {};

  return {
    title: `${article.title} | Takevolet`,
    description: article.excerpt,
    keywords: [
      ...article.tags,
      'hyderabad bachelor rooms',
      'takevolet',
      'zero brokerage hyderabad',
      'bachelor room guide',
    ],
    alternates: {
      canonical: `/articles/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      tags: article.tags,
      siteName: 'Takevolet',
      locale: 'en_IN',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = ARTICLES.find(a => a.slug === slug);

  if (!article) {
    notFound();
  }

  // Related articles — pick up to 3 different articles sharing at least 1 tag
  const related = ARTICLES.filter(
    a => a.slug !== article.slug && a.tags.some(t => article.tags.includes(t))
  ).slice(0, 3);

  // If not enough related by tag, fill with latest articles
  const relatedSlugs = related.map(r => r.slug);
  const fallback = ARTICLES.filter(a => a.slug !== article.slug && !relatedSlugs.includes(a.slug)).slice(0, 3 - related.length);
  const relatedArticles = [...related, ...fallback];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt,
    "image": `${APP_URL}/logo.png`,
    "author": {
      "@type": "Organization",
      "name": article.author,
      "url": APP_URL
    },
    "publisher": {
      "@type": "Organization",
      "name": "Takevolet",
      "logo": {
        "@type": "ImageObject",
        "url": `${APP_URL}/logo.png`
      }
    },
    "datePublished": article.date,
    "dateModified": article.date,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${APP_URL}/articles/${article.slug}`
    },
    "keywords": article.tags.join(', ')
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": APP_URL },
      { "@type": "ListItem", "position": 2, "name": "Articles", "item": `${APP_URL}/articles` },
      { "@type": "ListItem", "position": 3, "name": article.title, "item": `${APP_URL}/articles/${article.slug}` }
    ]
  };

  const readingTime = article.readingTime || Math.ceil(article.content.split(' ').length / 200);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="pt-36 pb-20 min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 md:px-12">
          <div className="max-w-3xl mx-auto">

            {/* Breadcrumb */}
            <nav className="flex items-center flex-wrap gap-1.5 text-xs text-muted-foreground mb-8" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              <span>/</span>
              <Link href="/articles" className="hover:text-primary transition-colors">Articles</Link>
              <span>/</span>
              <span className="text-foreground line-clamp-1">{article.title}</span>
            </nav>

            {/* Back link */}
            <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
              <ArrowLeft size={15} /> Back to Articles
            </Link>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {article.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                  <Tag size={9} /> {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black mb-5 leading-tight">
              {article.title}
            </h1>

            {/* Author / Date / Reading time */}
            <div className="flex flex-wrap items-center gap-4 border-y border-border py-4 mb-10">
              <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-full text-primary-foreground font-bold text-sm shrink-0">
                T
              </div>
              <div>
                <p className="font-bold text-sm">{article.author}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Clock size={13} /> {readingTime} min read
              </div>
            </div>

            {/* Content */}
            <div
              className="prose max-w-none text-sm sm:text-base leading-relaxed
                [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-foreground
                [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-foreground
                [&_p]:text-muted-foreground [&_p]:leading-loose [&_p]:mb-4
                [&_ul]:text-muted-foreground [&_ul]:space-y-2 [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc
                [&_ol]:text-muted-foreground [&_ol]:space-y-2 [&_ol]:mb-4 [&_ol]:pl-5 [&_ol]:list-decimal
                [&_li]:leading-relaxed
                [&_strong]:text-foreground [&_strong]:font-bold
                [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:opacity-80"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Main CTA */}
            <div className="mt-16 pt-8 border-t border-border">
              <div className="bg-secondary/20 border border-border p-6 sm:p-8">
                <h3 className="text-xl font-bold mb-2">Ready to find your room in Hyderabad?</h3>
                <p className="text-sm text-muted-foreground mb-5">Zero brokerage. Direct contact. Earn ₹1,000 when you hand over your room.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/rooms" className="bg-primary text-primary-foreground px-6 py-3 text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center justify-center gap-2">
                    Browse Rooms <ArrowRight size={14} />
                  </Link>
                  <Link href="/list" className="border border-border px-6 py-3 text-sm font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                    Post Your Room
                  </Link>
                  <Link href="/articles/faq" className="border border-border px-6 py-3 text-sm font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                    Read FAQ
                  </Link>
                </div>
              </div>
            </div>

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-14">
                <h3 className="text-lg font-bold mb-5 pb-2 border-b border-border">Related Articles</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {relatedArticles.map(rel => (
                    <Link
                      key={rel.slug}
                      href={`/articles/${rel.slug}`}
                      className="group border border-border p-4 hover:border-primary transition-all bg-secondary/10"
                    >
                      <div className="flex flex-wrap gap-1 mb-2">
                        {rel.tags.slice(0, 2).map(t => (
                          <span key={t} className="text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-1.5 py-0.5">{t}</span>
                        ))}
                      </div>
                      <h4 className="text-sm font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {rel.title}
                      </h4>
                      <p className="text-xs text-primary font-bold mt-2 flex items-center gap-1">
                        Read <ArrowRight size={10} />
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
