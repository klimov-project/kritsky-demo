import LegalPageContent from '@/components/legal/LegalPageContent';
import { PRIVACY_PAGE_DOCUMENT } from '@/utils/legalPageContent';

export default function PrivacyPage() {
    return <LegalPageContent document={PRIVACY_PAGE_DOCUMENT} />;
}
