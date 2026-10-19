import Page, { pageMetadata } from '@/components/pages/home';
export const metadata = pageMetadata('en');
export default function Route() {
  return <Page locale="en" />;
}
