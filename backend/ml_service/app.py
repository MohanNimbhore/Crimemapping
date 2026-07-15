from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.cluster import KMeans
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# Global variables for models
models = {
    'risk_predictor': None,
    'hotspot_detector': None,
    'label_encoders': {},
    'scaler': None
}

def initialize_models():
    """Initialize or load pre-trained models"""
    models['risk_predictor'] = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1
    )
    models['scaler'] = StandardScaler()

initialize_models()

def extract_features(crime_data):
    """Extract features from crime data"""
    features = []
    for crime in crime_data:
        # Parse date and time
        date = datetime.strptime(crime.get('crime_date', '2024-01-01'), '%Y-%m-%d')
        time_str = crime.get('crime_time', '12:00')
        hour = int(time_str.split(':')[0])

        feature_vector = [
            hour,
            date.weekday(),
            date.month,
            crime.get('latitude', 0),
            crime.get('longitude', 0),
            1 if crime.get('severity') == 'critical' else 2 if crime.get('severity') == 'high' else 3 if crime.get('severity') == 'medium' else 4,
        ]
        features.append(feature_vector)

    return np.array(features)

def calculate_area_density(crime_data, lat, lng, radius=0.01):
    """Calculate crime density around a location"""
    count = 0
    for crime in crime_data:
        c_lat = float(crime.get('latitude', 0))
        c_lng = float(crime.get('longitude', 0))
        if abs(c_lat - lat) < radius and abs(c_lng - lng) < radius:
            count += 1
    return count

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'models_loaded': models['risk_predictor'] is not None
    })

