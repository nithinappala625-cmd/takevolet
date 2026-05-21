import { Metadata } from 'next';
import { ARTICLES } from '@/data/articles';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = ARTICLES.find(a => a.slug === slug);
  
  if (!article) return {};

  return {
    title: `${article.title} | Takevolet`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      publishedTime: article.date,
      authors: [article.author],
      tags: article.tags,
    }
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = ARTICLES.find(a => a.slug === slug);

  if (!article) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": article.title,
    "description": article.excerpt,
    "image": "https://takevolet.online/opengraph-image",
    "author": {
      "@type": "Organization",
      "name": article.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Takevolet",
      "logo": {
        "@type": "ImageObject",
        "url": "https://takevolet.online/logo.svg"
      }
    },
    "datePublished": article.date,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://takevolet.online/articles/${article.slug}`
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="pt-36 pb-20 min-h-screen container mx-auto px-6 md:px-12">
        <div className="max-w-3xl mx-auto">
          <Link href="/articles" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-10">
            <ArrowLeft size={16} /> Back to Articles
          </Link>

          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags.map(tag => (
              <span key={tag} className="bg-primary/10 text-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wider">
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 border-y border-border py-4 mb-10">
            <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-full text-primary-foreground font-bold">
              T
            </div>
            <div>
              <p className="font-bold text-sm">{article.author}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div 
            className="prose prose-invert prose-p:text-muted-foreground prose-p:leading-loose prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-4 prose-h2:mt-10 prose-h3:text-xl prose-h3:font-bold prose-h3:mb-3 prose-h3:mt-8 prose-li:text-muted-foreground max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
          
          <div className="mt-16 pt-8 border-t border-border">
            <h3 className="text-xl font-bold mb-4">Ready to find a room?</h3>
            <Link href="/rooms" className="inline-flex items-center justify-center bg-primary text-primary-foreground px-6 py-3 font-bold uppercase tracking-wider hover:opacity-90 transition-all">
              Browse Rooms Now
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
