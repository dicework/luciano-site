import SiteDocument, { siteMetadata } from '@/components/site/site-document';
export const metadata = siteMetadata('bg');
export default function Layout({ children }: { children: React.ReactNode }) {
  return <SiteDocument locale="bg">{children}</SiteDocument>;
}
