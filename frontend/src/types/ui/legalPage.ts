export interface LegalPageSection {
    title: string;
    paragraphs: string[];
}

export interface LegalPageDocument {
    title: string;
    intro: string;
    sections: LegalPageSection[];
}

export interface LegalPageContentProps {
    document: LegalPageDocument;
}
