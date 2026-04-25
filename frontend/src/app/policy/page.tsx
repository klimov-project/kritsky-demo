import LegalPageContent from '@/components/legal/LegalPageContent';
import { POLICY_PAGE_DOCUMENT } from '@/utils/legalPageContent';

export default function PolicyPage() {
    return <LegalPageContent document={POLICY_PAGE_DOCUMENT} />;
}
