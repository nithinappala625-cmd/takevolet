import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import ProjectDetailClient from './ProjectDetailClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gfhmdpzmhakznuqhstrn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_UMao6_0CcVARdQOvJfcwEA_pPhi9xXL';
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> | { id: string } }
): Promise<Metadata> {
  const resolved = await Promise.resolve(params);
  const id = resolved.id;

  try {
    const { data: project } = await supabaseAdmin
      .from('top_projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!project) {
      return {
        title: 'Premium Project | Takevolet',
        description: 'Explore verified premium builder projects with 0 brokerage on Takevolet.',
      };
    }

    const title = project.project_name || 'Top Premium Project';
    const dev = project.developer_name ? `by ${project.developer_name}` : 'Verified Developer';
    const location = [project.locality, project.city, project.state].filter(Boolean).join(', ');
    const description = `${title} ${dev} • ${location || 'Hyderabad'} | Explore floor plans, amenities, and direct builder contacts on Takevolet.`;

    const ogImage = project.cover_image || project.project_logo || 'https://pub-6e2dfd0939c946adb7029c6cdae04896.r2.dev/tvl_logo.png';
    const shareUrl = `https://takevolet.online/project/${id}`;

    return {
      title: `${title} - ${dev} | Takevolet`,
      description,
      openGraph: {
        title: `${title} • ${dev}`,
        description,
        url: shareUrl,
        siteName: 'Takevolet',
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${title} • ${dev}`,
        description,
        images: [ogImage],
      },
    };
  } catch (_) {
    return {
      title: 'Top Project | Takevolet',
      description: 'Explore verified builder projects on Takevolet.',
    };
  }
}

export default async function ProjectSharePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolved = await Promise.resolve(params);
  return <ProjectDetailClient projectId={resolved.id} />;
}