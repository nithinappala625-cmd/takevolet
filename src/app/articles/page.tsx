import Link from 'next/link';
import { ARTICLES } from '@/data/articles';
import { Metadata } from 'next';
import { HelpCircle, BookOpen, ArrowRight, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Bachelor Room Guides & Articles | Takevolet Hyderabad',
  description:
    'Guides, tips, and articles for bachelors in Hyderabad — find zero brokerage rooms, discover flatmates, sell furniture, and navigate the Hyderabad rental market. Written by the Takevolet team.',
  keywords: [
    'bachelor room guides hyderabad',
    'hyderabad rental tips',
    'bachelor articles hyderabad',
    'zero brokerage room guide',
    'flatmate guide hyderabad',
    'hyderabad room rent tips',
    'takevolet articles',
    'bachelor life hyderabad',
  ],
  alternates: {
    canonical: '/articles',
  },
};

export default function ArticlesPage() {
  return (
    <div className="pt-36 pb-20 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 md:px-12">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="mb-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight mb-4 leading-tight">
              Bachelor <span className="text-primary">Guides</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-2 max-w-2xl leading-relaxed">
              Everything you need to know about finding broker-free rooms, great flatmates, and setting up your life in Hyderabad.
            </p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {ARTICLES.length} articles · Updated {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* FAQ Banner — prominent card */}
          <Link
            href="/articles/faq"
            className="group flex flex-col sm:flex-row items-start sm:items-center gap-5 border-2 border-primary bg-primary/5 p-5 sm:p-6 mb-10 hover:bg-primary/10 transition-colors"
          >
            <div className="w-12 h-12 bg-primary flex items-center justify-center shrink-0">
              <HelpCircle size={22} className="text-primary-foreground" />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">📌 Must Read First</div>
              <h2 className="font-black text-lg sm:text-xl mb-1 group-hover:text-primary transition-colors">
                Bachelor Room FAQs — 40+ Questions Answered
              </h2>
              <p className="text-sm text-muted-foreground leading-snug">
                Hyderabad bachelor room costs, best areas, handover process, flatmate tips, advance deposit rules — everything in one page with Google FAQ rich snippets.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-primary font-bold text-xs uppercase tracking-wider shrink-0">
              Read FAQ <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Articles Grid */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-6">
              <BookOpen size={12} />
              All Articles
            </div>
          </div>

          <div className="grid gap-6 sm:gap-8">
            {ARTICLES.map((article) => (
              <Link
                href={`/articles/${article.slug}`}
                key={article.slug}
                className="group block border border-border p-5 sm:p-6 hover:border-primary transition-all bg-secondary/10 hover:bg-secondary/20"
              >
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {article.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors leading-snug">
                  {article.title}
                </h2>

                {/* Excerpt */}
                <p className="text-muted-foreground leading-relaxed mb-4 text-sm line-clamp-2">
                  {article.excerpt}
                </p>

                {/* Footer */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="text-primary font-bold">Read Article →</span>
                  <span className="text-border">·</span>
                  <span>{new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  {article.readingTime && (
                    <>
                      <span className="text-border">·</span>
                      <span className="flex items-center gap-1"><Clock size={10} /> {article.readingTime} min read</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-14 border-t border-border pt-10 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Ready to find your bachelor room in Hyderabad?
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/rooms"
                className="bg-primary text-primary-foreground px-8 py-3 text-sm font-bold uppercase tracking-wider hover:opacity-90 transition-all"
              >
                Browse Rooms
              </Link>
              <Link
                href="/articles/faq"
                className="border border-border px-8 py-3 text-sm font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-all"
              >
                Read FAQ
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
