import { CategoryExperience } from '../../../components/CategoryExperience';

export default function CategoryPage({ params, searchParams }: { params: { slug: string }; searchParams: { q?: string; location?: string; intent?: string; priceRange?: string } }) {
  return <CategoryExperience slug={params.slug} initialQuery={searchParams.q ?? ''} initialLocation={searchParams.location ?? ''} initialIntent={searchParams.intent ?? ''} initialPriceRange={searchParams.priceRange ?? ''} />;
}