@app.route('/predict', methods=['POST'])
def predict_risk():
    """Predict risk level for a given location"""
    try:
        data = request.json
        lat = data.get('latitude', 0)
        lng = data.get('longitude', 0)
        hour = data.get('hour', datetime.now().hour)
        crime_data = data.get('crimes', [])

        if not crime_data:
            return jsonify({
                'risk_score': 30,
                'risk_level': 'low',
                'confidence': 0.6,
                'factors': {'message': 'Insufficient historical data'}
            })

        # Calculate area statistics
        area_crimes = [c for c in crime_data
                       if abs(float(c.get('latitude', 0)) - lat) < 0.01
                       and abs(float(c.get('longitude', 0)) - lng) < 0.01]

        area_density = len(area_crimes)
        severity_scores = []
        for c in area_crimes:
            sev = c.get('severity', 'medium')
            score = 4 if sev == 'critical' else 3 if sev == 'high' else 2 if sev == 'medium' else 1
            severity_scores.append(score)

        avg_severity = np.mean(severity_scores) if severity_scores else 2

        # Calculate risk score
        base_score = 20
        density_score = min(area_density * 3, 40)
        severity_score = avg_severity * 8
        time_score = 15 if hour >= 20 or hour < 6 else 5

        risk_score = min(100, base_score + density_score + severity_score + time_score + np.random.uniform(-5, 5))

        # Determine risk level
        if risk_score >= 70:
            risk_level = 'high'
        elif risk_score >= 40:
            risk_level = 'medium'
        else:
            risk_level = 'low'

        confidence = 0.7 + min(area_density / 20, 0.25)

        factors = {
            'area_density': 'high' if area_density > 10 else 'medium' if area_density > 5 else 'low',
            'nearby_crimes': area_density,
            'avg_severity': round(avg_severity, 2),
            'time_risk': 'high' if hour >= 20 or hour < 6 else 'medium' if hour >= 16 else 'low',
            'recommended_action': 'Increase patrol frequency' if risk_level == 'high' else 'Monitor area' if risk_level == 'medium' else 'Standard monitoring'
        }

        return jsonify({
            'risk_score': round(risk_score, 2),
            'risk_level': risk_level,
            'confidence': round(confidence, 2),
            'factors': factors
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/detect-hotspots', methods=['POST'])
def detect_hotspots():
    """Detect crime hotspots using K-Means clustering"""
    try:
        data = request.json
        crimes = data.get('crimes', [])
        k = data.get('k', 8)

        if len(crimes) < k:
            k = max(1, len(crimes))

        # Extract coordinates
        coordinates = []
        for crime in crimes:
            try:
                lat = float(crime.get('latitude', 0))
                lng = float(crime.get('longitude', 0))
                crime_type = crime.get('crime_type', 'Unknown')
                coordinates.append({
                    'lat': lat,
                    'lng': lng,
                    'type': crime_type,
                    'severity': crime.get('severity', 'medium')
                })
            except (ValueError, TypeError):
                continue

        if len(coordinates) < k:
            return jsonify({'hotspots': [], 'message': 'Not enough data points for clustering'})

        # Perform K-Means clustering
        coords_array = np.array([[c['lat'], c['lng']] for c in coordinates])
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels = kmeans.fit_predict(coords_array)

        # Build hotspot results
        hotspots = []
        for i in range(k):
            cluster_points = [coordinates[j] for j in range(len(coordinates)) if labels[j] == i]

            if not cluster_points:
                continue

            center_lat = np.mean([p['lat'] for p in cluster_points])
            center_lng = np.mean([p['lng'] for p in cluster_points])

            # Calculate radius (standard deviation)
            lat_std = np.std([p['lat'] for p in cluster_points])
            lng_std = np.std([p['lng'] for p in cluster_points])
            radius = max(300, min(1000, (lat_std + lng_std) * 50000))

            # Determine risk level
            crime_count = len(cluster_points)
            if crime_count >= 15:
                risk_level = 'high'
            elif crime_count >= 8:
                risk_level = 'medium'
            else:
                risk_level = 'low'

            # Count crime types
            crime_types = {}
            for p in cluster_points:
                crime_types[p['type']] = crime_types.get(p['type'], 0) + 1

            hotspots.append({
                'latitude': round(center_lat, 6),
                'longitude': round(center_lng, 6),
                'radius': int(radius),
                'crime_count': crime_count,
                'risk_level': risk_level,
                'area_name': f'Hotspot Zone {i + 1}',
                'crime_types': crime_types
            })

        # Sort by crime count
        hotspots.sort(key=lambda x: x['crime_count'], reverse=True)

        return jsonify({
            'hotspots': hotspots,
            'total_clusters': len(hotspots),
            'total_crimes_analyzed': len(coordinates)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/train', methods=['POST'])
def train_model():
    """Train the prediction model with provided data"""
    try:
        data = request.json
        crimes = data.get('crimes', [])

        if len(crimes) < 10:
            return jsonify({
                'message': 'Need at least 10 crime records to train',
                'trained': False
            })

        # Extract features and labels
        X = extract_features(crimes)

        # Create labels based on area density
        y = []
        for crime in crimes:
            lat = float(crime.get('latitude', 0))
            lng = float(crime.get('longitude', 0))
            density = calculate_area_density(crimes, lat, lng)
            label = 2 if density > 10 else 1 if density > 5 else 0
            y.append(label)

        y = np.array(y)

        # Train model
        models['risk_predictor'].fit(X, y)

        return jsonify({
            'message': f'Model trained successfully with {len(crimes)} records',
            'trained': True,
            'timestamp': datetime.now().isoformat()
        })

    except Exception as e:
        return jsonify({'error': str(e), 'trained': False}), 500

@app.route('/batch-predict', methods=['POST'])
def batch_predict():
    """Generate predictions for multiple locations"""
    try:
        data = request.json
        crimes = data.get('crimes', [])
        threshold = data.get('threshold', 40)

        predictions = []
        processed_locations = set()

        for crime in crimes:
            lat = float(crime.get('latitude', 0))
            lng = float(crime.get('longitude', 0))

            location_key = f"{round(lat, 3)},{round(lng, 3)}"

            if location_key in processed_locations:
                continue

            processed_locations.add(location_key)

            # Calculate area stats
            area_crimes = [c for c in crimes
                          if abs(float(c.get('latitude', 0)) - lat) < 0.01
                          and abs(float(c.get('longitude', 0)) - lng) < 0.01]

            area_density = len(area_crimes)

            # Simple risk calculation
            risk_score = 20 + area_density * 3 + np.random.uniform(0, 20)

            if risk_score >= threshold:
                predictions.append({
                    'latitude': round(lat, 6),
                    'longitude': round(lng, 6),
                    'risk_score': round(min(risk_score, 100), 2),
                    'risk_level': 'high' if risk_score >= 70 else 'medium',
                    'area_name': crime.get('area_name', 'Unknown Area'),
                    'confidence': round(0.7 + min(area_density / 30, 0.25), 2)
                })

        # Sort by risk score
        predictions.sort(key=lambda x: x['risk_score'], reverse=True)

        return jsonify({
            'predictions': predictions[:50],  # Return top 50
            'total': len(predictions)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
