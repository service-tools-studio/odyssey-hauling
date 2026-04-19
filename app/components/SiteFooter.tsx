export default function SiteFooter() {
  return (
    <footer className="border-t border-black/10 bg-[#efe5d6]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-12 text-sm text-black/75 sm:px-8 md:flex-row md:items-center md:justify-between md:px-12 lg:px-14 md:py-14">
        <div className="font-medium text-black/85">Odyssey Hauling LLC</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
          <a href="tel:5039399687" className="transition-colors hover:text-black">
            503-939-9687
          </a>
          <a href="mailto:odysseyhauling@gmail.com" className="transition-colors hover:text-black">
            odysseyhauling@gmail.com
          </a>
          <a href="/coi" className="font-medium text-[#8a4a17] transition-colors hover:text-[#5c2f0f]">
            View COI
          </a>
        </div>
      </div>
    </footer>
  );
}
