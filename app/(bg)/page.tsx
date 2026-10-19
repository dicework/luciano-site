import Page, { pageMetadata } from '@/components/pages/home';
export const metadata = pageMetadata('bg');
export default function Route() {
  return <Page locale="bg" />;
}
