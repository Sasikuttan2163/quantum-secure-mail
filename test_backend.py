#!/usr/bin/env python3
"""
Quick test script to verify the backend setup
Tests connection to QKD KME and email sending capability
"""
import asyncio
import httpx
import sys


async def test_qkd_kme():
    """Test QKD KME connectivity"""
    print("=" * 60)
    print("Testing QKD KME Connection...")
    print("=" * 60)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "http://localhost:8000/api/v1/keys/TEST_SAE/status",
                timeout=5.0
            )
            
            if response.status_code == 200:
                print("✅ QKD KME is running and responding")
                data = response.json()
                print(f"   - Stored keys: {data.get('stored_key_count')}")
                print(f"   - Max keys: {data.get('max_key_count')}")
                return True
            else:
                print(f"❌ QKD KME returned status code: {response.status_code}")
                return False
                
    except httpx.ConnectError:
        print("❌ Could not connect to QKD KME at http://localhost:8000")
        print("   Make sure to start it with: cd qkd-simulator && python main.py")
        return False
    except Exception as e:
        print(f"❌ Error testing QKD KME: {e}")
        return False


async def test_backend():
    """Test backend API connectivity"""
    print("\n" + "=" * 60)
    print("Testing Backend API...")
    print("=" * 60)
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "http://localhost:8001/health",
                timeout=5.0
            )
            
            if response.status_code == 200:
                print("✅ Backend API is running and healthy")
                data = response.json()
                print(f"   - Status: {data.get('status')}")
                print(f"   - QKD KME: {data.get('qkd_kme_url')}")
                print(f"   - SMTP: {data.get('smtp_server')}")
                return True
            else:
                print(f"❌ Backend returned status code: {response.status_code}")
                return False
                
    except httpx.ConnectError:
        print("❌ Could not connect to Backend at http://localhost:8001")
        print("   Make sure to start it with: cd backend && python main.py")
        return False
    except Exception as e:
        print(f"❌ Error testing Backend: {e}")
        return False


async def test_send_endpoint():
    """Test the /send endpoint (without actually sending)"""
    print("\n" + "=" * 60)
    print("Testing /send Endpoint Structure...")
    print("=" * 60)
    
    try:
        async with httpx.AsyncClient() as client:
            # Try to send with invalid data to check if endpoint exists
            response = await client.post(
                "http://localhost:8001/send",
                json={},
                timeout=5.0
            )
            
            # We expect 422 (validation error) which means endpoint exists
            if response.status_code == 422:
                print("✅ /send endpoint is available and validating requests")
                return True
            else:
                print(f"⚠️  Unexpected status code: {response.status_code}")
                return False
                
    except Exception as e:
        print(f"❌ Error testing /send endpoint: {e}")
        return False


async def main():
    """Run all tests"""
    print("\n🔬 Quantum Email Backend Test Suite\n")
    
    results = []
    
    # Test QKD KME
    results.append(await test_qkd_kme())
    
    # Test Backend
    results.append(await test_backend())
    
    # Test send endpoint
    results.append(await test_send_endpoint())
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("✅ All tests passed! System is ready.")
        print("\nYou can now send emails using:")
        print('curl -X POST http://localhost:8001/send -H "Content-Type: application/json" -d \'{"from": "sender@gmail.com", "to": "recipient@gmail.com", "subject": "Test", "body": "Hello!", "security_level": "L2"}\'')
        return 0
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
