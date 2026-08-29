import { requireAdmin } from "@/lib/auth/session";
import { allGalleryImages } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { GalleryManager } from "@/components/admin/GalleryManager";

export default async function GalleryAdminPage() {
  await requireAdmin();
  const images = await allGalleryImages();
  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Photographs on the public gallery page. Category drives the filter chips; 'Large' gives a photograph a double-width tile in the mosaic."
      />
      <GalleryManager initial={images} />
    </div>
  );
}
