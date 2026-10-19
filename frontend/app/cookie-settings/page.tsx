import { Metadata } from 'next';
import CookieSettingsClient from './CookieSettingsClient';

export const metadata: Metadata = {
  title: 'Cookie Settings | Gujarat Post',
  description:
    'Manage your cookie and data privacy preferences on Gujarat Post. Choose which optional cookies and features are allowed.',
};

export default function CookieSettingsPage() {
  return <CookieSettingsClient />;
}
