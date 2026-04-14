import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Certificate of Insurance | Odyssey Hauling LLC',
  description: 'View Odyssey Hauling LLC Certificate of Insurance (COI).',
};

export default function CoiPage() {
  return (
    <main className="min-h-screen bg-[#f7f1e7] px-4 py-8 text-[#171717] sm:px-6 md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Certificate of Insurance</h1>
          <a
            href="/COI-2.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-xl bg-[#111111] px-4 py-2.5 text-sm font-medium text-white transition hover:-translate-y-0.5"
          >
            Open PDF in new tab
          </a>
        </div>

        <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
          <iframe
            src="/COI-2.pdf"
            title="Odyssey Hauling COI"
            className="h-[80vh] w-full"
          />
        </div>
      </div>
    </main>
  );
}
