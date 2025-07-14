import requests
import sys
from datetime import datetime, date, time
import json

class BelzMeetingRoomAPITester:
    def __init__(self, base_url="https://19636cf8-b385-4114-9b04-fce778e692df.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_appointment_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            print(f"   Response Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {json.dumps(response_data, indent=2, default=str)}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {json.dumps(error_data, indent=2)}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_endpoint(self):
        """Test API health check"""
        return self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )

    def test_get_availability(self, test_date="2025-02-15"):
        """Test availability endpoint"""
        return self.run_test(
            f"Get Availability for {test_date}",
            "GET",
            f"api/availability/{test_date}",
            200
        )

    def test_get_appointments(self, test_date="2025-02-15"):
        """Test get appointments endpoint"""
        return self.run_test(
            f"Get Appointments for {test_date}",
            "GET",
            f"api/appointments/{test_date}",
            200
        )

    def test_create_appointment(self):
        """Test creating a new appointment"""
        appointment_data = {
            "name": "João Silva",
            "date": "2025-02-15",
            "start_time": "14:00",  # Changed to avoid conflict with existing appointment
            "end_time": "15:00",
            "title": "Reunião de Teste Nova",
            "participants": "Maria Santos, Pedro Costa"
        }
        
        success, response = self.run_test(
            "Create Appointment",
            "POST",
            "api/appointments",
            201,
            data=appointment_data
        )
        
        if success and 'id' in response:
            self.created_appointment_id = response['id']
            print(f"   Created appointment ID: {self.created_appointment_id}")
        
        return success, response

    def test_create_conflicting_appointment(self):
        """Test creating a conflicting appointment (should fail)"""
        conflicting_data = {
            "name": "Ana Costa",
            "date": "2025-02-15",
            "start_time": "14:30",  # Overlaps with previous appointment (14:00-15:00)
            "end_time": "15:30",
            "title": "Reunião Conflitante",
            "participants": "Carlos Lima"
        }
        
        return self.run_test(
            "Create Conflicting Appointment (should fail)",
            "POST",
            "api/appointments",
            400,  # Should return 400 for conflict
            data=conflicting_data
        )

    def test_delete_appointment(self):
        """Test deleting an appointment"""
        if not self.created_appointment_id:
            print("❌ No appointment ID available for deletion test")
            return False, {}
        
        return self.run_test(
            f"Delete Appointment {self.created_appointment_id}",
            "DELETE",
            f"api/appointments/{self.created_appointment_id}",
            200
        )

    def test_delete_nonexistent_appointment(self):
        """Test deleting a non-existent appointment"""
        fake_id = "non-existent-id-12345"
        return self.run_test(
            "Delete Non-existent Appointment (should fail)",
            "DELETE",
            f"api/appointments/{fake_id}",
            404
        )

    def test_invalid_date_format(self):
        """Test with invalid date format"""
        return self.run_test(
            "Get Availability with Invalid Date",
            "GET",
            "api/availability/invalid-date",
            500  # Should handle gracefully
        )

    def test_create_appointment_missing_fields(self):
        """Test creating appointment with missing required fields"""
        incomplete_data = {
            "name": "Test User",
            # Missing required fields
        }
        
        return self.run_test(
            "Create Appointment with Missing Fields (should fail)",
            "POST",
            "api/appointments",
            422,  # Validation error
            data=incomplete_data
        )

def main():
    print("🚀 Starting Belz Meeting Room API Tests")
    print("=" * 50)
    
    tester = BelzMeetingRoomAPITester()
    
    # Test sequence
    test_results = []
    
    # 1. Health check
    success, _ = tester.test_health_endpoint()
    test_results.append(("Health Check", success))
    
    # 2. Get availability (empty state)
    success, _ = tester.test_get_availability()
    test_results.append(("Get Availability", success))
    
    # 3. Get appointments (empty state)
    success, _ = tester.test_get_appointments()
    test_results.append(("Get Appointments", success))
    
    # 4. Create appointment
    success, _ = tester.test_create_appointment()
    test_results.append(("Create Appointment", success))
    
    # 5. Get availability (with appointment)
    success, _ = tester.test_get_availability()
    test_results.append(("Get Availability (with data)", success))
    
    # 6. Get appointments (with appointment)
    success, _ = tester.test_get_appointments()
    test_results.append(("Get Appointments (with data)", success))
    
    # 7. Test conflict prevention
    success, _ = tester.test_create_conflicting_appointment()
    test_results.append(("Conflict Prevention", success))
    
    # 8. Test edge cases
    success, _ = tester.test_invalid_date_format()
    test_results.append(("Invalid Date Handling", success))
    
    success, _ = tester.test_create_appointment_missing_fields()
    test_results.append(("Missing Fields Validation", success))
    
    # 9. Delete appointment
    success, _ = tester.test_delete_appointment()
    test_results.append(("Delete Appointment", success))
    
    # 10. Delete non-existent appointment
    success, _ = tester.test_delete_nonexistent_appointment()
    test_results.append(("Delete Non-existent", success))
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
    
    for test_name, passed in test_results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n📈 Overall Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the details above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())