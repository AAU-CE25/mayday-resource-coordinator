import requests

class OSMClient:
    BASE_URL = "https://nominatim.openstreetmap.org/search"

    @staticmethod
    def get_coordinates_from_address(address: str):
        params = {
            "q": address,
            "format": "json",
            "limit": 1
        }
        headers = {"User-Agent": "Semester Project CE1 - Mayday Resource Coordinator (wg38up@student.aau.dk)"}
        
        try:

            response = requests.get(OSMClient.BASE_URL, params=params, headers=headers)
            response.raise_for_status()

            data = response.json()
            if not data:
                return None

            return float(data[0]["lat"]), float(data[0]["lon"])
        except requests.RequestException as e:
            print(f"Error fetching coordinates: {e}")
            return float(0.0), float(0.0)
    @staticmethod
    def get_address_from_coordinates(lat: float, lon: float):
        raise NotImplementedError("Reverse geocoding not implemented yet.")
