import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { getPublicCmsPage, type CmsPage } from "@/api/cmsApi";
import { Button } from "@/components/ui/button";

const CmsPageView = () => {
  const params = useParams();
  const slug = "/" + (params["*"] ?? "");
  const navigate = useNavigate();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getPublicCmsPage(slug)
      .then(setPage)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-semibold text-foreground">Page not found</h1>
        <p className="text-muted-foreground">This page does not exist or has not been published yet.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8 text-foreground">{page.title}</h1>
      <div
        className="prose prose-neutral max-w-none text-foreground"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
};

export default CmsPageView;
