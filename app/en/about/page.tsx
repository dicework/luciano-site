import Page, { pageMetadata } from '@/components/pages/about';
export const metadata = pageMetadata('en');
export default function Route() {
  return <Page locale="en" />;
}
