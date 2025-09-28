from flask import Blueprint, jsonify

example_bp = Blueprint('example_bp', __name__)
 
@example_bp.route('/', methods=['GET'])
def get_example():
    """Example endpoint"""
    return jsonify({"message": "This is an example endpoint from the Flask server!"}), 200 