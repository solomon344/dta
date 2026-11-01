import Image from "next/image";
import Link from "next/link";
import Icon from "./Icon";

export default function SiteFooter() {
  return (
    <footer className="no-print w-full bg-primary-container text-on-primary-container">
      <div className="mx-auto max-w-7xl px-4 pb-space-xl pt-space-2xl sm:px-6 lg:px-12">
        <div className="grid grid-cols-1 gap-space-xl pb-space-xl md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-space-sm">
            <div className="inline-flex rounded-lg bg-surface-container-lowest px-space-sm py-space-xs">
              <Image src="/assets/dta-mark.png" alt="DTA" width={790} height={300} className="h-8 w-auto" />
            </div>
            <p className="text-body-sm leading-relaxed">
              Data Technology Academy trains young Gambians in software development and data
              analytics.
            </p>
            <p className="text-label-tag uppercase tracking-wider text-surface-container-highest">
              Learn • Analyze • Innovate • Transform
            </p>
          </div>
          <div className="space-y-space-sm">
            <h4 className="text-label-lg uppercase tracking-wider text-surface-container-lowest">Contact</h4>
            <ul className="space-y-space-xs text-body-sm">
              <li>Serekunda, The Gambia</li>
              <li>West Africa</li>
              <li className="pt-space-2xs text-label-md text-secondary-fixed">
                <a href="mailto:admin@dta.gm" className="hover:underline">admin@dta.gm</a>
              </li>
            </ul>
          </div>
          <div className="space-y-space-sm">
            <h4 className="text-label-lg uppercase tracking-wider text-surface-container-lowest">Programs</h4>
            <ul className="space-y-space-xs text-body-sm">
              <li><Link href="/#tracks" className="hover:text-surface-container-lowest">Software Development</Link></li>
              <li><Link href="/#tracks" className="hover:text-surface-container-lowest">Data Analytics</Link></li>
            </ul>
          </div>
          <div className="space-y-space-sm">
            <h4 className="text-label-lg uppercase tracking-wider text-surface-container-lowest">
              Credential Verification
            </h4>
            <p className="text-body-sm">
              Employers and institutions can confirm any DTA certificate by its ID.
            </p>
            <Link
              href="/verify"
              className="inline-flex items-center gap-space-xs rounded-lg bg-surface-container-lowest px-space-md py-space-xs text-label-md text-on-surface transition-all hover:bg-surface-container"
            >
              <Icon name="verified" className="text-base" />
              Verify Graduate
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-space-md border-t border-white/10 pt-space-lg text-body-sm md:flex-row">
          <span>© 2026 Data Technology Academy. All rights reserved.</span>
          <span className="text-label-tag uppercase tracking-wider text-tertiary-fixed-dim">
            Empowering Gambian Youth
          </span>
        </div>
      </div>
    </footer>
  );
}
