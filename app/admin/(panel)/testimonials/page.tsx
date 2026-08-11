import { requireAdmin } from "@/lib/auth/session";
import { allTestimonials } from "@/lib/data/admin";
import { PageHeader } from "@/components/admin/parts";
import { TestimonialsManager } from "@/components/admin/TestimonialsManager";

export default async function TestimonialsPage() {
  await requireAdmin();
  const testimonials = await allTestimonials();
  return (
    <div>
      <PageHeader
        title="Testimonials"
        description="Short paraphrased quotes from appreciation letters. Featured ones appear on the homepage and corporate page."
      />
      <TestimonialsManager initial={testimonials} />
    </div>
  );
}
