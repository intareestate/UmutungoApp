import { CategoryExperience } from '../../../components/CategoryExperience';

export default function CategoryPage({ params }: { params: { slug: string } }) {
  return <CategoryExperience slug={params.slug} />;
}
