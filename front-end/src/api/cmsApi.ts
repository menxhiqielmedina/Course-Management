import api from "@/lib/api";

export interface CmsPage {
  id: number;
  slug: string;
  title: string;
  content: string;
  status: "draft" | "published";
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CmsPagePayload {
  slug: string;
  title: string;
  content: string;
  status: "draft" | "published";
}

export const getCmsPages = (): Promise<CmsPage[]> =>
  api.get("/cms").then((r) => r.data);

export const getCmsPage = (id: number): Promise<CmsPage> =>
  api.get(/cms/${id}).then((r) => r.data);

export const createCmsPage = (payload: CmsPagePayload): Promise<CmsPage> =>
  api.post("/cms", payload).then((r) => r.data);

export const updateCmsPage = (id: number, payload: CmsPagePayload): Promise<CmsPage> =>
  api.put(/cms/${id}, payload).then((r) => r.data);

export const deleteCmsPage = (id: number): Promise<void> =>
  api.delete(/cms/${id}).then((r) => r.data);
