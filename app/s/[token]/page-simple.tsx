interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function SurveyPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <div className="p-8">
      <h1 className="text-3xl">Token: {token}</h1>
      <p>If you see this, the dynamic route is working!</p>
    </div>
  );
}
