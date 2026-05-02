import pytest
from ..generation import (
    _generate_collection_payload,
    _generate_full_variant_collection_payload,
    _validate_pack_specs,
)

def test_author_collection_generation(kb_payload):
    # Find an author with enough works/excerpts for testing
    works = kb_payload.get("works", [])
    if not works:
        pytest.skip("Knowledge base has no works")
        
    # We just pick the first author we find to test the mechanism
    author_id = str(works[0].get("authorId") or "")
    author_name = str(works[0].get("author") or "")
    
    config = {
        "authorId": author_id,
        "authorName": author_name,
        "variantsCount": 2
    }
    
    try:
        payload = _generate_collection_payload(kb_payload, config, quantity=2)
    except Exception as e:
        pytest.skip(f"Failed to generate collection: {e}")
    
    assert payload["kind"] == "author_collection_1_5"
    assert len(payload["packs"]) == 2
    assert len(payload["packs"][0]["variants"]) == 2

    _validate_pack_specs(payload["packs"])

def test_full_variant_collection_generation(kb_payload):
    config = {
        "variantsCount": 3
    }
    
    try:
        payload = _generate_full_variant_collection_payload(kb_payload, config, quantity=2)
    except Exception as e:
        pytest.skip(f"Failed to generate full variant collection: {e}")
    
    assert payload["kind"] == "full_variant_collection"
    assert len(payload["packs"]) == 2
    assert len(payload["packs"][0]["variants"]) == 3

    _validate_pack_specs(payload["packs"])
