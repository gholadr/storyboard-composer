from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# In-memory storage for shots (in production, this would be a database)
shots = []

@app.route('/api/shots', methods=['GET'])
def get_shots():
    return jsonify(shots)

@app.route('/api/shots', methods=['POST'])
def create_shot():
    shot = request.json
    shots.append(shot)
    return jsonify(shot), 201

@app.route('/api/shots/<int:shot_id>', methods=['PUT'])
def update_shot(shot_id):
    if 0 <= shot_id < len(shots):
        shot = request.json
        shots[shot_id] = shot
        return jsonify(shot)
    return jsonify({"error": "Shot not found"}), 404

@app.route('/api/shots/<int:shot_id>', methods=['DELETE'])
def delete_shot(shot_id):
    if 0 <= shot_id < len(shots):
        shots.pop(shot_id)
        return '', 204
    return jsonify({"error": "Shot not found"}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)
