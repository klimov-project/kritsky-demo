import LegalPageContent from '@/components/legal/LegalPageContent';
import { TERMS_PAGE_DOCUMENT } from '@/utils/legalPageContent';

export default function TermsPage() {
    return <LegalPageContent document={TERMS_PAGE_DOCUMENT} />;
}
