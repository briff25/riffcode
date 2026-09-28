import SiteHeader from "@/components/SiteHeader";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="plan-grid min-h-[70vh]">
        <div className="mx-auto max-w-[1320px] px-4 py-24 sm:px-8 md:py-32">
          <p className="text-[15px] font-semibold text-redline-deep">Page not found</p>
          <h1 className="font-condensed mt-3 max-w-[16ch] text-[clamp(3rem,8vw,6rem)] font-extrabold leading-[0.9]">
            This aisle isn&apos;t on the plan.
          </h1>
          <p className="mt-6 max-w-[48ch] text-lg text-ink/80">
            The page you were looking for has moved or never existed. Everything lives on the home page now.
          </p>
          <div className="mt-8">
            <ButtonLink href="/">Go to the home page</ButtonLink>
          </div>
        </div>
      </main>
    </>
  );
}
