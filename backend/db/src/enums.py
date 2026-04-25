from enum import Enum


class CurrencyEnum(str, Enum):
    RUB = "RUB"
    USD = "USD"
    EUR = "EUR"
    BYN = "BYN"
    KZT = "KZT"


class ProductCategoryEnum(str, Enum):
    BOOKS = "books"
    POSTERS = "posters"
    FIGURINES = "figurines"
    MERCH = "merch"
    COLLECTIONS = "collections"
    DOWNLOAD_PACKS = "download_packs"


class ProductFulfillmentEnum(str, Enum):
    DIGITAL = "digital"
    PHYSICAL = "physical"


class BookAttachmentTypeEnum(str, Enum):
    GALLERY = "gallery"
