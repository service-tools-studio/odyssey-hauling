'use client';

export default function Page() {
  return (
    <OdysseyHaulingPage />
  );
}


import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Clock3,
  Phone,
  Star,
  Truck,
  Camera,
  FileText,
  MapPin,
  Shield,
  Trash2,
  Home,
  Sofa,
  Package,
  Hammer,
  Trees,
  Bath,
  Send,
} from 'lucide-react';

const BEFORE_AFTER_IMAGES = [
  '/IMG_5917.JPG',
  '/IMG_5918.JPG',
  '/IMG_5943.JPG',
  '/IMG_6356.JPG',
  '/IMG_6437.JPG',
  '/IMG_6438.JPG',
] as const;

function OdysseyHaulingPage() {
  const CLIENT_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
  const pricingOptions = [
    { label: 'Minimum fee', low: 100, high: 100, category: 'Load-based' },
    { label: 'Half truckload', low: 150, high: 150, category: 'Load-based' },
    { label: 'Full truckload', low: 250, high: 250, category: 'Load-based' },
    { label: 'Full trailer load', low: 495, high: 495, category: 'Load-based' },
    { label: 'Full truck and trailer load', low: 750, high: 750, category: 'Load-based' },
    { label: 'Couch', low: 200, high: 200, category: 'Single items' },
    { label: 'Mattresses', low: 65, high: 150, category: 'Single items' },
    { label: 'Box spring', low: 65, high: 150, category: 'Single items' },
    { label: 'Appliances', low: 75, high: 165, category: 'Single items' },
    { label: 'Hot tubs', low: 425, high: 795, category: 'Specialty jobs' },
    { label: 'Shed removal', low: 495, high: 495, category: 'Specialty jobs', helper: 'Basic price based on a 5\'x5\' unit', priceDisplay: '$495+' },
  ];
  const selectablePricingOptions = pricingOptions.filter((item) => item.label !== 'Minimum fee');
  const minimumFee = pricingOptions.find((item) => item.label === 'Minimum fee')?.low ?? 100;

  const [serviceToAdd, setServiceToAdd] = useState(selectablePricingOptions[0]?.label ?? '');
  const [serviceItems, setServiceItems] = useState<Array<{ label: string; quantity: number }>>([]);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSubmitMessage, setContactSubmitMessage] = useState<string | null>(null);
  const [contactSubmitError, setContactSubmitError] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoUploadProgress, setPhotoUploadProgress] = useState<number[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [photoSizeWarning, setPhotoSizeWarning] = useState<string | null>(null);
  const [beforeAfterIndex, setBeforeAfterIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const withJpgName = (name: string) => {
    if (/\.(jpe?g)$/i.test(name)) return name;
    return name.replace(/\.[^/.]+$/, '') + '.jpg';
  };

  const compressImageFile = async (file: File) => {
    if (!file.type.startsWith('image/') || file.size < 350 * 1024) return file;

    const objectUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Unable to read selected image.'));
        image.src = objectUrl;
      });

      const maxDimension = 1600;
      const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0, width, height);

      const compressedBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.78);
      });

      if (!compressedBlob || compressedBlob.size >= file.size) return file;

      return new File([compressedBlob], withJpgName(file.name), {
        type: 'image/jpeg',
        lastModified: file.lastModified,
      });
    } catch {
      return file;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const removeSelectedPhoto = (target: File) => {
    if (isSubmittingContact) return;
    setSelectedPhotos((prev) =>
      prev.filter(
        (file) =>
          !(
            file.name === target.name &&
            file.size === target.size &&
            file.lastModified === target.lastModified &&
            file.type === target.type
          ),
      ),
    );
  };

  const addServiceItem = () => {
    if (!serviceToAdd) return;
    setServiceItems((prev) => {
      const existing = prev.find((item) => item.label === serviceToAdd);
      if (existing) {
        return prev.map((item) => (item.label === serviceToAdd ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...prev, { label: serviceToAdd, quantity: 1 }];
    });
  };

  const updateServiceQuantity = (label: string, quantity: number) => {
    setServiceItems((prev) => prev.map((item) => (item.label === label ? { ...item, quantity: Math.max(1, quantity || 1) } : item)));
  };

  const removeServiceItem = (label: string) => {
    setServiceItems((prev) => prev.filter((item) => item.label !== label));
  };

  const itemizedEstimate = useMemo(() => {
    const items = serviceItems
      .map(({ label, quantity }) => {
        const option = pricingOptions.find((entry) => entry.label === label);
        if (!option) return null;

        return {
          label: option.label,
          quantity,
          low: option.low * quantity,
          high: option.high * quantity,
        };
      })
      .filter((entry): entry is { label: string; quantity: number; low: number; high: number } => entry !== null);

    const subtotalLow = items.reduce((sum, item) => sum + item.low, 0);
    const subtotalHigh = items.reduce((sum, item) => sum + item.high, 0);
    const low = Math.max(minimumFee, subtotalLow);
    const high = Math.max(minimumFee, subtotalHigh);
    return { items, subtotalLow, subtotalHigh, low, high };
  }, [serviceItems, pricingOptions, minimumFee]);

  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactSubmitMessage(null);
    setContactSubmitError(null);
    if (isProcessingPhotos) {
      setContactSubmitError('Please wait for file processing to finish before submitting.');
      return;
    }
    const totalUploadBytes = selectedPhotos.reduce((sum, file) => sum + file.size, 0);
    if (totalUploadBytes > CLIENT_MAX_UPLOAD_BYTES) {
      setContactSubmitError(`Selected files total ${formatBytes(totalUploadBytes)}. Please keep uploads under ${formatBytes(CLIENT_MAX_UPLOAD_BYTES)}.`);
      return;
    }
    setIsSubmittingContact(true);

    try {
      const form = event.currentTarget;
      const formData = new FormData(form);
      formData.delete('photos');
      selectedPhotos.forEach((file) => {
        formData.append('photos', file);
      });
      setPhotoUploadProgress(selectedPhotos.map(() => 0));

      await new Promise<{ ok: boolean; error?: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const totalFileBytes = selectedPhotos.reduce((sum, file) => sum + file.size, 0);

        xhr.open('POST', '/api/contact');
        xhr.responseType = 'json';

        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable || selectedPhotos.length === 0) return;
          const scaledLoaded = totalFileBytes > 0 ? (e.loaded / e.total) * totalFileBytes : e.loaded;
          let offset = 0;
          const perFileProgress = selectedPhotos.map((file) => {
            const size = Math.max(1, file.size);
            const loadedForFile = Math.min(size, Math.max(0, scaledLoaded - offset));
            offset += size;
            return Math.min(100, Math.round((loadedForFile / size) * 100));
          });
          setPhotoUploadProgress(perFileProgress);
        };

        xhr.onload = () => {
          setPhotoUploadProgress(selectedPhotos.map(() => 100));
          const response = (xhr.response ?? {}) as { error?: string };
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({ ok: true });
            return;
          }
          reject(new Error(response.error || 'Unable to submit your request right now.'));
        };

        xhr.onerror = () => {
          reject(new Error('Network error while uploading files. Please try again.'));
        };

        xhr.send(formData);
      });

      form.reset();
      setSelectedPhotos([]);
      setPhotoUploadProgress([]);
      setContactSubmitMessage('Thanks! Your request was sent. We will get back to you soon.');
    } catch (error) {
      setContactSubmitError(error instanceof Error ? error.message : 'Unable to submit your request right now.');
    } finally {
      setIsSubmittingContact(false);
    }
  };

  useEffect(() => {
    const totalUploadBytes = selectedPhotos.reduce((sum, file) => sum + file.size, 0);
    if (totalUploadBytes > CLIENT_MAX_UPLOAD_BYTES) {
      setPhotoSizeWarning(`Selected files total ${formatBytes(totalUploadBytes)}. Keep uploads under ${formatBytes(CLIENT_MAX_UPLOAD_BYTES)}.`);
    } else {
      setPhotoSizeWarning(null);
    }
  }, [selectedPhotos]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const id = window.setInterval(() => {
      setBeforeAfterIndex((i) => (i + 1) % BEFORE_AFTER_IMAGES.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  const services = [
    { title: 'Hauling', icon: Truck, text: 'Fast, dependable hauling for everyday cleanup, property projects, and oversized items.' },
    { title: 'Junk Removal', icon: Trash2, text: 'Furniture, clutter, bulk trash, and unwanted items cleared out without the hassle.' },
    { title: 'Hot Tub Removal', icon: Bath, text: 'Breakdown and haul-away for old hot tubs, with pricing based on size and access.' },
    { title: 'Shed Removal', icon: Home, text: 'Demolition and removal for small sheds and worn-out backyard structures.' },
    { title: 'Yard Debris', icon: Trees, text: 'Branches, brush, storm debris, leaves, and outdoor cleanup hauled away quickly.' },
    { title: 'Clean Outs', icon: Package, text: 'Garage, storage unit, estate, rental, and property clean outs with clear communication.' },
    { title: 'Small Moving Jobs', icon: Sofa, text: 'Need help moving a few items across town? We handle smaller jobs with care.' },
    { title: 'Large Item Transport', icon: ArrowRight, text: 'Single-item and oversized-item transport for furniture, equipment, and more.' },
    {
      title: 'Construction Deliveries',
      icon: Hammer,
      text: 'Pickup and delivery for materials, jobsite items, and project-related transport.',
      image: '/odyssey-trailer.JPG',
      imageAlt: 'Pickup truck towing a loaded utility trailer for construction and jobsite deliveries',
    },
  ];

  const reviews = [
    {
      name: 'Rudy G',
      text: 'Odyssey hauling is amazing. Briton got a job that would have taken me a week done in about 4 hours. Very professional and very polite. All around great experience!'
    },
    {
      name: 'Josh Erickson',
      text: 'Great service. Arrived on time. Followed directions and worked efficiently and took care to not damage anything while removing furniture from the house. Friendly and trustworthy crew.'
    },
    {
      name: 'Chris Couch',
      text: 'We had a bunch of scrap metal we didn’t know what to do with. These guys showed up, gave us a reasonable rate and took care of everything. One hundred percent recommend.'
    },
  ];

  const process = [
    {
      number: '01',
      title: 'Send the details',
      icon: Camera,
      text: 'Share your name, location, photos of the property, whether there are hazardous materials, and a general list of items or amount of debris.',
    },
    {
      number: '02',
      title: 'Schedule the job',
      icon: Clock3,
      text: 'Let us know when you need us there and we will coordinate a time that works for your schedule.',
    },
    {
      number: '03',
      title: 'Confirm and get it done',
      icon: FileText,
      text: 'Larger jobs require a signed contract with 50% down and 50% on completion. Smaller jobs are flat-rate. Minimum fee is $100.',
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f1e7] text-[#171717] leading-relaxed antialiased">
      <section className="relative overflow-x-hidden border-b border-black/10 bg-[radial-gradient(circle_at_top,rgba(177,114,48,0.16),transparent_38%),linear-gradient(to_bottom,#f8f2e9,#f4ede2)]">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, rgba(0,0,0,.25) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,.25) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 pt-0 pb-16 sm:px-8 md:px-12 lg:px-14 md:pb-20 lg:grid-cols-[1.12fr_0.88fr] lg:items-start lg:gap-6 lg:pt-[50px] lg:pb-12 xl:gap-8 xl:pb-14">
          <div className="relative order-1 flex w-full max-w-none max-lg:left-1/2 max-lg:w-screen max-lg:-translate-x-1/2 max-lg:flex-col lg:contents lg:left-auto lg:w-auto lg:translate-x-0">
            <div className="relative isolate lg:-mt-4 lg:order-2 lg:mx-auto lg:max-w-xl xl:-mt-6">
              <Image
                src="/odessey-hero-darkened.svg"
                alt="Briton and truck for Odyssey Hauling LLC"
                width={1200}
                height={1200}
                className="h-auto w-full max-lg:rounded-none object-contain lg:rounded-2xl"
                priority
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-1/3 bg-gradient-to-b from-black/70 via-black/45 via-[55%] to-transparent lg:hidden"
              />

              {/* Mobile / tablet: title + blurb centered in top third of image */}
              <div className="absolute inset-x-0 top-0 z-10 flex h-1/3 min-h-0 flex-col items-center justify-center gap-2 overflow-y-auto overscroll-contain px-4 py-2 text-center text-white lg:hidden">
                <h1 className="w-full max-w-xl shrink-0 text-balance font-semibold tracking-tight text-[clamp(1.45rem,6.2vw,2.05rem)] leading-[1.06] text-white sm:max-w-2xl sm:text-[clamp(1.55rem,5.2vw,2.2rem)]">
                  When you need a <span className="text-[#f2d9a8]">friend with a truck</span>.
                </h1>
                <p className="w-full max-w-xl shrink-0 text-[0.8125rem] leading-snug text-white/88 sm:max-w-2xl sm:text-[0.84rem]">
                  Hauling, junk removal, specialty pickups, and clean-outs with straightforward pricing, and fast scheduling.
                </p>
              </div>
            </div>

            <div className="z-10 flex w-full min-w-0 shrink-0 flex-row gap-2 border-t border-black/10 bg-[#f7f1e7] px-5 py-4 sm:gap-3 sm:px-8 md:px-12 lg:hidden">
              <a
                href="#quote"
                className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#111111] px-4 py-3 text-sm font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5 sm:px-5 sm:text-base"
              >
                <span className="truncate">Get a quote</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </a>
              <a
                href="#contact"
                className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-sm font-medium text-[#1b1b1b] backdrop-blur transition hover:bg-white sm:px-5 sm:text-base"
              >
                <span className="truncate">Contact Us</span>
                <Phone className="h-4 w-4 shrink-0" />
              </a>
            </div>

            {/* lg+: copy column (same text as overlay; only one column visible at a time) */}
            <div className="relative z-10 order-1 hidden lg:mt-12 lg:block">
              <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-[0.95] tracking-tight uppercase text-[#1b1b1b] sm:text-5xl lg:text-6xl">
                When you need a <span className="text-[#8a4a17]">friend with a truck</span>.
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-black/70 sm:text-xl">
                Hauling, junk removal, specialty pickups, and clean-outs with straightforward pricing, and fast scheduling.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-5">
                <a
                  href="#quote"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#111111] px-6 py-4 text-base font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5"
                >
                  Get a quote
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white/80 px-6 py-4 text-base font-medium text-[#1b1b1b] backdrop-blur transition hover:bg-white"
                >
                  Contact Us
                  <Phone className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#f7f4ef] py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            {/* Left Content */}
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-sm uppercase tracking-[0.2em] text-[#8a4a17]">
                About Odyssey
              </div>

              <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                A reliable local team for hauling, cleanouts, and heavy lifting.
              </h2>

              <div className="mt-8 space-y-6 text-lg leading-8 text-[#4b4b4b]">
                <p>
                  Odyssey Hauling LLC is a reliable, locally owned hauling and junk
                  removal service based in Beaverton, OR and servicing the greater
                  Portland area. We specialize in junk removal, property cleanouts,
                  and transporting large items.
                </p>

                <p>
                  No job is too big or too small, and we are committed to handling
                  every job with care and efficiency. Whether you are clearing out
                  clutter, cleaning up a property, or need a hand with heavy lifting,
                  we are here to help.
                </p>

                <p>
                  We also strive to donate and recycle as much as possible. We work
                  with different nonprofits and organizations to help give items a
                  second home.
                </p>

                <p>
                  So if you need a friend with a truck, call Odyssey Hauling today
                  for a free quote.
                </p>
              </div>
            </div>

            {/* Right Images */}
            <div className="relative">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="overflow-hidden rounded-[2rem] shadow-2xl">
                  <img
                    src="/odyssey-wood.JPG"
                    alt="Odyssey Hauling team member standing in front of reclaimed wood and debris"
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="overflow-hidden rounded-[2rem] shadow-2xl">
                  <img
                    src="/odyssey-dumpster.JPG"
                    alt="Dumpster full of debris and junk removal materials"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>

              {/* Decorative Background Accent */}
              <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#d8e6d2] blur-3xl opacity-60" />
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-[#e7ddd0] blur-3xl opacity-60" />
            </div>
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-5 pb-24 pt-[calc(6rem-30px)] sm:px-8 md:px-12 md:pb-28 md:pt-[calc(7rem-30px)] lg:px-14 lg:pb-32 lg:pt-[calc(8rem-30px)]">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-sm uppercase tracking-[0.2em] text-[#8a4a17]">
              Services
            </div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Reliable help for heavy, bulky, messy, and awkward jobs.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-black/65">
              Whether you need a few items gone, a full trailer load hauled away, or help moving something large, Odyssey Hauling keeps it simple.
            </p>
          </div>
          <div className="relative hidden h-[176px] w-[320px] shrink-0 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm md:block">
            <Image
              src="/odyssey-trailer.JPG"
              alt="Odyssey Hauling truck and trailer"
              fill
              sizes="320px"
              className="object-cover"
            />
          </div>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;
            const extra = service as typeof service & { image?: string; imageAlt?: string };
            const photoSrc = typeof extra.image === 'string' ? extra.image : null;

            const cardInner = (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8a4a17]/10 text-[#8a4a17]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{service.title}</h3>
                <p className="mt-3 leading-7 text-black/65">{service.text}</p>
              </>
            );

            if (photoSrc) {
              return (
                [
                  <div key={`${service.title}-card`} className="group rounded-[1.75rem] border border-black/10 bg-white/80 p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                    {cardInner}
                  </div>,
                ]
              );
            }

            return (
              <div key={service.title} className="group rounded-[1.75rem] border border-black/10 bg-white/80 p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                {cardInner}
              </div>
            );
          })}
          <div className="group relative aspect-[4/3] min-h-0 w-full overflow-hidden rounded-[1.75rem] border border-black/10 bg-white/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg md:hidden">
            <Image
              src="/odyssey-trailer.JPG"
              alt="Odyssey Hauling truck and trailer"
              fill
              sizes="(max-width: 768px) 92vw, 264px"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section id="reviews" className="border-y border-black/10 bg-[#efe5d6]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 md:px-12 lg:px-14 md:py-28 lg:py-32">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm uppercase tracking-[0.2em] text-[#8a4a17]">
                Google Reviews
              </div>
              <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Trusted by local customers who needed it handled fast.</h2>
            </div>
            {/* <p className="max-w-xl text-base leading-7 text-black/65">
              Swap these placeholders with live Google reviews when ready, or connect this section to your review data later.
            </p> */}
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:gap-8">
            {reviews.map((review) => (
              <div key={review.name} className="rounded-[1.75rem] border border-black/10 bg-white p-8 shadow-sm">
                <div className="flex gap-1 text-[#8a4a17]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-5 text-lg leading-8 text-black/75">“{review.text}”</p>
                <div className="mt-6 text-sm font-medium uppercase tracking-[0.18em] text-black/50">{review.name}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex justify-center">
            <a
              href="https://maps.app.goo.gl/41ami5wUUMZXM2xK8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#111111] px-6 py-4 text-base font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.15)] transition hover:-translate-y-0.5"
            >
              See all reviews on Google
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section
        id="before-after"
        aria-label="Before and after project photos"
        className="border-y border-black/10 bg-[#ebe3d4]"
      >
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 md:px-12 lg:px-14 md:py-28 lg:py-32">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm uppercase tracking-[0.2em] text-[#8a4a17]">
              Results
            </div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Before &amp; after</h2>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-black/65">
              Real jobs, real transformations—garages, yards, interiors, and more cleared out efficiently.
            </p>
          </div>

          {/* Mobile: one slide at a time, auto-advance */}
          <div className="mt-14 lg:hidden">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-black/10 bg-black/5 shadow-[0_24px_60px_rgba(0,0,0,0.1)] aspect-[4/5] max-h-[min(70vh,540px)] w-full">
              <div
                className="flex h-full transition-transform duration-700 ease-out"
                style={{ transform: `translateX(-${beforeAfterIndex * 100}%)` }}
              >
                {BEFORE_AFTER_IMAGES.map((src, idx) => (
                  <div key={src} className="relative h-full min-w-full shrink-0">
                    <Image
                      src={src}
                      alt={`Before and after hauling project ${idx + 1} of ${BEFORE_AFTER_IMAGES.length}`}
                      fill
                      sizes="(max-width: 640px) 92vw, (max-width: 1023px) 88vw"
                      className="object-cover"
                      priority={idx === 0}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-7 flex justify-center gap-2" role="tablist" aria-label="Select project photo">
              {BEFORE_AFTER_IMAGES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={i === beforeAfterIndex}
                  aria-label={`Photo ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all ${i === beforeAfterIndex ? 'w-8 bg-[#8a4a17]' : 'w-2.5 bg-black/20 hover:bg-black/35'
                    }`}
                  onClick={() => setBeforeAfterIndex(i)}
                />
              ))}
            </div>
          </div>

          {/* Desktop: continuous horizontal scroll */}
          <div
            className={`mt-14 hidden lg:block ${reducedMotion ? 'overflow-x-auto pb-2' : 'overflow-hidden'} [scrollbar-gutter:stable]`}
          >
            <div
              className={`flex w-max gap-6 lg:gap-7 ${reducedMotion ? '' : 'animate-before-after-marquee'}`}
            >
              {[...BEFORE_AFTER_IMAGES, ...BEFORE_AFTER_IMAGES].map((src, idx) => (
                <div
                  key={`${src}-${idx}`}
                  className="relative h-80 w-[min(22rem,calc((100vw-8rem)/3))] shrink-0 overflow-hidden rounded-[1.75rem] border border-black/10 shadow-[0_20px_50px_rgba(0,0,0,0.12)]"
                >
                  <Image
                    src={src}
                    alt={`Before and after project ${(idx % BEFORE_AFTER_IMAGES.length) + 1}`}
                    fill
                    sizes="(max-width: 1280px) min(22rem, 32vw), 22rem"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 md:px-12 lg:px-14 md:py-28 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-sm uppercase tracking-[0.2em] text-[#8a4a17]">
              Process
            </div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">A simple process from photos to pickup day.</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-black/65">
              The goal is to quote quickly, schedule clearly, and make sure expectations are handled before the job starts.
            </p>

            <div className="mt-10 rounded-[1.75rem] border border-black/10 bg-[#111111] p-8 text-white shadow-lg">
              <div className="flex items-start gap-4">
                <Shield className="mt-1 h-5 w-5 flex-none text-[#d49a5a]" />
                <p className="leading-7 text-white/80">
                  For larger jobs, clients sign a contract and pay 50% at signing and 50% when the job is complete. Smaller jobs are billed at a flat rate.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:gap-8">
            {process.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="grid gap-5 rounded-[1.75rem] border border-black/10 bg-white/80 p-8 shadow-sm md:grid-cols-[auto_1fr] md:items-start">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8a4a17]/10 text-[#8a4a17]">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-black/35 md:hidden">Step {step.number}</div>
                  </div>
                  <div>
                    <div className="hidden text-sm font-semibold uppercase tracking-[0.2em] text-black/35 md:block">Step {step.number}</div>
                    <h3 className="mt-1 text-xl font-semibold">{step.title}</h3>
                    <p className="mt-3 leading-8 text-black/65">{step.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="quote" className="border-y border-black/10 bg-[linear-gradient(to_bottom,#f2e7d8,#efe3d1)]">
        <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 md:px-12 lg:px-14 md:py-28 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-16">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm uppercase tracking-[0.2em] text-[#8a4a17]">
                Quote Calculator
              </div>
              <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Quick estimate tool with flat-rate pricing.</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-black/65">
                This gives you a fast ballpark estimate before you send photos and job details for confirmation.
              </p>

              <div className="mt-10 rounded-[1.75rem] border border-black/10 bg-white/80 p-8 shadow-sm">
                <h3 className="text-lg font-semibold">Flat-rate pricing guide</h3>
                <div className="mt-5 space-y-3 text-sm text-black/70">
                  {pricingOptions.map((item) => (
                    <div key={item.label} className="flex items-start justify-between gap-4 border-b border-black/5 pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <div className="font-medium text-black">{item.label}</div>
                        {item.helper ? <div className="mt-1 text-black/55">{item.helper}</div> : null}
                      </div>
                      <div className="whitespace-nowrap font-semibold text-[#8a4a17]">
                        {'priceDisplay' in item && typeof item.priceDisplay === 'string'
                          ? item.priceDisplay
                          : item.low === item.high
                            ? `$${item.low}`
                            : `$${item.low}–$${item.high}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[25rem] rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_60px_rgba(0,0,0,0.12)] sm:max-w-[26rem] sm:p-8 lg:mx-0 lg:max-w-none">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm uppercase tracking-[0.2em] text-black/40">Estimate builder</div>
                  <h3 className="mt-2 text-xl font-semibold">See your ballpark range</h3>
                </div>
                <div className="rounded-2xl bg-[#111111] px-4 py-3 text-right text-white">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/50">Minimum</div>
                  <div className="text-lg font-semibold">${minimumFee}</div>
                </div>
              </div>

              <div className="mt-10 grid gap-6">
                <div className="grid gap-2">
                  <span className="text-sm font-medium text-black/65">Service items</span>
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <select
                      value={serviceToAdd}
                      onChange={(e) => setServiceToAdd(e.target.value)}
                      className="h-14 rounded-2xl border border-black/10 bg-[#faf7f2] px-4 text-base outline-none ring-0 transition focus:border-[#8a4a17]"
                    >
                      {selectablePricingOptions.map((item) => (
                        <option key={item.label} value={item.label}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={addServiceItem}
                      className="h-14 rounded-2xl bg-[#111111] px-5 text-sm font-medium text-white transition hover:-translate-y-0.5"
                    >
                      Add item
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-black/10 bg-[#faf7f2] p-4">
                  {serviceItems.length === 0 ? (
                    <p className="text-sm text-black/55">No service items selected yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {itemizedEstimate.items.map((item) => (
                        <div key={item.label} className="grid gap-2 rounded-xl border border-black/10 bg-white p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                          <div>
                            <div className="font-medium text-black">{item.label}</div>
                            <div className="text-xs text-black/55">
                              {item.low === item.high ? `$${item.low}` : `$${item.low}–$${item.high}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-black/65">
                            <span>Qty</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateServiceQuantity(item.label, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/10 bg-[#faf7f2] text-base font-medium text-black/70 transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-45"
                                aria-label={`Decrease ${item.label} quantity`}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e) => updateServiceQuantity(item.label, Number(e.target.value))}
                                className="h-10 w-20 rounded-lg border border-black/10 bg-[#faf7f2] px-2 text-sm outline-none transition focus:border-[#8a4a17]"
                              />
                              <button
                                type="button"
                                onClick={() => updateServiceQuantity(item.label, item.quantity + 1)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/10 bg-[#faf7f2] text-base font-medium text-black/70 transition hover:bg-black/[0.04]"
                                aria-label={`Increase ${item.label} quantity`}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeServiceItem(item.label)}
                            className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-black/60 transition hover:bg-black/[0.05] hover:text-black"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              <div className="mt-10 rounded-[1.75rem] bg-[#111111] p-8 text-white">
                <div className="text-sm uppercase tracking-[0.2em] text-white/50">Estimate</div>
                <div className="mt-3 text-3xl font-semibold tracking-tight">
                  {itemizedEstimate.low === itemizedEstimate.high
                    ? `$${itemizedEstimate.low}`
                    : `$${itemizedEstimate.low}–$${itemizedEstimate.high}`}
                </div>
                <div className="mt-4 space-y-1 text-sm text-white/75">
                  {itemizedEstimate.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-3">
                      <span>{item.label} x {item.quantity}</span>
                      <span>{item.low === item.high ? `$${item.low}` : `$${item.low}–$${item.high}`}</span>
                    </div>
                  ))}
                  {itemizedEstimate.items.length > 0 ? (
                    <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-2 font-medium text-white">
                      <span>Subtotal</span>
                      <span>
                        {itemizedEstimate.subtotalLow === itemizedEstimate.subtotalHigh
                          ? `$${itemizedEstimate.subtotalLow}`
                          : `$${itemizedEstimate.subtotalLow}–$${itemizedEstimate.subtotalHigh}`}
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 border-t border-white/15 pt-2">
                      Minimum fee applies: ${minimumFee}
                    </div>
                  )}
                </div>
                <p className="mt-3 max-w-xl leading-7 text-white/70">
                  Final price depends on photos, exact item count, and on-site conditions. This calculator is meant for quick ballpark pricing.
                </p>
              </div>

              <a
                href="#contact"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#8a4a17]"
              >
                Request final quote
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 md:px-12 lg:px-14 md:py-28 lg:py-32">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-black/10 bg-white px-4 py-2 text-sm uppercase tracking-[0.2em] text-[#8a4a17]">
              Contact
            </div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Send the details and get the job moving.</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-black/65">
              The fastest way to quote is with photos, your location, and a general list of what needs to go.
            </p>

            <div className="mt-10 space-y-5">
              {[
                { icon: MapPin, text: 'Include your location' },
                { icon: Camera, text: 'Attach photos of the property or items' },
                { icon: Trash2, text: 'List what is being hauled away' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-center gap-4 rounded-2xl border border-black/10 bg-white/80 px-5 py-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8a4a17]/10 text-[#8a4a17]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-black/75">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_60px_rgba(0,0,0,0.1)] sm:p-10">
            <form className="grid gap-6" onSubmit={handleContactSubmit}>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-black/65">Full name</span>
                <input
                  name="fullName"
                  required
                  className="h-14 rounded-2xl border border-black/10 bg-[#faf7f2] px-4 outline-none transition focus:border-[#8a4a17]"
                  placeholder="Your name"
                />
              </label>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-black/65">Email</span>
                  <input
                    name="email"
                    type="email"
                    required
                    className="h-14 rounded-2xl border border-black/10 bg-[#faf7f2] px-4 outline-none transition focus:border-[#8a4a17]"
                    placeholder="you@example.com"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-black/65">Phone</span>
                  <input
                    name="phone"
                    required
                    className="h-14 rounded-2xl border border-black/10 bg-[#faf7f2] px-4 outline-none transition focus:border-[#8a4a17]"
                    placeholder="(555) 555-5555"
                  />
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-black/65">Location</span>
                <input
                  name="location"
                  required
                  className="h-14 rounded-2xl border border-black/10 bg-[#faf7f2] px-4 outline-none transition focus:border-[#8a4a17]"
                  placeholder="City or job address"
                />
              </label>

              <div className="grid gap-6 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-black/65">When do you need it scheduled?</span>
                  <input
                    name="scheduledDate"
                    type="date"
                    className="h-14 rounded-2xl border border-black/10 bg-[#faf7f2] px-4 outline-none transition focus:border-[#8a4a17]"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-black/65">Hazardous material?</span>
                  <select
                    name="hazardousMaterial"
                    className="h-14 rounded-2xl border border-black/10 bg-[#faf7f2] px-4 outline-none transition focus:border-[#8a4a17]"
                  >
                    <option>No</option>
                    <option>Yes</option>
                    <option>Not sure</option>
                  </select>
                </label>
              </div>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-black/65">General list of items</span>
                <textarea
                  name="itemList"
                  required
                  rows={5}
                  className="rounded-2xl border border-black/10 bg-[#faf7f2] px-4 py-4 outline-none transition focus:border-[#8a4a17]"
                  placeholder="Example: 1 couch, 10 bags of trash, branches from backyard, old washer and dryer..."
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-black/65">Photo upload</span>
                <input
                  name="photos"
                  type="file"
                  multiple
                  onChange={(e) => {
                    const nextFiles = Array.from(e.currentTarget.files ?? []);
                    if (nextFiles.length === 0) return;
                    e.currentTarget.value = '';
                    void (async () => {
                      setIsProcessingPhotos(true);
                      try {
                        const processedFiles = await Promise.all(nextFiles.map(compressImageFile));
                        setSelectedPhotos((prev) => {
                          const merged = [...prev, ...processedFiles];
                          const seen = new Set<string>();
                          return merged.filter((file) => {
                            const key = `${file.name}-${file.size}-${file.lastModified}`;
                            if (seen.has(key)) return false;
                            seen.add(key);
                            return true;
                          });
                        });
                      } finally {
                        setIsProcessingPhotos(false);
                      }
                    })();
                  }}
                  className={`rounded-2xl border border-dashed border-black/15 bg-[#faf7f2] px-4 py-4 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-[#111111] file:px-4 file:py-2 file:text-white ${selectedPhotos.length > 0 ? 'text-transparent' : ''
                    }`}
                />
                {selectedPhotos.length > 0 ? (
                  <div className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs text-black/65">
                    <div className="font-medium text-black/75">
                      {selectedPhotos.length} file{selectedPhotos.length > 1 ? 's' : ''} selected
                    </div>
                    <div className="mt-0.5 text-black/60">Total size: {formatBytes(selectedPhotos.reduce((sum, file) => sum + file.size, 0))}</div>
                    <ul className="mt-1 space-y-1">
                      {selectedPhotos.map((file, index) => {
                        const progress = photoUploadProgress[index] ?? 0;
                        return (
                          <li key={`${file.name}-${file.size}-${file.lastModified}-${index}`} className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate">- {file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeSelectedPhoto(file)}
                                disabled={isSubmittingContact}
                                className="inline-flex shrink-0 items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-medium text-black/55 transition hover:bg-black/[0.05] hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label={`Remove ${file.name}`}
                              >
                                Remove
                              </button>
                            </div>
                            {isSubmittingContact ? (
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
                                <div
                                  className="h-full rounded-full bg-[#8a4a17] transition-all duration-150"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
                {isProcessingPhotos ? <div className="text-xs text-black/60">Optimizing selected images...</div> : null}
                {photoSizeWarning ? <div className="text-xs font-medium text-red-700">{photoSizeWarning}</div> : null}
              </label>

              <div className="hidden" aria-hidden="true">
                <label htmlFor="website-field">Leave this field empty</label>
                <input
                  id="website-field"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  className="h-0 w-0 opacity-0"
                />
              </div>

              {contactSubmitMessage ? <div className="text-sm font-medium text-green-700">{contactSubmitMessage}</div> : null}
              {contactSubmitError ? <div className="text-sm font-medium text-red-700">{contactSubmitError}</div> : null}

              <button
                type="submit"
                disabled={isSubmittingContact || isProcessingPhotos || Boolean(photoSizeWarning)}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#8a4a17] px-6 text-base font-medium text-white shadow-[0_16px_35px_rgba(138,74,23,0.28)] transition hover:-translate-y-0.5"
              >
                {isProcessingPhotos ? 'Preparing files...' : isSubmittingContact ? 'Sending...' : 'Submit request'}
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>

    </main>
  );
}
