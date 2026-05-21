import Link from 'next/link';
import { ARTICLES } from '@/data/articles';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Articles & Guides | Takevolet',
  description: 'Read the latest guides and tips for finding bachelor rooms, flatmates, and navigating zero brokerage rentals in Hyderabad.',
};

export default function ArticlesPage() {
  return (
    <div className="pt-36 pb-20 min-h-screen container mx-auto px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight mb-4">
          Bachelor <span className="text-primary">Guides</span>
        </h1>
        <p className="text-muted-foreground text-lg mb-12 max-w-2xl">
          Everything you need to know about finding broker-free rooms, great flatmates, and setting up your life in Hyderabad.
        </p>

        <div className="grid gap-8">
          {ARTICLES.map((article) => (
            <Link 
              href={`/articles/${article.slug}`} 
              key={article.slug}
              className="group block border border-border p-6 hover:border-primary transition-colors bg-secondary/10"
            >
              <div className="flex flex-wrap gap-2 mb-4">
                {article.tags.map(tag => (
                  <span key={tag} className="bg-primary/10 text-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                {article.title}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {article.excerpt}
              </p>
              <div className="flex items-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <span>Read Article</span>
                <span className="mx-2">•</span>
                <span>{new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
