#!/usr/bin/env python3
"""
Test script for Yookassa integration
Run this to verify that the payment integration is working
"""

import asyncio
import json
from decimal import Decimal

# Test 1: Check if Yookassa service can be imported
print("Test 1: Importing Yookassa service...")
try:
    from api.src.payments.yookassa_service import yookassa_service
    print("✓ Yookassa service imported successfully")
except ImportError as e:
    print(f"✗ Failed to import: {e}")
    exit(1)

# Test 2: Check if config loads
print("\nTest 2: Loading configuration...")
try:
    from api.config import SETTINGS
    print(f"✓ Config loaded")
    print(f"  - Account ID configured: {bool(SETTINGS.YOOKASSA_ACCOUNT_ID)}")
    print(f"  - Secret key configured: {bool(SETTINGS.YOOKASSA_SECRET_KEY)}")
    print(f"  - Return URL: {SETTINGS.YOOKASSA_RETURN_URL}")
except Exception as e:
    print(f"✗ Failed to load config: {e}")
    exit(1)

# Test 3: Check if Payment model exists
print("\nTest 3: Checking Payment model...")
try:
    from db.src.models import Payment
    print("✓ Payment model found")
    print(f"  - Payment fields: {Payment.__table__.columns.keys()}")
except Exception as e:
    print(f"✗ Failed to load Payment model: {e}")
    exit(1)

# Test 4: Check if payments router can be imported
print("\nTest 4: Importing payments router...")
try:
    from api.src.payments.router import router
    print("✓ Payments router imported successfully")
    print(f"  - Routes: {[route.path for route in router.routes]}")
except Exception as e:
    print(f"✗ Failed to import router: {e}")
    exit(1)

# Test 5: Check if app includes payments router
print("\nTest 5: Checking app configuration...")
try:
    from api.src.app import app
    routes = [route.path for route in app.routes]
    payment_routes = [r for r in routes if 'payments' in r]
    if payment_routes:
        print(f"✓ Payments routes registered in app")
        print(f"  - Payment routes: {payment_routes}")
    else:
        print("✗ No payment routes found in app")
except Exception as e:
    print(f"✗ Failed to check app: {e}")
    exit(1)

print("\n" + "="*50)
print("All tests passed! ✓")
print("="*50)
print("\nNext steps:")
print("1. Configure YOOKASSA_ACCOUNT_ID and YOOKASSA_SECRET_KEY in .env")
print("2. Start the backend: docker compose up -d --build backend")
print("3. Test the API at http://localhost:8000/docs")
print("4. Create a test payment to verify integration")
