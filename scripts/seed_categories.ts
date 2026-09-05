import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('DELETE FROM public.build_categories');
  const categories = [
    { m: 'service', s: 'Architect', i: 'architecture' },
    { m: 'service', s: 'Civil Engineer', i: 'engineering' },
    { m: 'service', s: 'Contractor', i: 'handyman' },
    { m: 'service', s: 'Builder', i: 'foundation' },
    { m: 'service', s: 'Site Engineer', i: 'architecture' },
    { m: 'service', s: 'Mason', i: 'handyman' },
    { m: 'service', s: 'Electrician', i: 'electrical_services' },
    { m: 'service', s: 'Plumber', i: 'plumbing' },
    { m: 'service', s: 'Carpenter', i: 'carpenter' },
    { m: 'service', s: 'Painter', i: 'format_paint' },
    { m: 'service', s: 'Interior Designer', i: 'chair' },
    { m: 'service', s: 'Vasthu Checker', i: 'explore' },
    { m: 'service', s: 'Surveyor', i: 'square_foot' },
    { m: 'service', s: 'Borewell Operator', i: 'water_drop' },
    { m: 'service', s: 'Site Supervisor', i: 'engineering' },
    
    { m: 'material', s: 'Cement Supplier', i: 'category' },
    { m: 'material', s: 'Steel Supplier', i: 'category' },
    { m: 'material', s: 'Bricks Supplier', i: 'category' },
    { m: 'material', s: 'Sand & Aggregates', i: 'category' },
    { m: 'material', s: 'Electrical Supplier', i: 'category' },
    { m: 'material', s: 'Plumbing Material', i: 'category' },
    { m: 'material', s: 'Tiles & Flooring', i: 'category' },
    { m: 'material', s: 'Paint Supplier', i: 'category' },
    { m: 'material', s: 'Wood & Glass Supplier', i: 'category' },
    
    { m: 'transport', s: 'JCB', i: 'local_shipping' },
    { m: 'transport', s: 'Bulldozer', i: 'local_shipping' },
    { m: 'transport', s: 'Crane', i: 'local_shipping' },
    { m: 'transport', s: 'Borewell Rig', i: 'local_shipping' },
    { m: 'transport', s: 'Lorry', i: 'local_shipping' },
    { m: 'transport', s: 'Tractor', i: 'agriculture' },
    { m: 'transport', s: 'Tipper', i: 'local_shipping' },
    { m: 'transport', s: 'Concrete Mixer', i: 'local_shipping' },
    { m: 'transport', s: 'Scaffolding', i: 'category' },
    { m: 'transport', s: 'Lifting Equipment', i: 'category' },
    
    { m: 'project', s: 'Residential', i: 'house' },
    { m: 'project', s: 'Commercial', i: 'storefront' },
    { m: 'project', s: 'Apartment', i: 'apartment' },
    { m: 'project', s: 'Villa', i: 'villa' }
  ];

  for (const c of categories) {
    await prisma.$executeRawUnsafe(
      'INSERT INTO public.build_categories (main_category, sub_category, icon_name) VALUES ($1, $2, $3)',
      c.m, c.s, c.i
    );
  }
  console.log('Done seeding!');
}
main();
