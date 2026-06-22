import type { VisualisationSearchParams } from "@/lib/getClimateData";
import ClimateStream from "@/components/results/ClimateStream";

type VisualisationPageProps = {
  searchParams: Promise<VisualisationSearchParams>;
};

export default async function VisualisationPage({ searchParams }: VisualisationPageProps) {
  const params = await searchParams;

  return <ClimateStream params={params} />;
}
